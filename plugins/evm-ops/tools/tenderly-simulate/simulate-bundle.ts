#!/usr/bin/env bun

/**
 * Tenderly Safe Transaction Simulation
 *
 * Simulates Gnosis Safe transaction batches on Tenderly.
 *
 * Two modes:
 *   --safe-tx (default for .safe.json)
 *     Encodes the full Safe execTransaction → MultiSend delegatecall
 *     as a single atomic simulation. Produces one Tenderly link showing
 *     the complete call trace. Uses state overrides to bypass signatures.
 *
 *   --bundle
 *     Submits each transaction individually via simulate-bundle API.
 *     Produces one link per transaction.
 *
 * Usage:
 *   bun run simulate-bundle.ts <batch.safe.json>
 *   bun run simulate-bundle.ts --bundle <batch.safe.json>
 *   bun run simulate-bundle.ts <batch.tenderly.json>
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

// ============================================================================
// Types
// ============================================================================

interface TenderlySimulation {
  network_id: string;
  from: string;
  to: string;
  input: string;
  value: string;
  gas?: number;
  gas_price?: string;
  save: boolean;
  save_if_fails: boolean;
  simulation_type: "quick" | "full";
  description?: string;
  state_objects?: Record<string, { storage: Record<string, string> }>;
}

interface TenderlyBundle {
  simulations: TenderlySimulation[];
}

interface SafeJson {
  version: string;
  chainId: string;
  meta: {
    name: string;
    description: string;
    createdFromSafeAddress: string;
    [key: string]: unknown;
  };
  transactions: {
    to: string;
    value: string;
    data: string;
  }[];
}

interface TenderlyConfig {
  user: string;
  project: string;
  accessKey: string;
}

interface SimulationResult {
  index: number;
  id: string;
  status: boolean;
  gasUsed: number;
  method: string;
  description: string;
  error: string | null;
}

interface SafeTxResult {
  id: string;
  status: boolean;
  gasUsed: number;
  method: string;
  error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

// Safe 1.3.0 canonical MultiSend (supports delegatecall)
const MULTISEND_ADDRESS = "0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761";

// Safe 1.3.0 EIP-712 type hash for SafeTx
const SAFE_TX_TYPEHASH =
  "0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8";

// RPC URLs by chain ID (fallbacks)
const DEFAULT_RPC: Record<string, string> = {
  "1": "https://eth.llamarpc.com",
  "8453": "https://mainnet.base.org",
  "42161": "https://arb1.arbitrum.io/rpc",
  "10": "https://mainnet.optimism.io",
  "137": "https://polygon-rpc.com",
  "59144": "https://rpc.linea.build",
};

// ============================================================================
// Hex / ABI Helpers
// ============================================================================

function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    result.set(a, offset);
    offset += a.length;
  }
  return result;
}

function padLeft(hex: string, bytes: number): string {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  return h.padStart(bytes * 2, "0");
}

function uint256Hex(value: bigint | number): string {
  return padLeft(BigInt(value).toString(16), 32);
}

function addressHex(addr: string): string {
  return padLeft(addr.replace("0x", "").toLowerCase(), 32);
}

/** Compute keccak256 using cast (available in the environment) */
function keccak256Hex(hexData: string): string {
  const h = hexData.startsWith("0x") ? hexData : "0x" + hexData;
  const result = Bun.spawnSync(["cast", "keccak", h]);
  if (result.exitCode !== 0) {
    throw new Error(
      `cast keccak failed (exit ${result.exitCode}): ${result.stderr.toString().trim()}`
    );
  }
  const output = result.stdout.toString().trim();
  if (!output.startsWith("0x")) {
    throw new Error(`cast keccak returned unexpected output: ${output}`);
  }
  return output;
}

// ============================================================================
// Env Loading
// ============================================================================

