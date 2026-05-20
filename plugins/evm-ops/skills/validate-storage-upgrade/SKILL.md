---
name: validate-storage-upgrade
description: Validate Solidity upgradeable contract storage layouts for upgrade safety using Forge. Use when checking if a contract upgrade is storage-safe, comparing before/after storage layouts, validating proxy upgrade compatibility, or when user mentions storage slots, upgrade safety, storage collision, or __gap arrays.
---

# Validate Storage Upgrade

Validates that upgradeable Solidity contracts maintain storage layout compatibility between versions. Prevents storage collisions that can corrupt contract state during upgrades.

## Prerequisites

- **Forge** (Foundry) installed
- Compiled contracts in the project
- For on-chain validation: `ETHERSCAN_V2_API_KEY` in `.env`

## Tools Available

| Tool | Purpose |
|------|---------|
| `tools/validate-storage/validate-storage.ts` | Compare storage layouts, report errors and warnings |
| `tools/check-forge/check-forge.ts` | Verify Forge installation and version |
| `tools/sourcify-source/sourcify-source.ts` | Fetch source from Sourcify (no API key needed) |

## Workflow A: Local Version Comparison

```bash
# 1. Generate "before" layout (from previous commit or deployed source)
forge inspect contracts/MyContract.sol:MyContract storage-layout --json > storage-before.json

# 2. Generate "after" layout
forge inspect contracts/MyContract.sol:MyContract storage-layout --json > storage-after.json

# 3. Validate
bun run <plugin>/tools/validate-storage/validate-storage.ts storage-before.json storage-after.json
```

## Workflow B: Validate Against Deployed Contract (Recommended)

```bash
# 1. Fetch deployed source
bun run <plugin>/tools/etherscan-source/etherscan-v2-source.ts <address> --chain <chain>

# 2. Compile deployed source
cd .temp/<chainId>/<address>/implementation-<date>/
forge build

# 3. Generate deployed storage layout
forge inspect contracts/MyContract.sol:MyContract storage-layout --json > storage-deployed.json

# 4. Generate local "after" layout
cd /your/project && forge inspect contracts/MyContract.sol:MyContract storage-layout --json > storage-after.json

# 5. Validate
bun run <plugin>/tools/validate-storage/validate-storage.ts storage-deployed.json storage-after.json
```

## Interpreting Results

### UPGRADE SAFE (warnings only)
| Warning | Meaning |
|---------|---------|
| LABEL RENAMED | Variable renamed (OK if intentional deprecation) |
| GAP SHRUNK | `__gap` reduced to make room for new variables |
| NEW VARIABLE | New variable allocated from gap space |
| NEW VARIABLE AT END | Variable added beyond existing storage |

### NOT UPGRADE SAFE (errors)
| Error | Fix |
|-------|-----|
| SLOT EMPTIED | Never remove variables: only deprecate by renaming |
| SLOT SHIFTED | Variables moved to different slots: restore original order |
| TYPE CHANGED | Variable type changed: keep original type |
| GAP END SLOT CHANGED | Gap boundary moved: preserve end slot |
| GAP GREW | Gaps can only shrink, not grow |
| INVALID NEW SLOT | New variable in non-gap, non-end slot |

## Storage Layout Rules

Allowed: Renaming variables, adding at end, shrinking `__gap`, new `__gap` arrays

Not allowed: Removing variables, changing types, reordering, inserting between existing slots

## Troubleshooting

- **"forge: command not found":** Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **"thread 'main' has overflowed its stack":** Fix `foundry.toml`: use `libs = ["lib"]` not `libs = ["."]`
- **Schema validation failed:** Use `--json` flag with `forge inspect`, try `forge clean && forge build --skip test`
