#!/usr/bin/env bun
/**
 * Forge Installation & Version Checker
 *
 * Checks if Forge is installed and validates version compatibility
 * with the storage layout validator.
 *
 * Usage:
 *   bun run index.ts
 *   bun run index.ts --json
 *
 * Exit codes:
 *   0 - Forge is installed and compatible
 *   1 - Forge is not installed or incompatible
 */

import { $ } from "bun";

// =============================================================================
// Version Compatibility
// =============================================================================

interface VersionRange {
  minVersion: string;
  maxVersion: string;
  description: string;
}

const SUPPORTED_VERSIONS: Record<string, VersionRange> = {
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

// =============================================================================
// Version Parsing
// =============================================================================

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  raw: string;
}

function parseVersion(versionString: string): ParsedVersion | null {
  // Extract version from forge output like "forge 0.2.0 (abc1234 2024-01-01T00:00:00.000000000Z)"
  const match = versionString.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    raw: match[0],
  };
}

function compareVersions(a: ParsedVersion, b: string): number {
  const bParsed = parseVersion(b);
  if (!bParsed) return 0;

  if (a.major !== bParsed.major) return a.major - bParsed.major;
  if (a.minor !== bParsed.minor) return a.minor - bParsed.minor;
  return a.patch - bParsed.patch;
}

function isVersionInRange(
  version: ParsedVersion,
  range: VersionRange
): boolean {
  return (
    compareVersions(version, range.minVersion) >= 0 &&
    compareVersions(version, range.maxVersion) <= 0
  );
}

// =============================================================================
// Main
// =============================================================================

interface CheckResult {
  installed: boolean;
  version: ParsedVersion | null;
  compatible: boolean;
  schemaVersion: string | null;
  error?: string;
}

async function checkForge(): Promise<CheckResult> {
  try {
    // Try to run forge --version
    const result = await $`forge --version`.text();

    const version = parseVersion(result);
    if (!version) {
      return {
        installed: true,
        version: null,
        compatible: false,
        schemaVersion: null,
        error: `Could not parse Forge version from: ${result}`,
      };
    }

    // Find compatible schema version
    let compatibleSchema: string | null = null;
    for (const [schemaKey, range] of Object.entries(SUPPORTED_VERSIONS)) {
      if (isVersionInRange(version, range)) {
        compatibleSchema = schemaKey;
        break;
      }
    }

    return {
      installed: true,
      version,
      compatible: compatibleSchema !== null,
      schemaVersion: compatibleSchema,
    };
  } catch (error) {
    return {
      installed: false,
      version: null,
      compatible: false,
      schemaVersion: null,
      error: "Forge is not installed or not in PATH",
    };
  }
}

async function main() {
  console.log("═".repeat(50));
  console.log(" Forge Installation Checker");
  console.log("═".repeat(50));

  const result = await checkForge();

  if (!result.installed) {
    console.log("\n❌ Forge is NOT installed");
    console.log("\nTo install Foundry (includes Forge):");
    console.log("  curl -L https://foundry.paradigm.xyz | bash");
    console.log("  foundryup");
    process.exit(1);
  }

  console.log(`\n✅ Forge is installed`);
  console.log(`   Version: ${result.version?.raw || "unknown"}`);

  if (!result.compatible) {
    console.log(`\n⚠️  Version ${result.version?.raw} may not be compatible`);
    console.log("\nSupported versions:");
    for (const [key, range] of Object.entries(SUPPORTED_VERSIONS)) {
      console.log(
        `  ${key}: ${range.minVersion} - ${range.maxVersion} (${range.description})`
      );
    }
    process.exit(1);
  }

  console.log(`   Schema: ${result.schemaVersion}`);
  console.log(`   Status: Compatible ✅`);
  console.log("═".repeat(50));

  // Output JSON for programmatic use
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(0);
}

main();