function loadEnvFile(envPath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return vars;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

/**
 * Merge plugin-level .env (global fallback at import.meta.dir/../../.env)
 * with the project-level .env. Project values take precedence.
 */
function loadMergedEnv(projectEnvPath: string): Record<string, string> {
  const merged: Record<string, string> = {};

  // 1. Plugin-level .env: global credentials (lowest priority)
  const pluginEnvPath = path.resolve(import.meta.dir, "../../.env");
  Object.assign(merged, loadEnvFile(pluginEnvPath));

  // 2. Project-level .env: overrides plugin .env
  Object.assign(merged, loadEnvFile(projectEnvPath));

  return merged;
}

function getTenderlyConfig(envPath: string): TenderlyConfig {
  const envFile = loadMergedEnv(envPath);
  const user = process.env.TENDERLY_USER || envFile.TENDERLY_USER;
  const project = process.env.TENDERLY_PROJECT || envFile.TENDERLY_PROJECT;
  const accessKey =
    process.env.TENDERLY_ACCESS_KEY || envFile.TENDERLY_ACCESS_KEY;

  if (!user || !project || !accessKey) {
    const missing: string[] = [];
    if (!user) missing.push("TENDERLY_USER");
    if (!project) missing.push("TENDERLY_PROJECT");
    if (!accessKey) missing.push("TENDERLY_ACCESS_KEY");
    console.error(`\nMissing Tenderly credentials: ${missing.join(", ")}`);
    console.error(`Set them in ${envPath} or as environment variables.\n`);
    process.exit(1);
  }

  return { user, project, accessKey };
}

function getRpcUrl(chainId: string, envPath: string): string {
  const envFile = loadMergedEnv(envPath);
  // Try common env var patterns
  const candidates = [
    process.env.RPC_URL,
    process.env.BASE_RPC_URL,
    process.env.BASE_MAINNET_RPC_URL,
    envFile.RPC_URL,
    envFile.BASE_RPC_URL,
    envFile.BASE_MAINNET_RPC_URL,
    DEFAULT_RPC[chainId],
  ];
  const rpc = candidates.find((r) => r && r.length > 0);
  if (!rpc) {
    console.error(
      `No RPC URL found for chain ${chainId}. Set RPC_URL or BASE_RPC_URL in .env, or use --rpc.`
    );
    process.exit(1);
  }
  return rpc;
}

// ============================================================================
// JSON-RPC Helpers
// ============================================================================

async function rpcCall(
  rpcUrl: string,
  method: string,
  params: unknown[]
): Promise<unknown> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data: any = await response.json();
  if (data.error) {
    throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

async function ethCall(
  rpcUrl: string,
  to: string,
  data: string
): Promise<string> {
  return (await rpcCall(rpcUrl, "eth_call", [
    { to, data },
    "latest",
  ])) as string;
}

// ============================================================================
// Safe Encoding
// ============================================================================

/**
 * Encode transactions into MultiSend packed format.
 * Each tx: operation (1 byte) + to (20 bytes) + value (32 bytes) + dataLength (32 bytes) + data
 */
function encodeMultiSendData(
  transactions: { to: string; value: string; data: string }[]
): string {
  let packed = "";
  for (const tx of transactions) {
    const operation = "00"; // CALL
    const to = tx.to.replace("0x", "").toLowerCase().padStart(40, "0");
    const value = uint256Hex(BigInt(tx.value || "0"));
    const data = tx.data.replace("0x", "");
    const dataLength = uint256Hex(data.length / 2);
    packed += operation + to + value + dataLength + data;
  }
  return packed;
}

/**
 * Encode multiSend(bytes) calldata
 * Selector: 0x8d80ff0a
 */
function encodeMultiSendCall(packedData: string): string {
  const selector = "8d80ff0a";
  const dataBytes = packedData;
  const dataLen = dataBytes.length / 2;

  // ABI encode: offset (32) + length (32) + data (padded to 32)
  const offset = uint256Hex(32); // offset to dynamic data
  const length = uint256Hex(dataLen);
  const paddedData = dataBytes.padEnd(
    dataBytes.length + ((32 - (dataLen % 32)) % 32) * 2,
    "0"
  );

  return "0x" + selector + offset + length + paddedData;
}

/**
 * Encode Safe execTransaction calldata.
 *
 * execTransaction(
 *   address to, uint256 value, bytes data, uint8 operation,
 *   uint256 safeTxGas, uint256 baseGas, uint256 gasPrice,
 *   address gasToken, address refundReceiver, bytes signatures
 * )
 */
function encodeExecTransaction(
  to: string,
  value: bigint,
  data: string,
  operation: number,
  signatures: string
): string {
  const selector = "6a761202"; // execTransaction selector

  // Fixed params
  const toEnc = addressHex(to);
  const valueEnc = uint256Hex(value);
  const operationEnc = uint256Hex(operation);
  const safeTxGasEnc = uint256Hex(0);
  const baseGasEnc = uint256Hex(0);
  const gasPriceEnc = uint256Hex(0);
  const gasTokenEnc = addressHex("0x0000000000000000000000000000000000000000");
  const refundReceiverEnc = addressHex(
    "0x0000000000000000000000000000000000000000"
  );

  // Dynamic data and signatures - compute offsets
  const dataBytes = data.replace("0x", "");
  const sigBytes = signatures.replace("0x", "");

  // 10 fixed params × 32 bytes = 320 bytes (0x140)
  // data offset = 320 (0x140)
  const dataOffset = uint256Hex(320);
  // signatures offset = 320 + 32 (length) + padded data
  const dataPaddedLen =
    dataBytes.length / 2 + ((32 - ((dataBytes.length / 2) % 32)) % 32);
  const sigOffset = uint256Hex(320 + 32 + dataPaddedLen);

  // Encode dynamic bytes: length + padded content
  const dataLenEnc = uint256Hex(dataBytes.length / 2);
  const dataPadded = dataBytes.padEnd(dataPaddedLen * 2, "0");

  const sigLenEnc = uint256Hex(sigBytes.length / 2);
  const sigPaddedLen =
    sigBytes.length / 2 + ((32 - ((sigBytes.length / 2) % 32)) % 32);
  const sigPadded = sigBytes.padEnd(sigPaddedLen * 2, "0");

  return (
    "0x" +
    selector +
    toEnc + // to
    valueEnc + // value
    dataOffset + // data offset
    operationEnc + // operation (1 = DELEGATECALL)
    safeTxGasEnc + // safeTxGas
    baseGasEnc + // baseGas
    gasPriceEnc + // gasPrice
    gasTokenEnc + // gasToken
    refundReceiverEnc + // refundReceiver
    sigOffset + // signatures offset
    dataLenEnc +
    dataPadded + // data
    sigLenEnc +
    sigPadded // signatures
  );
}

/**
 * Build approved-hash signatures for given owners (sorted ascending).
 * Format per owner: r = padded address (32 bytes), s = 0 (32 bytes), v = 1 (1 byte)
 */
function buildApprovedHashSignatures(owners: string[]): string {
  // Sort owners ascending by address
  const sorted = [...owners].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  let sigs = "";
  for (const owner of sorted) {
    const r = addressHex(owner);
    const s = uint256Hex(0);
    const v = "01";
    sigs += r + s + v;
  }
  return sigs;
}

/**
 * Compute the storage slot for approvedHashes[owner][hash] in Safe 1.3.0.
 * approvedHashes is at slot 8.
 * Nested mapping: keccak256(hash . keccak256(owner . 8))
 */
function computeApprovedHashSlot(owner: string, txHash: string): string {
  // First level: keccak256(abi.encode(owner, 8))
  const ownerSlot = keccak256Hex(
    "0x" + addressHex(owner) + uint256Hex(8)
  );

  // Second level: keccak256(abi.encode(txHash, ownerSlot))
  const h = txHash.replace("0x", "");
  const s = ownerSlot.replace("0x", "");
  const finalSlot = keccak256Hex("0x" + padLeft(h, 32) + padLeft(s, 32));

  return finalSlot;
}

/**
 * Compute Safe transaction hash (EIP-712).
 */
async function computeSafeTxHash(
  safeAddress: string,
  to: string,
  value: bigint,
  data: string,
  operation: number,
  nonce: bigint,
  rpcUrl: string
): Promise<string> {
  // Get domainSeparator from the Safe
  const domainSeparator = await ethCall(
    rpcUrl,
    safeAddress,
    "0xf698da25" // domainSeparator()
  );

  // Compute struct hash
  // keccak256(abi.encode(SAFE_TX_TYPEHASH, to, value, keccak256(data), operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, nonce))
  const dataHash = keccak256Hex(data);

  const structData =
    SAFE_TX_TYPEHASH.replace("0x", "") +
    addressHex(to) +
    uint256Hex(value) +
    dataHash.replace("0x", "") +
    uint256Hex(operation) +
    uint256Hex(0) + // safeTxGas
    uint256Hex(0) + // baseGas
    uint256Hex(0) + // gasPrice
    addressHex("0x0000000000000000000000000000000000000000") + // gasToken
    addressHex("0x0000000000000000000000000000000000000000") + // refundReceiver
    uint256Hex(nonce);

  const structHash = keccak256Hex("0x" + structData);

  // EIP-712: keccak256("\x19\x01" + domainSeparator + structHash)
  const encoded =
    "1901" +
    domainSeparator.replace("0x", "") +
    structHash.replace("0x", "");

  return keccak256Hex("0x" + encoded);
}

// ============================================================================
// Safe Transaction Simulation
// ============================================================================

async function simulateSafeTransaction(
  config: TenderlyConfig,
  safe: SafeJson,
  rpcUrl: string,
  options: { save?: boolean; from?: string }
): Promise<SafeTxResult> {
  const safeAddress = options.from || safe.meta.createdFromSafeAddress;
  const chainId = safe.chainId;

  console.log(`Safe: ${safeAddress}`);
  console.log(`Chain: ${chainId}`);
  console.log(`Transactions: ${safe.transactions.length}`);

  // 1. Get Safe nonce and owners
  console.log("\nQuerying Safe state...");
  const [nonceHex, thresholdHex, ownersRaw] = await Promise.all([
    ethCall(rpcUrl, safeAddress, "0xaffed0e0"), // nonce()
    ethCall(rpcUrl, safeAddress, "0xe75235b8"), // getThreshold()
    ethCall(rpcUrl, safeAddress, "0xa0e67e2b"), // getOwners()
  ]);

  const nonce = BigInt(nonceHex as string);
  const threshold = Number(BigInt(thresholdHex as string));

  // Decode owners from ABI-encoded address[]
  const ownersData = (ownersRaw as string).replace("0x", "");
  const ownerCount = Number(BigInt("0x" + ownersData.slice(64, 128)));
  const owners: string[] = [];
  for (let i = 0; i < ownerCount; i++) {
    const offset = 128 + i * 64;
    owners.push("0x" + ownersData.slice(offset + 24, offset + 64));
  }

  console.log(`  Nonce: ${nonce}`);
  console.log(`  Threshold: ${threshold}`);
  console.log(`  Owners: ${owners.map((o) => o.slice(0, 10) + "...").join(", ")}`);

  // 2. Encode MultiSend
  console.log("\nEncoding MultiSend...");
  const packedData = encodeMultiSendData(safe.transactions);
  const multiSendCalldata = encodeMultiSendCall(packedData);
  console.log(`  MultiSend payload: ${(packedData.length / 2).toLocaleString()} bytes`);

  // 3. Compute Safe transaction hash
  console.log("Computing Safe transaction hash...");
  const safeTxHash = await computeSafeTxHash(
    safeAddress,
    MULTISEND_ADDRESS,
    0n,
    multiSendCalldata,
    1, // DELEGATECALL
    nonce,
    rpcUrl
  );
  console.log(`  safeTxHash: ${safeTxHash}`);

  // 4. Pick signers (first `threshold` owners, sorted)
  const sortedOwners = [...owners].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );
  const signers = sortedOwners.slice(0, threshold);
  console.log(
    `  Signers (${threshold}): ${signers.map((s) => s.slice(0, 10) + "...").join(", ")}`
  );

  // 5. Build signatures and state overrides
  const signatures = buildApprovedHashSignatures(signers);

  const stateOverrides: Record<string, { storage: Record<string, string> }> = {
    [safeAddress.toLowerCase()]: { storage: {} },
  };

  for (const signer of signers) {
    const slot = computeApprovedHashSlot(signer, safeTxHash);
    stateOverrides[safeAddress.toLowerCase()].storage[slot] =
      "0x0000000000000000000000000000000000000000000000000000000000000001";
  }

  // 6. Encode execTransaction
  console.log("Encoding execTransaction...");
  const execTxCalldata = encodeExecTransaction(
    MULTISEND_ADDRESS,
    0n,
    multiSendCalldata,
    1, // DELEGATECALL
    signatures
  );

  // 7. Submit to Tenderly
  console.log("Submitting to Tenderly...\n");

  const simulation: TenderlySimulation = {
    network_id: chainId,
    from: signers[0], // Simulate from first signer
    to: safeAddress,
    input: execTxCalldata,
    value: "0",
    save: options.save ?? true,
    save_if_fails: true,
    simulation_type: "full",
    description: safe.meta.name,
    state_objects: stateOverrides,
  };

  const url = `https://api.tenderly.co/api/v1/account/${config.user}/project/${config.project}/simulate`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Access-Key": config.accessKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(simulation),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Tenderly API error (${response.status}):`);
    try {
      const parsed = JSON.parse(body);
      console.error(JSON.stringify(parsed, null, 2));
    } catch {
      console.error(body.slice(0, 2000));
    }
    process.exit(1);
  }

  const data: any = await response.json();
  const tx = data.transaction;
  const sim = data.simulation;

  return {
    id: sim?.id || "",
    status: tx.status === true,
    gasUsed: tx.gas_used || 0,
    method: tx.transaction_info?.method || "execTransaction",
    error: tx.error_message || null,
  };
}

