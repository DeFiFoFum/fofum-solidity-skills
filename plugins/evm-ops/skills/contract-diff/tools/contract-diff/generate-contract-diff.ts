#!/usr/bin/env bun

/**
 * Contract Diff Generator
 *
 * Generates side-by-side HTML diffs comparing old vs new implementation
 * contract source code for proxy upgrade review.
 *
 * Usage:
 *   bun run generate-contract-diff.ts [options] <contracts...>
 *
 * Arguments:
 *   contracts    One or more entries in format: ContractName:oldAddr:newAddr
 *
 * Options:
 *   --chain <name|id>    Chain name or ID (default: 1)
 *   --output <dir>       Output directory (default: ./diffs)
 *   --help, -h           Show usage
 *
 * Example:
 *   bun run generate-contract-diff.ts \
 *     --chain base \
 *     --output upgrades/base/20260224-diffs \
 *     PriceFeedV2:0xOLD...:0xNEW... \
 *     VesselManager:0xOLD...:0xNEW...
 *
 * @version 2.0.0
 */

import * as fs from "fs";
import * as path from "path";
import { $ } from "bun";
import {
  diffDirectories,
  rewriteDiffPaths,
  parseDiffStats,
  renderDiffHtml,
  renderIndexHtml,
  type IndexEntry,
  type DiffStats,
} from "../../lib/d_code-diff/src/index.ts";

// =============================================================================
// Types
// =============================================================================

interface ContractEntry {
  name: string;
  oldAddr: string;
  newAddr: string;
}

interface DiffResult {
  contract: ContractEntry;
  htmlFile: string;
  stats: DiffStats;
  identical: boolean;
}

// =============================================================================
// Constants
// =============================================================================

// This tool delegates source fetching to the etherscan-source tool, which ships
// in a sibling skill. Skills are installed as siblings by both Claude Code
// plugins and `npx skills`, so probe the known layouts rather than assuming one.
const ETHERSCAN_SOURCE_CANDIDATES = [
  // Explicit override, for non-standard installs
  process.env.ETHERSCAN_SOURCE_TOOL,
  // Sibling skill: <skills>/etherscan-source/tools/etherscan-source/...
  path.resolve(
    import.meta.dir,
    "../../../etherscan-source/tools/etherscan-source/etherscan-v2-source.ts"
  ),
  // Same tools/ directory, if both tools were vendored side by side
  path.resolve(import.meta.dir, "../etherscan-source/etherscan-v2-source.ts"),
].filter((candidate): candidate is string => Boolean(candidate));

const ETHERSCAN_SOURCE_TOOL =
  ETHERSCAN_SOURCE_CANDIDATES.find((candidate) => fs.existsSync(candidate)) ??
  ETHERSCAN_SOURCE_CANDIDATES[0]!;

const EXPLORER_URLS: Record<string, string> = {
  "1": "https://etherscan.io",
  mainnet: "https://etherscan.io",
  ethereum: "https://etherscan.io",
  "59144": "https://lineascan.build",
  linea: "https://lineascan.build",
  "42161": "https://arbiscan.io",
  arbitrum: "https://arbiscan.io",
  "8453": "https://basescan.org",
  base: "https://basescan.org",
  "137": "https://polygonscan.com",
  polygon: "https://polygonscan.com",
  "56": "https://bscscan.com",
  bsc: "https://bscscan.com",
  "10": "https://optimistic.etherscan.io",
  optimism: "https://optimistic.etherscan.io",
  "48900": "https://explorer.zircuit.com",
  zircuit: "https://explorer.zircuit.com",
  "130": "https://uniscan.xyz",
  unichain: "https://uniscan.xyz",
};

function explorerCodeUrl(chain: string, address: string): string {
  const base = EXPLORER_URLS[chain.toLowerCase()] || "https://etherscan.io";
  return `${base}/address/${address}#code`;
}

// =============================================================================
// CLI Parsing
// =============================================================================

interface CliOptions {
  chain: string;
  outputDir: string;
  contracts: ContractEntry[];
}

