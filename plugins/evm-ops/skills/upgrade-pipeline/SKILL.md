---
name: upgrade-pipeline
description: Orchestrate a full proxy contract upgrade workflow end-to-end. Use when doing a proxy upgrade, preparing upgrade artifacts for multi-sig review, running the full upgrade workflow, generating diffs and validating storage before an upgrade, building Safe transaction batches, simulating upgrades on Tenderly, or when user mentions upgrade pipeline, proxy upgrade workflow, or preparing an upgrade.
argument-hint: "[--chain <chain>] [--proxy-admin <addr>] [--safe <addr>] [--output <dir>] ContractName:oldAddr:newAddr ..."
---

# Upgrade Pipeline

Orchestrates the full proxy upgrade preparation workflow. Runs all pre-upgrade checks and generates all artifacts needed for safe multi-sig execution.

## Required Sibling Skills

This skill owns no tools. It drives the tools shipped by five sibling skills, which must be installed alongside it:

`contract-diff`, `etherscan-source`, `validate-storage-upgrade`, `safe-tx-builder`, `tenderly-simulate`

```bash
npx skills add DeFiFoFum/fofum-solidity-skills \
  --skill upgrade-pipeline --skill contract-diff --skill etherscan-source \
  --skill validate-storage-upgrade --skill safe-tx-builder --skill tenderly-simulate
```

## Paths

Commands below use `$SKILLS_DIR`: the directory that holds this skill and its siblings (the parent of the folder containing this SKILL.md).

```bash
SKILLS_DIR=<absolute path to the parent of this skill directory>

# Preflight: confirm the sibling tools are present before starting
ls "$SKILLS_DIR"/{contract-diff,etherscan-source,validate-storage-upgrade,safe-tx-builder,tenderly-simulate}
```

If any are missing, stop and tell the user which skills to install rather than improvising a path.

## Setup (first run only)

Two tools have dependencies. Install them once:

```bash
cd "$SKILLS_DIR/contract-diff/tools/contract-diff" && bun install
cd "$SKILLS_DIR/validate-storage-upgrade/tools/validate-storage" && bun install
```

## Env Requirements

The following must be set in the project's `.env` (tools search up from cwd automatically):

```
ETHERSCAN_V2_API_KEY=...       # For contract-diff and validate-storage
TENDERLY_USER=...              # For tenderly-simulate
TENDERLY_PROJECT=...
TENDERLY_ACCESS_KEY=...
RPC_URL=https://...            # For tenderly-simulate --safe-tx mode
```

## Arguments

Contracts in `ContractName:oldAddr:newAddr` format. Options:

| Flag | Description |
|------|-------------|
| `--chain <name\|id>` | Target chain (base, linea, arbitrum, mainnet, etc.) |
| `--proxy-admin <addr>` | ProxyAdmin contract address |
| `--safe <addr>` | Gnosis Safe address that owns the ProxyAdmin |
| `--output <dir>` | Output directory (default: `./upgrades/YYYYMMDD`) |

## Workflow Checklist

Execute these steps in order. Mark each complete before proceeding.

- [ ] **1. Generate contract diffs**
  ```bash
  bun run "$SKILLS_DIR/contract-diff/tools/contract-diff/generate-contract-diff.ts" \
    --chain <chain> --output <output>/diffs \
    ContractName:0xOLD:0xNEW
  ```
  Review `<output>/diffs/index.html`, then share with multi-signers before proceeding.

- [ ] **2. Validate storage layout** (for each upgraded contract)
  ```bash
  # Fetch deployed source
  bun run "$SKILLS_DIR/etherscan-source/tools/etherscan-source/etherscan-v2-source.ts" \
    <oldAddr> --chain <chain> --output <output>/sources

  # Compile deployed source
  cd <output>/sources/<chainId>/<oldAddr>/implementation-*/
  forge build

  # Generate layouts and validate
  forge inspect <Contract.sol:Name> storage-layout --json > storage-deployed.json
  cd <project-root>
  forge inspect <Contract.sol:Name> storage-layout --json > storage-new.json
  bun run "$SKILLS_DIR/validate-storage-upgrade/tools/validate-storage/validate-storage.ts" \
    <output>/sources/.../storage-deployed.json storage-new.json
  ```
  **Stop if any ERRORS reported.** Warnings are OK to proceed.

- [ ] **3. Build Safe transaction batch**
  ```bash
  bun run "$SKILLS_DIR/safe-tx-builder/tools/safe-tx-builder/generate-upgrade-tx.ts" \
    --network <chain> \
    --proxy-admin <proxyAdmin> \
    --proxy <proxyAddr> \
    --implementation <newImpl> \
    --contract-name <ContractName> \
    --safe <safeAddr> \
    --output <output>/safe-txs/<chain>-upgrade.json
  ```

- [ ] **4. Simulate on Tenderly**
  ```bash
  bun run "$SKILLS_DIR/tenderly-simulate/tools/tenderly-simulate/simulate-bundle.ts" \
    <output>/safe-txs/<chain>-upgrade.json
  ```
  **Stop if simulation FAILS.** Debug with `--bundle` mode for per-tx traces.

- [ ] **5. Report summary**
  Report all artifacts created:
  - Diff output: `<output>/diffs/index.html`
  - Storage validation: SAFE or NOT SAFE + any warnings
  - Safe TX file: `<output>/safe-txs/<chain>-upgrade.json`
  - Tenderly simulation: link to dashboard

## Notes on .env Resolution

Tools find `.env` by walking up from `process.cwd()` (the project root where Claude is running). The skills may be installed globally but read credentials from the current project's `.env`, no extra configuration needed.

## Related Skills

- `etherscan-source`: fetch verified contract source standalone
- `contract-diff`: generate diffs standalone
- `validate-storage-upgrade`: validate storage standalone
- `safe-tx-builder`: build Safe TX standalone
- `tenderly-simulate`: simulate standalone