function printSafeResult(result: SafeTxResult, config: TenderlyConfig, txCount: number): void {
  const dashboardUrl = `https://dashboard.tenderly.co/${config.user}/${config.project}/simulator/${result.id}`;

  console.log("━".repeat(72));
  console.log(
    `Safe Transaction Simulation: ${txCount} batched call(s)`
  );
  console.log("━".repeat(72));
  console.log();
  console.log(
    `  Status:  ${result.status ? "✅ PASSED" : "❌ FAILED"}`
  );
  console.log(`  Gas:     ${result.gasUsed.toLocaleString()}`);
  console.log(`  Method:  ${result.method}`);
  if (result.error) {
    console.log(`  Error:   ${result.error}`);
  }
  console.log();
  console.log(`  Dashboard: ${dashboardUrl}`);
  console.log();
  console.log("━".repeat(72));
  console.log();
}

// ============================================================================
// Bundle Simulation (individual txs)
// ============================================================================

function safeToTenderly(
  safe: SafeJson,
  options: { from?: string; save?: boolean }
): TenderlyBundle {
  const from = options.from || safe.meta.createdFromSafeAddress;
  const save = options.save ?? true;

  if (!from) {
    console.error(
      "No Safe address found. Use --from <address> or ensure createdFromSafeAddress is set."
    );
    process.exit(1);
  }

  return {
    simulations: safe.transactions.map((tx, i) => ({
      network_id: safe.chainId,
      from,
      to: tx.to,
      input: tx.data,
      value: tx.value || "0",
      save,
      save_if_fails: true,
      simulation_type: "full" as const,
      description: `Transaction ${i + 1}`,
    })),
  };
}