function printUsage(): void {
  console.log(`
Contract Diff Generator v2.0.0

Usage:
  bun run generate-contract-diff.ts [options] <contracts...>

Arguments:
  contracts    One or more entries in format: ContractName:oldAddr:newAddr

Options:
  --chain <name|id>    Chain name or ID (default: 1)
  --output <dir>       Output directory for HTML files (default: ./diffs)
  --help, -h           Show usage

Example:
  bun run generate-contract-diff.ts \\
    --chain base \\
    --output upgrades/base/20260224-diffs \\
    PriceFeedV2:0x019BA6C...:0x8F5428a... \\
    VesselManager:0xd0Da3E...:0x14a936...
`);
}

function parseContractArg(arg: string): ContractEntry {
  const parts = arg.split(":");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid contract format: "${arg}". Expected ContractName:oldAddr:newAddr`
    );
  }

  const [name, oldAddr, newAddr] = parts;

  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error(
      `Invalid contract name "${name}": only alphanumeric, hyphens, and underscores allowed`
    );
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(oldAddr)) {
    throw new Error(`Invalid old address for ${name}: ${oldAddr}`);
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(newAddr)) {
    throw new Error(`Invalid new address for ${name}: ${newAddr}`);
  }

  return { name, oldAddr, newAddr };
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    chain: "1",
    outputDir: "./diffs",
    contracts: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--chain" && args[i + 1]) {
      options.chain = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      options.outputDir = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      options.contracts.push(parseContractArg(arg));
    }
  }

  return options;
}

// =============================================================================
// Source Fetching (delegates to etherscan-v2-source.ts)
// =============================================================================

async function fetchSource(
  address: string,
  chain: string,
  outputDir: string
): Promise<string> {
  const sourcesDir = path.join(outputDir, "sources");

  const result =
    await $`bun run ${ETHERSCAN_SOURCE_TOOL} ${address} --chain ${chain} --output ${sourcesDir}`
      .text();

  // Extract the output path from the tool's stdout
  const match = result.match(/Source code saved to:\s*(.+)/);
  if (!match) {
    throw new Error(
      `Failed to parse output path from etherscan-v2-source for ${address}.\nOutput: ${result}`
    );
  }

  return match[1].trim();
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);

  if (options.contracts.length === 0) {
    console.error("Error: No contracts specified.");
    printUsage();
    process.exit(1);
  }

  // Verify etherscan source tool exists
  if (!fs.existsSync(ETHERSCAN_SOURCE_TOOL)) {
    console.error("Error: etherscan-v2-source.ts not found. Searched:");
    for (const candidate of ETHERSCAN_SOURCE_CANDIDATES) {
      console.error(`  - ${candidate}`);
    }
    console.error("");
    console.error("This tool needs the etherscan-source skill installed alongside it:");
    console.error("  npx skills add DeFiFoFum/fofum-solidity-skills --skill etherscan-source");
    console.error("Or set ETHERSCAN_SOURCE_TOOL to the absolute path of the script.");
    process.exit(1);
  }

  const outputDir = path.resolve(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("=".repeat(60));
  console.log(" Contract Diff Generator");
  console.log("=".repeat(60));
  console.log(`Chain:     ${options.chain}`);
  console.log(`Output:    ${outputDir}`);
  console.log(`Contracts: ${options.contracts.length}`);
  console.log("-".repeat(60));

  const results: DiffResult[] = [];

  for (const contract of options.contracts) {
    console.log(`\n>> ${contract.name}`);
    console.log(`   Old: ${contract.oldAddr}`);
    console.log(`   New: ${contract.newAddr}`);

    // Step 1: Fetch source code for both addresses
    console.log("   Fetching old implementation source...");
    const oldSourceDir = await fetchSource(
      contract.oldAddr,
      options.chain,
      outputDir
    );

    console.log("   Fetching new implementation source...");
    const newSourceDir = await fetchSource(
      contract.newAddr,
      options.chain,
      outputDir
    );

    // Step 2: Generate recursive diff of all source files
    console.log("   Generating diff (all .sol files)...");
    let unifiedDiff = await diffDirectories(oldSourceDir, newSourceDir, {
      exclude: ["_metadata.json", "_abi.json", "foundry.toml", "lib", "out"],
    });

    const identical = unifiedDiff.trim() === "";

    // Rewrite paths to use clean labels
    if (!identical) {
      const oldPrefix = contract.oldAddr.slice(0, 10);
      const newPrefix = contract.newAddr.slice(0, 10);
      unifiedDiff = rewriteDiffPaths(unifiedDiff, (rawPath, side) => {
        const baseDir = side === "old" ? oldSourceDir : newSourceDir;
        const addrPrefix = side === "old" ? oldPrefix : newPrefix;
        const prefix = side === "old" ? "a" : "b";
        const cleaned = rawPath.split("\t")[0].trim();
        const rel = path.relative(baseDir, cleaned);
        return `${prefix}/${rel}\t(${addrPrefix}...)`;
      });
    }

    const stats = identical
      ? { filesChanged: 0, linesAdded: 0, linesRemoved: 0 }
      : parseDiffStats(unifiedDiff);
    console.log(`   ${stats.filesChanged} file(s) changed`);

    // Step 3: Generate HTML
    console.log("   Generating HTML...");
    const oldUrl = explorerCodeUrl(options.chain, contract.oldAddr);
    const newUrl = explorerCodeUrl(options.chain, contract.newAddr);
    const headerHtml = `Old: <a href="${oldUrl}" target="_blank">${contract.oldAddr}</a><br>New: <a href="${newUrl}" target="_blank">${contract.newAddr}</a>`;

    const html = renderDiffHtml(unifiedDiff, {
      title: `${contract.name}: Implementation Diff`,
      theme: "dark",
      outputFormat: "side-by-side",
      headerHtml,
    });

    const htmlPath = path.resolve(outputDir, `${contract.name}.html`);
    if (!htmlPath.startsWith(path.resolve(outputDir) + path.sep)) {
      throw new Error(`Unsafe output path for contract "${contract.name}"`);
    }
    fs.writeFileSync(htmlPath, html);

    const status = identical
      ? "IDENTICAL"
      : `+${stats.linesAdded} / -${stats.linesRemoved}`;
    console.log(`   >> ${status} -> ${contract.name}.html`);

    results.push({
      contract,
      htmlFile: `${contract.name}.html`,
      stats,
      identical,
    });
  }

  // Generate index page
  const entries: IndexEntry[] = results.map((r) => {
    const oldUrl = explorerCodeUrl(options.chain, r.contract.oldAddr);
    const newUrl = explorerCodeUrl(options.chain, r.contract.newAddr);
    return {
      label: r.contract.name,
      href: `${r.contract.name}.html`,
      stats: r.stats,
      identical: r.identical,
      extra: {
        "Old Implementation": `<a href="${oldUrl}" target="_blank">${r.contract.oldAddr}</a>`,
        "New Implementation": `<a href="${newUrl}" target="_blank">${r.contract.newAddr}</a>`,
      },
    };
  });

  const indexHtml = renderIndexHtml(entries, {
    title: "Contract Upgrade Diffs",
    subtitle: `Chain: ${options.chain} | Generated: ${new Date().toISOString().slice(0, 10)}`,
    theme: "dark",
    extraColumns: ["Old Implementation", "New Implementation"],
  });
  fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(" Summary");
  console.log("=".repeat(60));
  for (const r of results) {
    const status = r.identical
      ? "IDENTICAL"
      : `${r.stats.filesChanged} file(s): +${r.stats.linesAdded} / -${r.stats.linesRemoved}`;
    console.log(`  ${r.contract.name.padEnd(40)} ${status}`);
  }
  console.log("-".repeat(60));
  console.log(`Output: ${outputDir}`);
  console.log(`  index.html + ${results.length} diff file(s)`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error(`\nFatal error: ${err}`);
  process.exit(1);
});
