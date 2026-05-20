#!/usr/bin/env bun

/**
 * Storage Layout Validator for Forge
 *
 * Complete validation tool that:
 * 1. Checks Forge installation and version compatibility
 * 2. Generates storage layouts from contracts
 * 3. Validates upgrade safety between before/after layouts
 *
 * Usage:
 *   # Compare existing JSON files
 *   bun run validate-storage.ts <before.json> <after.json>
 *
 *   # Generate and compare for a contract
 *   bun run validate-storage.ts --contract <Contract.sol:Name> --before-ref <git-ref>
 *
 *   # Just check forge installation
 *   bun run validate-storage.ts --check-forge
 *
 * @version 1.0.0
 */
import { $ } from "bun";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

// =============================================================================
// Forge Version Compatibility
// =============================================================================

interface VersionRange {
  minVersion: string;
  maxVersion: string;
  description: string;
}

const FORGE_VERSIONS: Record<string, VersionRange> = {
  "v0.2.0": {
    minVersion: "0.2.0",
    maxVersion: "0.3.999",
    description: "Standard storage layout format",
  },
  "v0.1.0": {
    minVersion: "0.1.0",
    maxVersion: "0.1.999",
    description: "Legacy format (compatible)",
  },
};

const CURRENT_SCHEMA_VERSION = "v0.2.0";

// =============================================================================
// Zod Schemas
// =============================================================================

const StorageEntrySchema = z.object({
  astId: z.number().describe("AST node ID (compiler-dependent)"),
  contract: z.string().describe("Contract path"),
  label: z.string().describe("Variable name"),
  offset: z.number().min(0).max(31).describe("Byte offset within slot"),
  slot: z.string().regex(/^\d+$/).describe("Storage slot as decimal string"),
  type: z.string().describe("Type identifier"),
});

const StorageLayoutSchema = z.object({
  storage: z.array(StorageEntrySchema),
  types: z.record(z.any()).optional(),
});

type StorageEntry = z.infer<typeof StorageEntrySchema>;
type StorageLayout = z.infer<typeof StorageLayoutSchema>;

// =============================================================================
// Forge Helpers
// =============================================================================

interface ForgeCheckResult {
  installed: boolean;
  version: string | null;
  compatible: boolean;
  schemaVersion: string | null;
  error?: string;
}

async function checkForge(): Promise<ForgeCheckResult> {
  try {
    const result = await $`forge --version`.text();
    const match = result.match(/(\d+\.\d+\.\d+)/);
    const version = match?.[1] || null;

    if (!version) {
      return {
        installed: true,
        version: null,
        compatible: false,
        schemaVersion: null,
        error: "Could not parse version",
      };
    }

    // Check compatibility
    const [major, minor] = version.split(".").map(Number);
    let schemaVersion: string | null = null;

    if (major === 0 && minor >= 2) {
      schemaVersion = "v0.2.0";
    } else if (major === 0 && minor >= 1) {
      schemaVersion = "v0.1.0";
    }

    return {
      installed: true,
      version,
      compatible: schemaVersion !== null,
      schemaVersion,
    };
  } catch {
    return {
      installed: false,
      version: null,
      compatible: false,
      schemaVersion: null,
      error: "Forge not found in PATH",
    };
  }
}

async function generateStorageLayout(
  contractId: string
): Promise<StorageLayout> {
  // Clean and build first
  await $`forge build`.quiet();

  // Generate storage layout
  const result =
    await $`forge inspect ${contractId} storage-layout --json`.text();
  const parsed = JSON.parse(result);
  return StorageLayoutSchema.parse(parsed);
}

// =============================================================================
// Gap Detection
// =============================================================================

const GAP_PATTERNS = {
  exact: /^__gap$/,
  variations: /^_*gap_*$/i,
  loose: /gap/i,
};

type GapMatchType = "exact" | "variation" | "loose" | "none";

function classifyGapVariable(entry: StorageEntry): GapMatchType {
  if (!entry.type.startsWith("t_array")) return "none";
  if (GAP_PATTERNS.exact.test(entry.label)) return "exact";
  if (GAP_PATTERNS.variations.test(entry.label)) return "variation";
  if (GAP_PATTERNS.loose.test(entry.label)) return "loose";
  return "none";
}

