# evm-ops

EVM smart contract operations toolkit for Claude Code. Provides skills and tools for managing live smart contracts: fetching verified source, generating upgrade diffs, validating storage layouts, building Gnosis Safe transactions, and simulating on Tenderly.

## Skills

| Skill | Purpose |
|-------|---------|
| `etherscan-source` | Fetch verified source from Etherscan V2 API |
| `contract-diff` | Generate side-by-side HTML diffs for upgrade review |
| `validate-storage-upgrade` | Validate storage layout safety before proxy upgrades |
| `safe-tx-builder` | Generate Gnosis Safe Transaction Builder JSON files |
| `tenderly-simulate` | Simulate Safe transaction batches on Tenderly |

## Prerequisites

- [Bun](https://bun.sh) (for running TypeScript tools)
- [Foundry](https://getfoundry.sh) (for `validate-storage-upgrade`)
- Etherscan V2 API key (`ETHERSCAN_V2_API_KEY` in `.env`)
- Tenderly credentials (`TENDERLY_USER`, `TENDERLY_PROJECT`, `TENDERLY_ACCESS_KEY` in `.env`)

## Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for setup and first-run instructions.

## Commands

- `/upgrade-pipeline`: Orchestrate a full upgrade: diff, validate storage, build Safe TX, simulate
- `/validate-env`: Check that all required tools and env vars are present

## Supply Chain Note

This plugin includes TypeScript tools (Bun-runnable). Review `tools/` before installing if supply chain is a concern. The `lib/d_code-diff/` directory is a vendored copy of a diff rendering library (depends on `diff2html`).
