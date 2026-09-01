#!/usr/bin/env bun

/**
 * Etherscan V2 Source Code Fetcher
 *
 * Fetches verified contract source code from Etherscan V2 API
 * and saves it in a structured directory format.
 *
 * Usage:
 *   bun run etherscan-v2-source.ts <address> [options]
 *
 * Options:
 *   --chain <chainId>    Chain ID (default: 1 for mainnet)
 *   --env <path>         Path to .env file (default: searches up from cwd)
 *   --output <dir>       Output directory (default: .temp)
 *   --api-key <key>      API key (overrides .env)
 *
 * Environment:
 *   ETHERSCAN_V2_API_KEY - Universal API key for Etherscan V2 (works across all chains)
 *
 * Examples:
 *   bun run etherscan-v2-source.ts 0x1234... --chain 59144
 *   bun run etherscan-v2-source.ts 0x1234... --chain linea
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
  apiKeyEnvVar: string;
}

const CHAINS: Record<string, ChainConfig> = {
  // Mainnet
  "1": { chainId: 1, name: "mainnet", apiKeyEnvVar: "ETHERSCAN_V2_API_KEY" },
  mainnet: {
    chainId: 1,
    name: "mainnet",
    apiKeyEnvVar: "ETHERSCAN_V2_API_KEY",
  },
  ethereum: {
    chainId: 1,
    name: "mainnet",
    apiKeyEnvVar: "ETHERSCAN_V2_API_KEY",
  },

  // Linea
  "59144": { chainId: 59144, name: "linea", apiKeyEnvVar: "LINEASCAN_API_KEY" },
  linea: { chainId: 59144, name: "linea", apiKeyEnvVar: "LINEASCAN_API_KEY" },

  // Arbitrum
  "42161": {
    chainId: 42161,
    name: "arbitrum",
    apiKeyEnvVar: "ARBISCAN_API_KEY",
  },
  arbitrum: {
    chainId: 42161,
    name: "arbitrum",
    apiKeyEnvVar: "ARBISCAN_API_KEY",
  },

  // Base
  "8453": { chainId: 8453, name: "base", apiKeyEnvVar: "BASESCAN_API_KEY" },
  base: { chainId: 8453, name: "base", apiKeyEnvVar: "BASESCAN_API_KEY" },

  // Polygon
  "137": {
    chainId: 137,
    name: "polygon",
    apiKeyEnvVar: "POLYGONSCAN_API_KEY",
  },
  polygon: {
    chainId: 137,
    name: "polygon",
    apiKeyEnvVar: "POLYGONSCAN_API_KEY",
  },

  // BSC
  "56": { chainId: 56, name: "bsc", apiKeyEnvVar: "BSCSCAN_API_KEY" },
  bsc: { chainId: 56, name: "bsc", apiKeyEnvVar: "BSCSCAN_API_KEY" },

  // Optimism
  "10": {
    chainId: 10,
    name: "optimism",
    apiKeyEnvVar: "OPTIMISM_API_KEY",
  },
  optimism: {
    chainId: 10,
    name: "optimism",
    apiKeyEnvVar: "OPTIMISM_API_KEY",
  },

  // Zircuit
  "48900": {
    chainId: 48900,
    name: "zircuit",
    apiKeyEnvVar: "ZIRCUIT_API_KEY",
  },
  zircuit: {
    chainId: 48900,
    name: "zircuit",
    apiKeyEnvVar: "ZIRCUIT_API_KEY",
  },

  // Unichain
  "130": {
    chainId: 130,
    name: "unichain",
    apiKeyEnvVar: "UNISCAN_API_KEY",
  },
  unichain: {
    chainId: 130,
    name: "unichain",
    apiKeyEnvVar: "UNISCAN_API_KEY",
  },
};

// =============================================================================
// Environment Loading
// =============================================================================

function findEnvFile(startDir: string): string | null {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

function parseEnvFile(envPath: string): Record<string, string> {
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

/**
 * Load and merge env vars from plugin-level .env (global fallback) and
 * project-level .env (walked up from cwd). Project values take precedence.
 * Plugin .env lives at import.meta.dir/../../.env (plugins/evm-ops/.env).
 */
function loadMergedEnv(explicitEnvPath?: string | null): Record<string, string> {
  const merged: Record<string, string> = {};

  // 1. Plugin-level .env: global credentials (lowest priority)
  const pluginEnvPath = path.resolve(import.meta.dir, "../../.env");
  if (fs.existsSync(pluginEnvPath)) {
    Object.assign(merged, parseEnvFile(pluginEnvPath));
  }

  // 2. Project-level .env: overrides plugin .env
  const projectEnvPath = explicitEnvPath ?? findEnvFile(process.cwd());
  if (projectEnvPath && fs.existsSync(projectEnvPath)) {
    Object.assign(merged, parseEnvFile(projectEnvPath));
    console.log(`📁 Using .env from: ${projectEnvPath}`);
  }

  return merged;
}