function isGapVariable(entry: StorageEntry): boolean {
  return classifyGapVariable(entry) !== "none";
}

function parseArraySize(type: string): number | null {
  const match = type.match(/t_array\([^)]+\)(\d+)_storage/);
  return match ? parseInt(match[1], 10) : null;
}

function calculateEndSlot(entry: StorageEntry): number {
  const startSlot = parseInt(entry.slot, 10);
  const arraySize = parseArraySize(entry.type);
  return arraySize ? startSlot + arraySize - 1 : startSlot;
}

// =============================================================================
// Validation Logic
// =============================================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateStorageUpgrade(
  before: StorageLayout,
  after: StorageLayout
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Group entries
  const beforeRegular = before.storage.filter((e) => !isGapVariable(e));
  const afterRegular = after.storage.filter((e) => !isGapVariable(e));
  const beforeGaps = before.storage.filter((e) => isGapVariable(e));
  const afterGaps = after.storage.filter((e) => isGapVariable(e));

  // Build maps — key by slot:offset to correctly handle packed variables
  // (multiple variables sharing one slot at different byte offsets)
  const slotOffsetKey = (e: StorageEntry) => `${e.slot}:${e.offset}`;
  const beforeBySlot = new Map(beforeRegular.map((e) => [slotOffsetKey(e), e]));
  const afterBySlot = new Map(afterRegular.map((e) => [slotOffsetKey(e), e]));
  const beforeByLabel = new Map(beforeRegular.map((e) => [e.label, e]));

  // Calculate gap ranges
  const beforeGapRanges = beforeGaps.map((g) => ({
    entry: g,
    startSlot: parseInt(g.slot, 10),
    endSlot: calculateEndSlot(g),
    matchType: classifyGapVariable(g),
  }));

  const afterGapRanges = afterGaps.map((g) => ({
    entry: g,
    startSlot: parseInt(g.slot, 10),
    endSlot: calculateEndSlot(g),
    matchType: classifyGapVariable(g),
  }));

  // Warn about loose gap matches
  for (const gap of [...beforeGapRanges, ...afterGapRanges]) {
    if (gap.matchType === "loose") {
      warnings.push(
        `POSSIBLE GAP: "${gap.entry.label}" at slot ${gap.entry.slot} contains "gap" but doesn't match standard pattern`
      );
    }
  }

  // Check existing slots
  for (const [key, beforeEntry] of beforeBySlot) {
    const afterEntry = afterBySlot.get(key);
    const slotDesc = beforeEntry.offset > 0
      ? `slot ${beforeEntry.slot} offset ${beforeEntry.offset}`
      : `slot ${beforeEntry.slot}`;

    if (!afterEntry) {
      errors.push(
        `SLOT EMPTIED: ${slotDesc} had "${beforeEntry.label}" but is now empty`
      );
      continue;
    }

    if (beforeEntry.label !== afterEntry.label) {
      warnings.push(
        `LABEL RENAMED: ${slotDesc}: "${beforeEntry.label}" → "${afterEntry.label}"`
      );
    }

    // Check type compatibility
    const beforeBaseType = beforeEntry.type.replace(/\(\w+\)\d+/, "(...)");
    const afterBaseType = afterEntry.type.replace(/\(\w+\)\d+/, "(...)");

    if (beforeBaseType !== afterBaseType) {
      if (
        beforeEntry.type.includes("t_contract") &&
        afterEntry.type.includes("t_contract")
      ) {
        const beforeInterface =
          beforeEntry.type.match(/t_contract\((\w+)\)/)?.[1];
        const afterInterface =
          afterEntry.type.match(/t_contract\((\w+)\)/)?.[1];
        if (beforeInterface !== afterInterface) {
          warnings.push(
            `INTERFACE CHANGED: ${slotDesc}: ${beforeInterface} → ${afterInterface}`
          );
        }
      } else {
        errors.push(
          `TYPE CHANGED: ${slotDesc} "${beforeEntry.label}": ${beforeEntry.type} → ${afterEntry.type}`
        );
      }
    }
  }

  // Check for shifted slots
  for (const [label, beforeEntry] of beforeByLabel) {
    const afterEntry = afterBySlot.get(slotOffsetKey(beforeEntry));
    if (afterEntry && afterEntry.label !== label) {
      const afterByLabelEntry = Array.from(afterBySlot.values()).find(
        (e) => e.label === label
      );
      if (afterByLabelEntry && afterByLabelEntry.slot !== beforeEntry.slot) {
        errors.push(
          `SLOT SHIFTED: "${label}" moved from slot ${beforeEntry.slot} to slot ${afterByLabelEntry.slot}`
        );
      }
    }
  }

  // Check gap end slots
  for (const beforeGap of beforeGapRanges) {
    const matchingAfterGap = afterGapRanges.find(
      (ag) => ag.endSlot === beforeGap.endSlot
    );

    if (!matchingAfterGap) {
      errors.push(
        `GAP END SLOT CHANGED: __gap ending at slot ${beforeGap.endSlot} has no matching gap in after layout`
      );
      continue;
    }

    const beforeSize = parseArraySize(beforeGap.entry.type) || 0;
    const afterSize = parseArraySize(matchingAfterGap.entry.type) || 0;

    if (afterSize > beforeSize) {
      errors.push(
        `GAP GREW: __gap cannot grow (${beforeSize} → ${afterSize} slots)`
      );
    } else if (afterSize < beforeSize) {
      warnings.push(
        `GAP SHRUNK: __gap reduced by ${
          beforeSize - afterSize
        } slot(s) (${beforeSize} → ${afterSize}), start: ${
          beforeGap.startSlot
        } → ${matchingAfterGap.startSlot}, end: ${beforeGap.endSlot}`
      );
    }
  }

  // Find the highest slot used by non-gap variables in before layout
  let maxBeforeSlot = -1;
  for (const entry of beforeRegular) {
    const slotNum = parseInt(entry.slot, 10);
    if (slotNum > maxBeforeSlot) {
      maxBeforeSlot = slotNum;
    }
  }

  // Check new variables
  for (const [slot, afterEntry] of afterBySlot) {
    if (!beforeBySlot.has(slot)) {
      const slotNum = parseInt(slot, 10);
      const wasInGap = beforeGapRanges.some(
        (g) => slotNum >= g.startSlot && slotNum <= g.endSlot
      );

      if (wasInGap) {
        warnings.push(
          `NEW VARIABLE: "${afterEntry.label}" at slot ${slot} (allocated from __gap)`
        );
      } else if (slotNum > maxBeforeSlot && beforeGapRanges.length === 0) {
        // If there were no gaps at all, adding at the end is safe (but not ideal)
        warnings.push(
          `NEW VARIABLE AT END: "${afterEntry.label}" at slot ${slot} (no __gap existed, appended at end - consider adding __gap for future upgrades)`
        );
      } else if (
        slotNum > maxBeforeSlot &&
        !beforeGapRanges.some((g) => g.endSlot >= slotNum)
      ) {
        // There are gaps but none cover this slot - it's after all gaps
        warnings.push(
          `NEW VARIABLE AT END: "${afterEntry.label}" at slot ${slot} (beyond existing __gap - consider extending __gap reservation)`
        );
      } else {
        errors.push(
          `INVALID NEW SLOT: "${afterEntry.label}" at slot ${slot} - not part of a __gap and would collide with existing storage`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// =============================================================================
// CLI
// =============================================================================

function printUsage() {
  console.log(`
Storage Layout Validator for Forge v1.0.0
Schema: ${CURRENT_SCHEMA_VERSION} (Forge ${FORGE_VERSIONS[CURRENT_SCHEMA_VERSION].minVersion} - ${FORGE_VERSIONS[CURRENT_SCHEMA_VERSION].maxVersion})

Usage:
  bun run validate-storage.ts <before.json> <after.json>
  bun run validate-storage.ts --check-forge
  bun run validate-storage.ts --generate <Contract.sol:Name> -o <output.json>

Options:
  --check-forge      Check Forge installation and version
  --generate         Generate storage layout for a contract
  -o, --output       Output file for generated layout

Examples:
  # Check Forge installation
  bun run validate-storage.ts --check-forge

  # Generate storage layout
  bun run validate-storage.ts --generate contracts/MyContract.sol:MyContract -o storage.json

  # Compare two layouts
  bun run validate-storage.ts storage-before.json storage-after.json
`);
}

async function main() {
  const args = process.argv.slice(2);

  // Handle --check-forge
  if (args.includes("--check-forge")) {
    console.log("═".repeat(50));
    console.log(" Forge Installation Check");
    console.log("═".repeat(50));

    const result = await checkForge();

    if (!result.installed) {
      console.log("\n❌ Forge is NOT installed");
      console.log("\nTo install:");
      console.log("  curl -L https://foundry.paradigm.xyz | bash");
      console.log("  foundryup");
      process.exit(1);
    }

    console.log(`\n✅ Forge ${result.version} installed`);
    console.log(`   Schema: ${result.schemaVersion}`);
    console.log(`   Compatible: ${result.compatible ? "Yes ✅" : "No ⚠️"}`);
    process.exit(result.compatible ? 0 : 1);
  }

  // Handle --generate
  const generateIdx = args.indexOf("--generate");
  if (generateIdx !== -1) {
    const contractId = args[generateIdx + 1];
    const outputIdx =
      args.indexOf("-o") !== -1 ? args.indexOf("-o") : args.indexOf("--output");
    const outputFile =
      outputIdx !== -1 ? args[outputIdx + 1] : "storage-layout.json";

    if (!contractId) {
      console.error("Error: --generate requires a contract identifier");
      process.exit(1);
    }

    console.log(`Generating storage layout for ${contractId}...`);

    try {
      const layout = await generateStorageLayout(contractId);
      fs.writeFileSync(outputFile, JSON.stringify(layout, null, 2));
      console.log(`✅ Storage layout saved to ${outputFile}`);
      process.exit(0);
    } catch (error) {
      console.error(`Error generating storage layout: ${error}`);
      process.exit(1);
    }
  }

  // Handle comparison mode
  if (args.length !== 2 || args[0].startsWith("-")) {
    printUsage();
    process.exit(1);
  }

  const [beforePath, afterPath] = args;

  // Check Forge first
  const forgeCheck = await checkForge();
  if (!forgeCheck.compatible) {
    console.warn(
      `⚠️  Forge ${forgeCheck.version || "unknown"} may not be fully compatible`
    );
  }

  // Read and parse files
  let beforeJson: unknown;
  let afterJson: unknown;

  try {
    beforeJson = JSON.parse(fs.readFileSync(path.resolve(beforePath), "utf-8"));
  } catch {
    console.error(`Error reading before file: ${beforePath}`);
    process.exit(1);
  }

  try {
    afterJson = JSON.parse(fs.readFileSync(path.resolve(afterPath), "utf-8"));
  } catch {
    console.error(`Error reading after file: ${afterPath}`);
    process.exit(1);
  }

  // Validate schemas
  const beforeResult = StorageLayoutSchema.safeParse(beforeJson);
  if (!beforeResult.success) {
    console.error("Before file schema validation failed");
    console.error(beforeResult.error.format());
    process.exit(1);
  }

  const afterResult = StorageLayoutSchema.safeParse(afterJson);
  if (!afterResult.success) {
    console.error("After file schema validation failed");
    console.error(afterResult.error.format());
    process.exit(1);
  }

  // Run validation
  console.log("═".repeat(60));
  console.log(" Storage Layout Validator for Forge v1.0.0");
  console.log(
    `  Schema: ${CURRENT_SCHEMA_VERSION} | Forge: ${
      forgeCheck.version || "unknown"
    }`
  );
  console.log("═".repeat(60));
  console.log(`Before: ${beforePath}`);
  console.log(`After:  ${afterPath}`);
  console.log("─".repeat(60));

  const result = validateStorageUpgrade(beforeResult.data, afterResult.data);

  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    for (const warning of result.warnings) {
      console.log(`   ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    for (const error of result.errors) {
      console.log(`   ${error}`);
    }
  }

  console.log("\n" + "═".repeat(60));
  if (result.valid) {
    console.log("✅ Storage layout is UPGRADE SAFE");
  } else {
    console.log("❌ Storage layout is NOT UPGRADE SAFE");
  }
  console.log("═".repeat(60));

  process.exit(result.valid ? 0 : 1);
}

main();