async function submitBundle(
  config: TenderlyConfig,
  bundle: TenderlyBundle
): Promise<SimulationResult[]> {
  const url = `https://api.tenderly.co/api/v1/account/${config.user}/project/${config.project}/simulate-bundle`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Access-Key": config.accessKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bundle),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`\nTenderly API error (${response.status}):`);
    try {
      const parsed = JSON.parse(body);
      console.error(JSON.stringify(parsed, null, 2));
    } catch {
      console.error(body.slice(0, 1000));
    }
    process.exit(1);
  }

  const data: any = await response.json();
  const results: SimulationResult[] = [];

  for (let i = 0; i < data.simulation_results.length; i++) {
    const result = data.simulation_results[i];
    const tx = result.transaction;
    const sim = result.simulation;

    results.push({
      index: i,
      id: sim?.id || "",
      status: tx.status === true,
      gasUsed: tx.gas_used || 0,
      method: tx.transaction_info?.method || "unknown",
      description:
        bundle.simulations[i]?.description || `Transaction ${i + 1}`,
      error: tx.error_message || null,
    });
  }

  return results;
}

function printBundleResults(
  results: SimulationResult[],
  config: TenderlyConfig
): void {
  const totalPassed = results.filter((r) => r.status).length;
  const totalFailed = results.length - totalPassed;

  console.log(
    `\nTenderly Bundle Simulation: ${results.length} transaction(s)`
  );
  console.log("━".repeat(72));
  console.log();

  const header = ` #  Status     Gas        Method               Description`;
  console.log(header);
  console.log(" " + "─".repeat(70));

  for (const r of results) {
    const num = String(r.index + 1).padStart(2);
    const status = r.status ? "✅ PASS" : "❌ FAIL";
    const gas = r.gasUsed.toLocaleString().padStart(10);
    const method = r.method.padEnd(20).slice(0, 20);
    const desc = r.description.slice(0, 30);
    console.log(` ${num}  ${status}  ${gas}  ${method} ${desc}`);
    if (r.error) {
      console.log(`     ⚠️  ${r.error}`);
    }
  }

  console.log();
  console.log("━".repeat(72));

  if (totalFailed === 0) {
    console.log(`Result: ${totalPassed}/${results.length} PASSED ✅`);
  } else {
    console.log(
      `Result: ${totalPassed}/${results.length} PASSED, ${totalFailed} FAILED ❌`
    );
  }

  const dashboardBase = `https://dashboard.tenderly.co/${config.user}/${config.project}/simulator`;
  const resultsWithIds = results.filter((r) => r.id);
  if (resultsWithIds.length > 0) {
    console.log("\nDashboard links:");
    for (const r of resultsWithIds) {
      const num = String(r.index + 1).padStart(2);
      const icon = r.status ? "✅" : "❌";
      console.log(`  ${num}: ${icon} ${dashboardBase}/${r.id}`);
    }
  }
  console.log();
}

