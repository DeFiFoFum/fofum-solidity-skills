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
| `upgrade-pipeline` | Orchestrate the full upgrade workflow across the skills above |

Each skill is self-contained: its tools live in `skills/<skill>/tools/`, so a skill
works whether it was installed as part of this plugin or on its own with
`npx skills add DeFiFoFum/fofum-solidity-skills --skill <name>`.

Two exceptions, both declared in the skill body: `contract-diff` delegates source
fetching to `etherscan-source`, and `upgrade-pipeline` drives all five other skills.
Install their siblings alongside them.

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

## Install Outside Claude Code

```bash
npx skills add DeFiFoFum/fofum-solidity-skills --skill upgrade-pipeline
```

Commands (`/upgrade-pipeline`, `/validate-env`) are Claude Code plugin features and do not transfer. The skills and their tools do.

## Supply Chain Note

This plugin includes TypeScript tools (Bun-runnable). Review `skills/*/tools/` before installing if supply chain is a concern. `skills/contract-diff/lib/d_code-diff/` is a vendored copy of a diff rendering library (depends on `diff2html`).
