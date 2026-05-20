#!/usr/bin/env bun

/**
 * Generate Upgrade TX
 *
 * Generates Gnosis Safe Transaction Builder JSON files for proxy upgrades.
 *
 * Usage:
 *   bun run generate-upgrade-tx.ts --network linea --proxy 0x... --implementation 0x...
 *   bun run generate-upgrade-tx.ts --config upgrades.json
 *   bun run generate-upgrade-tx.ts --help
 */
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Types
// ============================================================================

interface ContractMethod {
  name: string;
  payable: boolean;
  inputs: {
    name: string;
    internalType: string;
    type: "uint256" | "bool" | "address" | "bytes";
  }[];
}

interface Tx {
  to: string;
  value: string;
  data: string;
  contractMethod: ContractMethod;
  contractInputsValues: { [key: string]: string };
}

interface TxBuilder {
  version: string;
  chainId: string | number;
  createdAt: number;
  meta: {
    name: string;
    description: string;
    txBuilderVersion: string;
    createdFromSafeAddress: string;
    createdFromOwnerAddress: string;
    checksum: string;
  };
  transactions: Tx[];
}

interface UpgradeConfig {
  network: string;
  chainId: number;
  proxyAdmin: string;
  proxy: string;
  implementation: string;
  safeAddress: string;
  contractName?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PROXY_ADMIN_UPGRADE_METHOD: ContractMethod = {
  name: "upgrade",
  payable: false,
  inputs: [
    { name: "proxy", internalType: "address", type: "address" },
    { name: "implementation", internalType: "address", type: "address" },
  ],
};

// Default Safe addresses (Omnichain)
const SAFE_ADDRESSES = {
  secureAdmin: "0x9DB42D3BDA1525963db3B2372C4DAABaf0491A53",
  generalAdmin: "0x77E98434541711388fd9F92FA378dB98b93C3f45",
  insecureAdmin: "0x410303943dc392631FB202F429C363DeA1FEb2E2",
  treasury: "0xDb73ba19F072D0Fbc865781Ba468A9F8B77aD2C4",
};

// Known network configurations
const NETWORKS: Record<string, { chainId: number; proxyAdmin?: string }> = {
  linea: {
    chainId: 59144,
    proxyAdmin: "0xb15242E8e4B76F3075C1eB6465Bf269617407889",
  },
  unichain: {
    chainId: 130,
    proxyAdmin: "0x6CC6192A8525dBab3f0c3b0d936e962Bf5Fd547A",
  },
  zircuit: {
    chainId: 48900,
    proxyAdmin: "0xD67a00753CA96046038CD5b6f0956D371452DE8a",
  },
  injective: { chainId: 2525 },
  plasma: { chainId: 810181 },
  mainnet: { chainId: 1 },
  arbitrum: { chainId: 42161 },
  optimism: { chainId: 10 },
  base: { chainId: 8453 },
  polygon: { chainId: 137 },
};

// ============================================================================
// SafeTxBuilder Class
// ============================================================================

class SafeTxBuilder {
  private _name: string;
  private _chainId: string | number;
  private _transactions: Tx[] = [];
  private _options: {
    version: string;
    description: string;
    txBuilderVersion: string;
    createdFromSafeAddress: string;
    createdFromOwnerAddress: string;
  };
  private _createdAt: number;

  constructor(
    name: string,
    chainId: string | number,
    options: {
      version?: string;
      description?: string;
      txBuilderVersion?: string;
      createdFromSafeAddress?: string;
      createdFromOwnerAddress?: string;
    } = {}
  ) {
    this._name = name;
    this._chainId = chainId;
    this._createdAt = Date.now();
    this._options = {
      version: options.version || "0.0.1",
      description: options.description || "",
      txBuilderVersion: options.txBuilderVersion || "1.11.1",
      createdFromSafeAddress: options.createdFromSafeAddress || "",
      createdFromOwnerAddress: options.createdFromOwnerAddress || "",
    };
  }

  addTransaction(
    toAddress: string,
    contractMethod: ContractMethod,
    contractInputsValues: { [key: string]: string },
    options: { value?: string; data?: string } = {}
  ): this {
    this._transactions.push({
      to: toAddress,
      value: options.value || "0",
      data: options.data || "",
      contractMethod,
      contractInputsValues: { ...contractInputsValues },
    });
    return this;
  }

  build(): TxBuilder {
    return {
      version: this._options.version,
      chainId: this._chainId,
      createdAt: this._createdAt,
      meta: {
        name: this._name,
        description: this._options.description,
        txBuilderVersion: this._options.txBuilderVersion,
        createdFromSafeAddress: this._options.createdFromSafeAddress,
        createdFromOwnerAddress: this._options.createdFromOwnerAddress,
        checksum: this._generateChecksum(),
      },
      transactions: [...this._transactions],
    };
  }

