#!/usr/bin/env bun

/**
 * Sourcify Source Code Fetcher
 *
 * Fetches verified contract source code from Sourcify API
 * and saves it in a structured directory format.
 *
 * Sourcify is a decentralized contract verification service.
 * No API key required.
 *
 * Note: Some chains (like Zircuit) use custom explorers, not Sourcify.
 * Use etherscan-v2-source for Etherscan-compatible chains.
 *
 * Usage:
 *   bun run sourcify-source.ts <address> [options]
 *
 * Options:
 *   --chain <chainId>    Chain ID (default: 1 for mainnet)
 *   --output <dir>       Output directory (default: .temp)
 *
 * Examples:
 *   bun run sourcify-source.ts 0x1234... --chain gnosis
 *   bun run sourcify-source.ts 0x1234... --chain 100
 *
 * @version 1.0.0
 */
import * as fs from "fs";
import * as path from "path";

// =============================================================================
// Chain Configuration
// =============================================================================

interface ChainConfig {
  chainId: number;
  name: string;
}

// Chains that commonly use Sourcify (not Etherscan)
const CHAINS: Record<string, ChainConfig> = {
  // Ethereum Mainnet (also on Sourcify)
  "1": { chainId: 1, name: "mainnet" },
  mainnet: { chainId: 1, name: "mainnet" },
  ethereum: { chainId: 1, name: "mainnet" },

  // Gnosis Chain
  "100": { chainId: 100, name: "gnosis" },
  gnosis: { chainId: 100, name: "gnosis" },
  xdai: { chainId: 100, name: "gnosis" },

  // Celo
  "42220": { chainId: 42220, name: "celo" },
  celo: { chainId: 42220, name: "celo" },

  // Aurora
  "1313161554": { chainId: 1313161554, name: "aurora" },
  aurora: { chainId: 1313161554, name: "aurora" },

  // Moonbeam
  "1284": { chainId: 1284, name: "moonbeam" },
  moonbeam: { chainId: 1284, name: "moonbeam" },

  // Moonriver
  "1285": { chainId: 1285, name: "moonriver" },
  moonriver: { chainId: 1285, name: "moonriver" },

  // Arbitrum (also on Sourcify)
  "42161": { chainId: 42161, name: "arbitrum" },
  arbitrum: { chainId: 42161, name: "arbitrum" },

  // Optimism (also on Sourcify)
  "10": { chainId: 10, name: "optimism" },
  optimism: { chainId: 10, name: "optimism" },

  // Polygon (also on Sourcify)
  "137": { chainId: 137, name: "polygon" },
  polygon: { chainId: 137, name: "polygon" },

  // Base (also on Sourcify)
  "8453": { chainId: 8453, name: "base" },
  base: { chainId: 8453, name: "base" },

  // Linea (also on Sourcify)
  "59144": { chainId: 59144, name: "linea" },
  linea: { chainId: 59144, name: "linea" },

  // Scroll
  "534352": { chainId: 534352, name: "scroll" },
  scroll: { chainId: 534352, name: "scroll" },

  // zkSync Era
  "324": { chainId: 324, name: "zksync" },
  zksync: { chainId: 324, name: "zksync" },

  // Mantle
  "5000": { chainId: 5000, name: "mantle" },
  mantle: { chainId: 5000, name: "mantle" },
};

// =============================================================================
// Sourcify API
// =============================================================================

const SOURCIFY_API_BASE = "https://sourcify.dev/server";

interface SourcifyFile {
  name: string;
  path: string;
  content: string;
}

interface SourcifyResponse {
  address: string;
  chainId: string;
  match: "exact_match" | "partial_match";
  creationMatch: string;
  runtimeMatch: string;
  verifiedAt: string;
  abiEncodedConstructorArguments?: string;
  // V2 API returns files in a different structure
  files?: {
    sources: Record<string, { content: string }>;
    metadata?: string;
  };
  // Or in legacy format
  sources?: Record<string, { content: string }>;
  metadata?: Record<string, unknown>;
}

interface SourcifyFilesResponse {
  status: string;
  files: Array<{
    name: string;
    path: string;
    content: string;
  }>;
}

