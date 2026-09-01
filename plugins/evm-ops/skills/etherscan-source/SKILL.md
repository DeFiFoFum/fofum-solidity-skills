---
name: etherscan-source
description: Fetch verified contract source code from Etherscan V2 API and save it locally in a Forge-ready format. Use when fetching deployed contract source, downloading verified contracts, getting on-chain source code, or preparing source for diffing or storage layout validation.
---

# Etherscan Source Fetcher

Fetches verified contract source code from Etherscan V2 API and saves it in a structured directory format ready for Forge compilation.

## When to Use

- Before generating contract diffs (old vs new implementation)
- Before validating storage layout compatibility against deployed contract
- When user asks to "fetch source", "get deployed code", or "download contract"

## Prerequisites

- **Bun** installed and accessible in PATH
- **Etherscan V2 API key** in `.env` as `ETHERSCAN_V2_API_KEY`
- Contract must be verified on Etherscan

## Paths

Commands below use `$SKILL_DIR`: the absolute path of the directory containing this SKILL.md. Set it once per shell before running anything:

```bash
SKILL_DIR=<absolute path to this skill directory>
```

## Quick Start

```bash
# Install deps (first time)
cd "$SKILL_DIR/tools/etherscan-source" && bun install

# Fetch source
bun run "$SKILL_DIR/tools/etherscan-source/etherscan-v2-source.ts" \
  <address> --chain <chainId|name> [--output <dir>]
```

## CLI Interface

```
bun run etherscan-v2-source.ts <address> [options]

Options:
  --chain <id|name>    Chain ID or name (default: 1)
  --output <dir>       Output directory (default: .temp)
  --env <path>         Path to .env file
  --api-key <key>      API key (overrides .env)
```

## Output Structure

Source files are saved to `<output>/<chainId>/<address>/implementation-<YYYYMMDD>/`:
- Solidity source files
- `_metadata.json` (compiler version, optimization settings)
- `_abi.json` (contract ABI)
- `foundry.toml` (auto-generated with correct compiler version)
- `lib/` (empty directory for Forge)

## Supported Chains

mainnet (1), linea (59144), arbitrum (42161), base (8453), polygon (137), bsc (56), optimism (10), zircuit (48900), unichain (130)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ETHERSCAN_V2_API_KEY` | Universal key (works for all chains via V2 API) |
| `BASESCAN_API_KEY` | Chain-specific override for Base |
| `LINEASCAN_API_KEY` | Chain-specific override for Linea |
| `ARBISCAN_API_KEY` | Chain-specific override for Arbitrum |

## Examples

```bash
# Base mainnet
bun run etherscan-v2-source.ts 0x1234...abcd --chain base

# Custom output directory
bun run etherscan-v2-source.ts 0x1234...abcd --chain 8453 --output upgrades/sources

# Then compile with Forge
cd .temp/8453/0x1234.../implementation-20260519/
forge build
```