function getApiKey(
  chain: ChainConfig,
  envVars: Record<string, string>,
  cliApiKey?: string
): string | null {
  // CLI override takes precedence
  if (cliApiKey) return cliApiKey;

  // Try chain-specific key first
  if (envVars[chain.apiKeyEnvVar]) {
    return envVars[chain.apiKeyEnvVar];
  }

  // Fall back to generic ETHERSCAN_V2_API_KEY (works for all chains in V2)
  if (envVars.ETHERSCAN_V2_API_KEY) {
    return envVars.ETHERSCAN_V2_API_KEY;
  }

  return null;
}

// =============================================================================
// Etherscan V2 API
// =============================================================================

interface SourceCodeResult {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: SourceCodeResult[] | string;
}

async function fetchSourceCode(
  address: string,
  chainId: number,
  apiKey: string
): Promise<SourceCodeResult> {
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = (await response.json()) as EtherscanResponse;

  if (data.status !== "1") {
    throw new Error(`API Error: ${data.message} - ${data.result}`);
  }

  if (!Array.isArray(data.result) || data.result.length === 0) {
    throw new Error("No source code found");
  }

  const result = data.result[0];

  if (!result.SourceCode || result.SourceCode === "") {
    throw new Error("Contract is not verified");
  }

  return result;
}

// =============================================================================
// Source Code Extraction
// =============================================================================

interface SourceFile {
  path: string;
  content: string;
}

