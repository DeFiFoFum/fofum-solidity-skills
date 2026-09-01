---
name: safe-tx-builder
description: Generate Gnosis Safe Transaction Builder JSON files for proxy upgrades and multi-sig operations. Use when the user needs to create Safe upgrade transactions, batch multi-sig transactions, generate Safe TX JSON for import into the Safe UI, or prepare proxy upgrade batches.
---

# Safe TX Builder

Generates JSON files compatible with Gnosis Safe's Transaction Builder app for proxy upgrades and other multi-sig operations.

## Prerequisites

- **Bun** installed
- ProxyAdmin address (from deployment files or on-chain)
- Proxy address (the deployed proxy contract)
- New implementation address (newly deployed)
- Safe address (multi-sig owner of the ProxyAdmin)

## Paths

Commands below use `$SKILL_DIR`: the absolute path of the directory containing this SKILL.md. Set it once per shell before running anything:

```bash
SKILL_DIR=<absolute path to this skill directory>
```

No dependency install is needed for this tool.

## Quick Start

```bash
# Single upgrade
bun run "$SKILL_DIR/tools/safe-tx-builder/generate-upgrade-tx.ts" \
  --network base \
  --proxy-admin 0x<ProxyAdmin> \
  --proxy 0x<Proxy> \
  --implementation 0x<NewImpl> \
  --contract-name MyContract \
  --output ./safe-txs/base-mycontract-upgrade.json

# From config file (batch multiple upgrades)
bun run "$SKILL_DIR/tools/safe-tx-builder/generate-upgrade-tx.ts" --config upgrades.json
```

## CLI Options

```
--network <name>        Network name (linea, base, arbitrum, mainnet, etc.)
--chain-id <id>         Chain ID (if network not known)
--proxy-admin <addr>    ProxyAdmin contract address
--proxy <addr>          Proxy contract address to upgrade
--implementation <addr> New implementation address
--safe <addr>           Safe address (owner of ProxyAdmin)
--contract-name <name>  Label for the contract (default: "Contract")
--output <path>         Output file path (default: ./output.json)
--config <path>         JSON config file for batch upgrades
```

## Config File Format

```json
{
  "upgrades": [
    {
      "network": "base",
      "chainId": 8453,
      "proxyAdmin": "0x...",
      "proxy": "0x...",
      "implementation": "0x...",
      "safeAddress": "0x...",
      "contractName": "MyContract"
    }
  ],
  "outputDir": "./safe-txs"
}
```

## Output Format

Generates Safe Transaction Builder JSON with:
- Chain ID and version metadata
- ProxyAdmin `upgrade(proxy, implementation)` call
- SHA-256 checksum for integrity verification

## ProxyAdmin Upgrade Method

The standard OpenZeppelin ProxyAdmin `upgrade` function signature:
- `upgrade(address proxy, address implementation)`: non-payable

## Using the Generated Files

1. Go to [app.safe.global](https://app.safe.global)
2. Connect to the appropriate Safe
3. Switch to the target network
4. Apps → Transaction Builder → Upload the JSON file
5. Review transaction parameters and submit

## Related Tools

- `contract-diff`: Generate HTML diffs for upgrade review
- `validate-storage-upgrade`: Validate storage layout compatibility
- `tenderly-simulate`: Simulate the Safe TX before signing
