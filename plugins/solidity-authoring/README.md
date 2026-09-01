# solidity-authoring

Authoring conventions for writing Solidity contracts in this author's style,
separate from auditing (`solidity-audit`) or operating (`evm-ops`) them.

## Skills

| Skill | Purpose |
|-------|---------|
| `contract-style` | NatSpec precision, feature-first function ordering, deploy-time value inference |
| `upgradeable-contracts` | Named-proxy pattern, transparent vs. beacon/diamond choice, storage-layout safety across upgrades |
| `test-realism` | Mock vs. vendored-bytecode vs. live-fork testing tiers; daily CI vs. weekly fork/gas cadence |

## Why a separate plugin

`solidity-audit` finds vulnerabilities in existing code. `evm-ops` runs
deployment and upgrade tooling. Neither is the right place for "how should
this contract read when it's first written." This plugin exists so those
conventions get applied automatically instead of being repeated in every
prompt.
