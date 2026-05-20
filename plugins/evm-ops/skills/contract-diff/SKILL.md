---
name: contract-diff
description: Generate side-by-side HTML diffs comparing old vs new implementation contract source code for proxy upgrade review. Use when preparing upgrade diffs, comparing deployed vs new contract implementations, generating upgrade review documents, or when user mentions contract diff, upgrade review, or implementation comparison.
---

# Contract Diff Generator

Generates color-coded, side-by-side HTML diffs comparing old (deployed) vs new implementation contract source code. Designed for multi-sig review before executing proxy upgrades.

## When to Use

- Before a proxy upgrade, to share diffs with multi-signers
- When comparing two deployed implementation versions
- When user asks for "contract diff", "upgrade diff", or "implementation comparison"

## Prerequisites

- **Bun** installed
- **Etherscan API key** in `.env` as `ETHERSCAN_V2_API_KEY`
- Contracts must be verified on Etherscan

## Quick Start

```bash
# Install deps (first time)
cd <plugin>/tools/contract-diff && bun install

# Generate diffs
bun run <plugin>/tools/contract-diff/generate-contract-diff.ts \
  --chain base \
  --output upgrades/base/20260519-diffs \
  PriceFeedV2:0xOLD...:0xNEW... \
  VesselManager:0xOLD...:0xNEW...
```

## CLI Interface

```
bun run generate-contract-diff.ts [options] <contracts...>

Arguments:
  contracts    One or more entries in format: ContractName:oldAddr:newAddr

Options:
  --chain <name|id>    Chain name or ID (default: 1)
  --output <dir>       Output directory (default: ./diffs)
```

## Workflow

1. For each contract, identify old (deployed) and new (pending) implementation addresses
2. Run the tool: it fetches source for both via Etherscan, diffs recursively
3. Review `index.html` and per-contract HTML files in the output directory
4. Share HTML files with multi-signers for review

## Output

- One `<ContractName>.html` per contract (side-by-side diff with syntax highlighting)
- `index.html`: summary table linking all diffs with change stats
- `sources/`: raw fetched source code

## How It Works

1. Spawns `etherscan-v2-source.ts` to fetch source for each address
2. Runs `diff -ru` recursively across ALL `.sol` files (captures parent/inherited contracts)
3. Renders HTML using `diff2html` (vendored in `lib/d_code-diff/`)

## Supported Chains

mainnet (1), linea (59144), arbitrum (42161), base (8453), polygon (137), bsc (56), optimism (10), zircuit (48900), unichain (130)

## Related Tools

- `etherscan-source`: Source code fetcher (invoked as subprocess)
- `validate-storage-upgrade`: Storage layout validation
- `safe-tx-builder`: Safe transaction builder for upgrades