// ============================================================================
// Format Detection
// ============================================================================

function isSafeJson(data: unknown): data is SafeJson {
  return (
    typeof data === "object" &&
    data !== null &&
    "transactions" in data &&
    "chainId" in data &&
    "meta" in data
  );
}

function isTenderlyBundle(data: unknown): data is TenderlyBundle {
  return (
    typeof data === "object" &&
    data !== null &&
    "simulations" in data &&
    Array.isArray((data as TenderlyBundle).simulations)
  );
}

// ============================================================================
// CLI
// ============================================================================

function printHelp(): void {
  console.log(`
Tenderly Safe Transaction Simulation

USAGE:
  bun run simulate-bundle.ts [OPTIONS] <file>

ARGUMENTS:
  file                  Path to .safe.json or .tenderly.json

MODES:
  --safe-tx             Simulate as a real Safe execTransaction via MultiSend
                        (default for .safe.json: single Tenderly link)
  --bundle              Simulate each tx individually via simulate-bundle API
                        (default for .tenderly.json: one link per tx)

OPTIONS:
  --rpc <url>           RPC URL for chain queries (auto-detected from .env)
  --env <path>          Path to .env file (default: .env)
  --from <address>      Override Safe address (sender)
  --save                Save simulations to dashboard (default: true)
  --no-save             Don't save simulations to dashboard
  --output <path>       Write results JSON to file
  --help, -h            Show this help

EXAMPLES:
  # Full Safe simulation (default for .safe.json)
  bun run simulate-bundle.ts batch-upgrade.safe.json

  # Individual tx simulation
  bun run simulate-bundle.ts --bundle batch-upgrade.safe.json

  # With explicit RPC
  bun run simulate-bundle.ts --rpc https://mainnet.base.org batch.safe.json
`);
}

