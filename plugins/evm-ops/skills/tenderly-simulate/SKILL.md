---
name: tenderly-simulate
description: Simulate Gnosis Safe transaction batches on Tenderly before multi-signer execution. Use when user wants to simulate upgrade transactions, test Safe batches, verify multi-sig transactions will succeed on-chain, test before signing, or simulate on Tenderly.
---

# Tenderly Simulate

Simulates Gnosis Safe transaction batches on Tenderly before multi-signer execution. Supports two modes: full Safe `execTransaction` simulation (single atomic TX) or individual per-tx simulation.

## Prerequisites

- **Bun** installed
- **cast** (Foundry): used for keccak256 hashing
- Tenderly credentials in `.env`:
  ```
  TENDERLY_USER=<username>
  TENDERLY_PROJECT=<project>
  TENDERLY_ACCESS_KEY=<api-key>
  ```
- RPC URL in `.env` for `--safe-tx` mode: `RPC_URL`, `BASE_RPC_URL`, etc.

## Quick Start

```bash
# Full Safe execTransaction simulation (default for .safe.json)
bun run <plugin>/tools/tenderly-simulate/simulate-bundle.ts batch-upgrade.safe.json

# Individual tx simulation
bun run <plugin>/tools/tenderly-simulate/simulate-bundle.ts --bundle batch-upgrade.safe.json
```

## Simulation Modes

### `--safe-tx` (default for `.safe.json`)
Encodes the full `Safe.execTransaction → MultiSend delegatecall` as a single atomic simulation. Mirrors exactly how the batch will execute on-chain.

**What it does:**
1. Queries Safe nonce, threshold, and owners on-chain
2. Encodes all transactions into MultiSend packed format
3. Computes EIP-712 Safe transaction hash
4. Builds approved-hash signatures using state overrides (bypasses real signature collection)
5. Produces **one Tenderly dashboard link** with complete call trace

### `--bundle` (default for `.tenderly.json`)
Submits each transaction individually. Produces one Tenderly link per transaction. Use for per-tx debugging when `--safe-tx` fails.

## CLI Interface

```
bun run simulate-bundle.ts [OPTIONS] <file>

MODES:
  --safe-tx    Full Safe execTransaction (default for .safe.json)
  --bundle     Individual simulations (default for .tenderly.json)

OPTIONS:
  --rpc <url>       RPC URL (auto-detected from .env)
  --env <path>      Path to .env (default: .env)
  --from <address>  Override Safe address
  --no-save         Don't save to Tenderly dashboard
```

## Workflow

1. Generate Safe batch JSON (via `safe-tx-builder`)
2. Run: `bun run simulate-bundle.ts batch.safe.json`
3. Review the Tenderly dashboard link
4. If FAILED: use `--bundle` mode for per-tx debugging
5. Only import into Safe{Wallet} UI after simulation passes

## Supported Chains

mainnet (1), base (8453), arbitrum (42161), optimism (10), polygon (137), linea (59144)

## Related Tools

- `safe-tx-builder`: Generate the Safe TX JSON files
- `contract-diff`: Generate HTML diffs for upgrade review
- `validate-storage-upgrade`: Validate storage layout compatibility