async function fetchFromSourcify(
  chainId: number,
  address: string
): Promise<{ contract: SourcifyResponse; files: SourcifyFile[] }> {
  // Try V2 API first
  const v2Url = `${SOURCIFY_API_BASE}/v2/contract/${chainId}/${address}`;

  console.log(`⏳ Fetching from Sourcify V2 API...`);

  const v2Response = await fetch(v2Url);

  if (v2Response.ok) {
    const data = (await v2Response.json()) as SourcifyResponse;

    // V2 returns files in sources object
    const files: SourcifyFile[] = [];

    if (data.files?.sources) {
      for (const [filePath, fileData] of Object.entries(data.files.sources)) {
        files.push({
          name: path.basename(filePath),
          path: filePath,
          content: fileData.content,
        });
      }
    } else if (data.sources) {
      for (const [filePath, fileData] of Object.entries(data.sources)) {
        files.push({
          name: path.basename(filePath),
          path: filePath,
          content: fileData.content,
        });
      }
    }

    return { contract: data, files };
  }

  // Fall back to files endpoint
  console.log(`⏳ Trying Sourcify files endpoint...`);

  const filesUrl = `${SOURCIFY_API_BASE}/files/any/${chainId}/${address}`;
  const filesResponse = await fetch(filesUrl);

  if (!filesResponse.ok) {
    if (filesResponse.status === 404) {
      throw new Error(
        `Contract not verified on Sourcify. Verify at: https://sourcify.dev/#/verifier`
      );
    }
    throw new Error(
      `Sourcify API error: ${filesResponse.status} ${filesResponse.statusText}`
    );
  }

  const filesData = (await filesResponse.json()) as SourcifyFilesResponse;

  // Build a mock contract response
  const contract: SourcifyResponse = {
    address,
    chainId: String(chainId),
    match: "exact_match",
    creationMatch: "exact_match",
    runtimeMatch: "exact_match",
    verifiedAt: new Date().toISOString(),
  };

  const files: SourcifyFile[] = filesData.files
    .filter((f) => f.name.endsWith(".sol") || f.name === "metadata.json")
    .map((f) => ({
      name: f.name,
      path: f.path,
      content: f.content,
    }));

  return { contract, files };
}

// =============================================================================
// Metadata Extraction
// =============================================================================

interface ContractMetadata {
  contractName: string;
  compilerVersion: string;
  optimizationUsed: boolean;
  runs: number;
  evmVersion: string;
}

function extractMetadataFromFiles(files: SourcifyFile[]): ContractMetadata {
  // Find metadata.json
  const metadataFile = files.find(
    (f) => f.name === "metadata.json" || f.path.endsWith("metadata.json")
  );

  const defaults: ContractMetadata = {
    contractName: "Unknown",
    compilerVersion: "0.8.19",
    optimizationUsed: true,
    runs: 200,
    evmVersion: "paris",
  };

  if (!metadataFile) {
    return defaults;
  }

  try {
    const metadata = JSON.parse(metadataFile.content);

    // Extract compiler version
    let compilerVersion = defaults.compilerVersion;
    if (metadata.compiler?.version) {
      const match = metadata.compiler.version.match(/(\d+\.\d+\.\d+)/);
      compilerVersion = match ? match[1] : defaults.compilerVersion;
    }

    // Extract optimization settings
    let optimizationUsed = defaults.optimizationUsed;
    let runs = defaults.runs;
    if (metadata.settings?.optimizer) {
      optimizationUsed = metadata.settings.optimizer.enabled ?? true;
      runs = metadata.settings.optimizer.runs ?? 200;
    }

    // Extract EVM version
    const evmVersion = metadata.settings?.evmVersion ?? defaults.evmVersion;

    // Extract contract name from compilation target
    let contractName = defaults.contractName;
    if (metadata.settings?.compilationTarget) {
      const targets = Object.entries(metadata.settings.compilationTarget);
      if (targets.length > 0) {
        contractName = targets[0][1] as string;
      }
    }

    return {
      contractName,
      compilerVersion,
      optimizationUsed,
      runs,
      evmVersion,
    };
  } catch {
    return defaults;
  }
}

// =============================================================================
// File System Operations
// =============================================================================

function getDateSuffix(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function saveSourceFiles(
  files: SourcifyFile[],
  outputDir: string,
  chainId: number,
  address: string,
  metadata: ContractMetadata,
  verificationData: SourcifyResponse
): string {
  const dateSuffix = getDateSuffix();
  const targetDir = path.join(
    outputDir,
    String(chainId),
    address.toLowerCase(),
    `implementation-${dateSuffix}`
  );

  // Create directory structure
  fs.mkdirSync(targetDir, { recursive: true });

  // Save each source file (excluding metadata.json from source files)
  for (const file of files) {
    if (file.name === "metadata.json") continue;

    // Clean up the path - remove any leading slashes or "sources/" prefix
    let cleanPath = file.path;
    if (cleanPath.startsWith("/")) {
      cleanPath = cleanPath.slice(1);
    }
    if (cleanPath.startsWith("sources/")) {
      cleanPath = cleanPath.slice(8);
    }

    const resolvedTargetDir = path.resolve(targetDir);
    const filePath = path.resolve(path.join(targetDir, cleanPath));
    if (!filePath.startsWith(resolvedTargetDir + path.sep)) {
      console.warn(`Skipping unsafe path from Sourcify response: ${file.path}`);
      continue;
    }
    const fileDir = path.dirname(filePath);

    fs.mkdirSync(fileDir, { recursive: true });
    fs.writeFileSync(filePath, file.content);
  }

  // Save metadata
  const metadataPath = path.join(targetDir, "_metadata.json");
  fs.writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        contractName: metadata.contractName,
        compilerVersion: `v${metadata.compilerVersion}`,
        optimizationUsed: metadata.optimizationUsed,
        runs: metadata.runs,
        evmVersion: metadata.evmVersion,
        match: verificationData.match,
        verifiedAt: verificationData.verifiedAt,
        fetchedAt: new Date().toISOString(),
        source: "sourcify",
      },
      null,
      2
    )
  );

  // Generate foundry.toml for easy compilation
  const foundryToml = `[profile.default]
src = "."
out = "out"
libs = ["lib"]
solc = "${metadata.compilerVersion}"
optimizer = ${metadata.optimizationUsed}
optimizer_runs = ${metadata.runs}
evm_version = "${metadata.evmVersion}"
`;

  fs.writeFileSync(path.join(targetDir, "foundry.toml"), foundryToml);

  // Create empty lib directory (required by Forge)
  fs.mkdirSync(path.join(targetDir, "lib"), { recursive: true });

  return targetDir;
}

