# solidity-authoring

Authoring conventions for writing Solidity contracts in this author's style,
separate from auditing (`solidity-audit`) or operating (`evm-ops`) them.

## Skills

| Skill | Purpose |
|-------|---------|
| `contract-style` | NatSpec precision, feature-first function ordering, deploy-time value inference |

## Why a separate plugin

`solidity-audit` finds vulnerabilities in existing code. `evm-ops` runs
deployment and upgrade tooling. Neither is the right place for "how should
this contract read when it's first written." This plugin exists so those
conventions get applied automatically instead of being repeated in every
prompt.