  private _generateChecksum(): string {
    const checksumData = {
      name: this._name,
      chainId: this._chainId,
      version: this._options.version,
      transactions: this._transactions.map((tx) => ({
        to: tx.to,
        value: tx.value,
        data: tx.data,
        contractMethod: {
          name: tx.contractMethod.name,
          inputs: tx.contractMethod.inputs.map((input) => ({
            name: input.name,
            type: input.type,
            internalType: input.internalType,
          })),
        },
        contractInputsValues: tx.contractInputsValues,
      })),
    };

    const jsonString = JSON.stringify(
      checksumData,
      Object.keys(checksumData).sort()
    );
    const hash = createHash("sha256").update(jsonString).digest("hex");
    return hash.substring(0, 16);
  }
}

// ============================================================================
// Core Functions
// ============================================================================

function generateUpgradeTx(config: UpgradeConfig): TxBuilder {
  const contractName = config.contractName || "Contract";
  const builder = new SafeTxBuilder(
    `${contractName} Upgrade - ${config.network}`,
    config.chainId,
    {
      description: `Upgrade ${contractName} proxy to new implementation on ${config.network}`,
      createdFromSafeAddress: config.safeAddress,
    }
  );

  builder.addTransaction(config.proxyAdmin, PROXY_ADMIN_UPGRADE_METHOD, {
    proxy: config.proxy,
    implementation: config.implementation,
  });

  return builder.build();
}

function writeOutput(data: TxBuilder, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

// ============================================================================
// CLI
// ============================================================================

function printHelp(): void {
  console.log(`
Generate Upgrade TX - Gnosis Safe Transaction Builder JSON Generator

USAGE:
  bun run generate-upgrade-tx.ts [OPTIONS]

OPTIONS:
  --network <name>        Network name (linea, unichain, zircuit, etc.)
  --chain-id <id>         Chain ID (optional if network is known)
  --proxy-admin <addr>    ProxyAdmin contract address
  --proxy <addr>          Proxy contract address to upgrade
  --implementation <addr> New implementation address
  --safe <addr>           Safe address (default: Secure Admin Safe)
  --contract-name <name>  Contract name for labeling (default: "Contract")
  --output <path>         Output file path (default: ./output.json)
  --config <path>         JSON config file with multiple upgrades
  --help                  Show this help message

EXAMPLES:
  # Single upgrade
  bun run generate-upgrade-tx.ts \\
    --network linea \\
    --proxy-admin 0xb15242E8e4B76F3075C1eB6465Bf269617407889 \\
    --proxy 0xd8a57006f464d1AaEEB450754489c66f29f8A9b9 \\
    --implementation 0xDb3998a5a51AEb926D6E631F9868100048D7d12b \\
    --contract-name EpochController \\
    --output ./linea-upgrade.json

  # From config file
  bun run generate-upgrade-tx.ts --config ./upgrades.json

CONFIG FILE FORMAT:
  {
    "upgrades": [
      {
        "network": "linea",
        "chainId": 59144,
        "proxyAdmin": "0x...",
        "proxy": "0x...",
        "implementation": "0x...",
        "safeAddress": "0x...",
        "contractName": "EpochController"
      }
    ],
    "outputDir": "./safe-txs"
  }
`);
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        args[key] = value;
        i++;
      } else {
        args[key] = "true";
      }
    }
  }

  return args;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Handle config file mode
  if (args.config) {
    const configPath = args.config;
    if (!fs.existsSync(configPath)) {
      console.error(`❌ Config file not found: ${configPath}`);
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const outputDir = config.outputDir || "./safe-txs";

    console.log("🔧 Generating Safe TX files from config...\n");

    for (const upgrade of config.upgrades) {
      const txData = generateUpgradeTx({
        network: upgrade.network,
        chainId: upgrade.chainId,
        proxyAdmin: upgrade.proxyAdmin,
        proxy: upgrade.proxy,
        implementation: upgrade.implementation,
        safeAddress: upgrade.safeAddress || SAFE_ADDRESSES.secureAdmin,
        contractName: upgrade.contractName,
      });

      const filename = `${upgrade.network}-${(
        upgrade.contractName || "contract"
      ).toLowerCase()}-upgrade.json`;
      const outputPath = path.join(outputDir, filename);
      writeOutput(txData, outputPath);

      console.log(
        `✅ ${upgrade.network.toUpperCase()} - ${
          upgrade.contractName || "Contract"
        }`
      );
      console.log(`   Output: ${outputPath}\n`);
    }

    console.log("🎉 All Safe TX files generated!");
    process.exit(0);
  }

  // Handle single upgrade mode
  const network = args.network;
  const networkConfig = network ? NETWORKS[network.toLowerCase()] : undefined;

  const chainId = args["chain-id"]
    ? parseInt(args["chain-id"])
    : networkConfig?.chainId;
  const proxyAdmin = args["proxy-admin"] || networkConfig?.proxyAdmin;
  const proxy = args.proxy;
  const implementation = args.implementation;
  const safeAddress = args.safe || SAFE_ADDRESSES.secureAdmin;
  const contractName = args["contract-name"] || "Contract";
  const output = args.output || "./output.json";

  // Validation
  if (!chainId) {
    console.error(
      "❌ Chain ID required. Use --chain-id or --network with a known network."
    );
    process.exit(1);
  }
  if (!proxyAdmin) {
    console.error("❌ ProxyAdmin address required. Use --proxy-admin.");
    process.exit(1);
  }
  if (!proxy) {
    console.error("❌ Proxy address required. Use --proxy.");
    process.exit(1);
  }
  if (!implementation) {
    console.error("❌ Implementation address required. Use --implementation.");
    process.exit(1);
  }

  const txData = generateUpgradeTx({
    network: network || `chain-${chainId}`,
    chainId,
    proxyAdmin,
    proxy,
    implementation,
    safeAddress,
    contractName,
  });

  writeOutput(txData, output);

  console.log(`✅ Generated Safe TX file: ${output}`);
  console.log(`   Network: ${network || chainId}`);
  console.log(`   ProxyAdmin: ${proxyAdmin}`);
  console.log(`   Proxy: ${proxy}`);
  console.log(`   Implementation: ${implementation}`);
  console.log(`   Safe: ${safeAddress}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