function extractSourceFiles(sourceCode: string): SourceFile[] {
  const files: SourceFile[] = [];

  // Check if it's a JSON format (multiple files)
  if (sourceCode.startsWith("{") || sourceCode.startsWith("{{")) {
    try {
      // Handle double-wrapped JSON (Etherscan format)
      let jsonStr = sourceCode;
      if (sourceCode.startsWith("{{")) {
        jsonStr = sourceCode.slice(1, -1);
      }

      const parsed = JSON.parse(jsonStr);

      // Standard JSON input format
      if (parsed.sources) {
        for (const [filePath, fileData] of Object.entries(parsed.sources)) {
          const content =
            typeof fileData === "string"
              ? fileData
              : (fileData as { content: string }).content;
          files.push({ path: filePath, content });
        }
      }
      // Simple object format
      else {
        for (const [filePath, content] of Object.entries(parsed)) {
          if (typeof content === "string") {
            files.push({ path: filePath, content });
          } else if (
            typeof content === "object" &&
            content !== null &&
            "content" in content
          ) {
            files.push({
              path: filePath,
              content: (content as { content: string }).content,
            });
          }
        }
      }
    } catch {
      // If JSON parsing fails, treat as single file
      files.push({ path: "Contract.sol", content: sourceCode });
    }
  } else {
    // Single file source code
    files.push({ path: "Contract.sol", content: sourceCode });
  }

  return files;
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
  files: SourceFile[],
  outputDir: string,
  chainId: number,
  address: string,
  metadata: SourceCodeResult
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

  // Save each source file
  const resolvedTargetDir = path.resolve(targetDir);
  for (const file of files) {
    const filePath = path.resolve(path.join(targetDir, file.path));
    if (!filePath.startsWith(resolvedTargetDir + path.sep)) {
      console.warn(`Skipping unsafe path from Etherscan response: ${file.path}`);
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
        contractName: metadata.ContractName,
        compilerVersion: metadata.CompilerVersion,
        optimizationUsed: metadata.OptimizationUsed === "1",
        runs: parseInt(metadata.Runs, 10),
        evmVersion: metadata.EVMVersion,
        license: metadata.LicenseType,
        proxy: metadata.Proxy === "1",
        implementation: metadata.Implementation || null,
        fetchedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  // Save ABI
  if (metadata.ABI && metadata.ABI !== "Contract source code not verified") {
    const abiPath = path.join(targetDir, "_abi.json");
    try {
      const abi = JSON.parse(metadata.ABI);
      fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    } catch {
      fs.writeFileSync(abiPath, metadata.ABI);
    }
  }

  // Generate foundry.toml for easy compilation
  const solcVersion = extractSolcVersion(metadata.CompilerVersion);
  const optimizationUsed = metadata.OptimizationUsed === "1";
  const runs = parseInt(metadata.Runs, 10) || 200;

  const foundryToml = `[profile.default]
src = "."
out = "out"
libs = ["lib"]
solc = "${solcVersion}"
optimizer = ${optimizationUsed}
optimizer_runs = ${runs}
`;

  fs.writeFileSync(path.join(targetDir, "foundry.toml"), foundryToml);

  // Create empty lib directory (required by Forge)
  fs.mkdirSync(path.join(targetDir, "lib"), { recursive: true });

  return targetDir;
}

/**
 * Extract semver from compiler version string
 * e.g., "v0.8.13+commit.abaa5c0e" -> "0.8.13"
 */
function extractSolcVersion(compilerVersion: string): string {
  const match = compilerVersion.match(/v?(\d+\.\d+\.\d+)/);
  return match ? match[1] : "0.8.13"; // fallback
}

// =============================================================================
// CLI
// =============================================================================

function printUsage() {
  console.log(`
Etherscan V2 Source Code Fetcher v1.0.0

Usage:
  bun run etherscan-v2-source.ts <address> [options]

Options:
  --chain <id|name>    Chain ID or name (default: 1)
  --env <path>         Path to .env file
  --output <dir>       Output directory (default: .temp)
  --api-key <key>      API key (overrides .env)

Environment Variables:
  ETHERSCAN_V2_API_KEY - Universal API key (works for all chains)

Supported Chains:
  mainnet (1), linea (59144), arbitrum (42161), base (8453),
  polygon (137), bsc (56), optimism (10), zircuit (48900), unichain (130)

Examples:
  bun run etherscan-v2-source.ts 0x1234...abcd --chain linea
  bun run etherscan-v2-source.ts 0x1234...abcd --chain 59144 --output ./contracts
`);
}

function parseArgs(args: string[]): {
  address: string | null;
  chain: string;
  envPath: string | null;
  outputDir: string;
  apiKey: string | null;
} {
  const result = {
    address: null as string | null,
    chain: "1",
    envPath: null as string | null,
    outputDir: ".temp",
    apiKey: null as string | null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--chain" && args[i + 1]) {
      result.chain = args[++i];
    } else if (arg === "--env" && args[i + 1]) {
      result.envPath = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      result.outputDir = args[++i];
    } else if (arg === "--api-key" && args[i + 1]) {
      result.apiKey = args[++i];
    } else if (!arg.startsWith("-") && !result.address) {
      result.address = arg;
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const options = parseArgs(args);

  if (!options.address) {
    console.error("Error: Contract address is required");
    printUsage();
    process.exit(1);
  }

  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(options.address)) {
    console.error("Error: Invalid Ethereum address format");
    process.exit(1);
  }

  // Get chain config
  const chainConfig = CHAINS[options.chain.toLowerCase()];
  if (!chainConfig) {
    console.error(`Error: Unknown chain "${options.chain}"`);
    console.error("Supported chains:", Object.keys(CHAINS).join(", "));
    process.exit(1);
  }

  // Load environment: merges plugin-level .env with project-level .env
  const envVars = loadMergedEnv(options.envPath);

  // Get API key
  const apiKey = getApiKey(chainConfig, envVars, options.apiKey ?? undefined);
  if (!apiKey) {
    console.error(`Error: No API key found. Set ETHERSCAN_V2_API_KEY in .env`);
    process.exit(1);
  }

  console.log("═".repeat(60));
  console.log(" Etherscan V2 Source Fetcher");
  console.log("═".repeat(60));
  console.log(`Chain:   ${chainConfig.name} (${chainConfig.chainId})`);
  console.log(`Address: ${options.address}`);
  console.log("─".repeat(60));

  try {
    // Fetch source code
    console.log("\n⏳ Fetching source code...");
    const sourceData = await fetchSourceCode(
      options.address,
      chainConfig.chainId,
      apiKey
    );

    console.log(`✅ Found: ${sourceData.ContractName}`);
    console.log(`   Compiler: ${sourceData.CompilerVersion}`);
    console.log(
      `   Optimization: ${
        sourceData.OptimizationUsed === "1"
          ? `Yes (${sourceData.Runs} runs)`
          : "No"
      }`
    );

    if (sourceData.Proxy === "1" && sourceData.Implementation) {
      console.log(`   Proxy Implementation: ${sourceData.Implementation}`);
    }

    // Extract and save files
    console.log("\n⏳ Extracting source files...");
    const files = extractSourceFiles(sourceData.SourceCode);
    console.log(`   Found ${files.length} source file(s)`);

    const outputPath = saveSourceFiles(
      files,
      options.outputDir,
      chainConfig.chainId,
      options.address,
      sourceData
    );

    console.log("\n" + "═".repeat(60));
    console.log(`✅ Source code saved to: ${outputPath}`);
    console.log("═".repeat(60));

    // List saved files
    console.log("\nFiles:");
    for (const file of files) {
      console.log(`  📄 ${file.path}`);
    }
    console.log(`  📋 _metadata.json`);
    console.log(`  📋 _abi.json`);
    console.log(`  ⚙️  foundry.toml (auto-generated)`);
    console.log(`  📁 lib/ (empty, for Forge)`);

    console.log("\n💡 Ready to build with Forge:");
    console.log(`   cd ${outputPath}`);
    console.log(`   forge build`);
  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
    process.exit(1);
  }
}

main();