// =============================================================================
// CLI
// =============================================================================

function printUsage() {
  console.log(`
Sourcify Source Code Fetcher v1.0.0

Usage:
  bun run sourcify-source.ts <address> [options]

Options:
  --chain <id|name>    Chain ID or name (default: 1)
  --output <dir>       Output directory (default: .temp)

Note: No API key required - Sourcify is a public service.
      Some chains (like Zircuit) use custom explorers - use etherscan-v2-source instead.

Supported Chains (commonly verified on Sourcify):
  mainnet (1), gnosis (100), celo (42220), aurora (1313161554),
  moonbeam (1284), scroll (534352), arbitrum (42161), optimism (10),
  polygon (137), base (8453), linea (59144), zksync (324), mantle (5000)

Examples:
  bun run sourcify-source.ts 0x1234...abcd --chain gnosis
  bun run sourcify-source.ts 0x1234...abcd --chain 100 --output ./contracts
`);
}

interface CLIOptions {
  address: string;
  chainId: number;
  chainName: string;
  outputDir: string;
}

function parseArgs(): CLIOptions | null {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return null;
  }

  // Find address (first arg that looks like an address)
  const address = args.find((arg) => /^0x[a-fA-F0-9]{40}$/.test(arg));
  if (!address) {
    console.error("Error: No valid address provided");
    return null;
  }

  // Parse chain
  let chainId = 1;
  let chainName = "mainnet";
  const chainIdx = args.indexOf("--chain");
  if (chainIdx !== -1 && args[chainIdx + 1]) {
    const chainArg = args[chainIdx + 1];
    const chainConfig = CHAINS[chainArg] || CHAINS[chainArg.toLowerCase()];

    if (chainConfig) {
      chainId = chainConfig.chainId;
      chainName = chainConfig.name;
    } else if (/^\d+$/.test(chainArg)) {
      chainId = parseInt(chainArg, 10);
      chainName = `chain-${chainId}`;
    } else {
      console.error(`Error: Unknown chain "${chainArg}"`);
      return null;
    }
  }

  // Parse output directory
  let outputDir = ".temp";
  const outputIdx = args.indexOf("--output");
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputDir = args[outputIdx + 1];
  }

  return { address, chainId, chainName, outputDir };
}

async function main() {
  const options = parseArgs();

  if (!options) {
    printUsage();
    process.exit(1);
  }

  console.log("═".repeat(60));
  console.log(" Sourcify Source Fetcher");
  console.log("═".repeat(60));
  console.log(`Chain:   ${options.chainName} (${options.chainId})`);
  console.log(`Address: ${options.address}`);
  console.log("─".repeat(60));

  try {
    // Fetch from Sourcify
    const { contract, files } = await fetchFromSourcify(
      options.chainId,
      options.address
    );

    if (files.length === 0) {
      console.error("\n❌ No source files found");
      process.exit(1);
    }

    // Extract metadata
    const metadata = extractMetadataFromFiles(files);

    console.log(`✅ Found: ${metadata.contractName}`);
    console.log(`   Compiler: v${metadata.compilerVersion}`);
    console.log(
      `   Optimization: ${metadata.optimizationUsed ? "Yes" : "No"} (${
        metadata.runs
      } runs)`
    );
    console.log(`   Match: ${contract.match}`);

    // Count source files (excluding metadata.json)
    const sourceFiles = files.filter((f) => f.name !== "metadata.json");
    console.log(`\n⏳ Extracting source files...`);
    console.log(`   Found ${sourceFiles.length} source file(s)`);

    // Save files
    const outputPath = saveSourceFiles(
      files,
      options.outputDir,
      options.chainId,
      options.address,
      metadata,
      contract
    );

    console.log("\n" + "═".repeat(60));
    console.log(`✅ Source code saved to: ${outputPath}`);
    console.log("═".repeat(60));

    // List saved files
    console.log("\nFiles:");
    for (const file of sourceFiles) {
      let cleanPath = file.path;
      if (cleanPath.startsWith("/")) cleanPath = cleanPath.slice(1);
      if (cleanPath.startsWith("sources/")) cleanPath = cleanPath.slice(8);
      console.log(`  📄 ${cleanPath}`);
    }
    console.log(`  📋 _metadata.json`);
    console.log(`  ⚙️  foundry.toml (auto-generated)`);
    console.log(`  📁 lib/ (empty, for Forge)`);

    console.log("\n💡 Ready to build with Forge:");
    console.log(`   cd ${outputPath}`);
    console.log(`   forge build`);
  } catch (error) {
    console.error(
      `\n❌ Error: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  }
}

main();