function parseArgs(): { file: string; options: Record<string, string> } {
  const argv = process.argv.slice(2);
  const options: Record<string, string> = {};
  let file = "";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--no-save") {
      options.save = "false";
    } else if (arg === "--save") {
      options.save = "true";
    } else if (arg === "--safe-tx") {
      options.mode = "safe-tx";
    } else if (arg === "--bundle") {
      options.mode = "bundle";
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        options[key] = value;
        i++;
      }
    } else {
      file = arg;
    }
  }

  if (!file) {
    console.error("Error: No input file specified.\n");
    printHelp();
    process.exit(1);
  }

  return { file, options };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const { file, options } = parseArgs();

  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const envPath = path.resolve(options.env || ".env");
  const config = getTenderlyConfig(envPath);

  // Determine mode
  let mode = options.mode;
  if (!mode) {
    if (isSafeJson(raw)) mode = "safe-tx";
    else if (isTenderlyBundle(raw)) mode = "bundle";
    else {
      console.error(
        "Unrecognized file format. Expected .safe.json or .tenderly.json"
      );
      process.exit(1);
    }
  }

  if (mode === "safe-tx") {
    if (!isSafeJson(raw)) {
      console.error("--safe-tx requires a .safe.json file");
      process.exit(1);
    }

    console.log(
      `Loaded Safe JSON: ${raw.meta.name} (chain ${raw.chainId}, ${raw.transactions.length} tx)\n`
    );

    const rpcUrl =
      options.rpc || getRpcUrl(raw.chainId, envPath);

    const result = await simulateSafeTransaction(config, raw, rpcUrl, {
      save: options.save !== "false",
      from: options.from,
    });

    printSafeResult(result, config, raw.transactions.length);

    if (!result.status) process.exit(1);
  } else {
    // Bundle mode
    let bundle: TenderlyBundle;

    if (isTenderlyBundle(raw)) {
      bundle = raw;
      console.log(`Loaded Tenderly bundle: ${path.basename(filePath)}`);
    } else if (isSafeJson(raw)) {
      console.log(
        `Loaded Safe JSON: ${raw.meta.name} (chain ${raw.chainId}, ${raw.transactions.length} tx)`
      );
      bundle = safeToTenderly(raw, {
        from: options.from,
        save: options.save !== "false",
      });
    } else {
      console.error(
        "Unrecognized file format. Expected .safe.json or .tenderly.json"
      );
      process.exit(1);
    }

    console.log(
      `Submitting ${bundle.simulations.length} transaction(s) to Tenderly...`
    );

    const results = await submitBundle(config, bundle);
    printBundleResults(results, config);

    if (results.some((r) => !r.status)) process.exit(1);
  }
}

main().catch((error) => {
  console.error("Error:", error.message || error);
  process.exit(1);
});
