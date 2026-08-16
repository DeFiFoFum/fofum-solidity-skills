# contract-style proof of concept

A self-contained Foundry project proving the claims in `../../SKILL.md`
with real code and passing tests, not just prose.

## Run it

```bash
make verify
```

Installs pinned dependencies and runs the full test suite. `make test`
alone re-runs tests without reinstalling; `make clean` removes
`lib/`/`out/`/`cache/` to start fresh.

## What's proven, and by what

| Claim | Proof |
|---|---|
| Feature-first ordering and precise NatSpec are followable conventions, not just described ones | `src/ExampleVault.sol` applies both throughout; read it alongside `../../SKILL.md`'s Principles |
| A deploy-time value can be inferred instead of hardcoded | `src/ExampleVault.sol`'s `depositsOpenedAt` is set from `block.timestamp` in `initialize()`; `test/ExampleVault.t.sol::test_depositsOpenedAtIsInferredNotHardcoded` asserts it matches the block it was set in |
| A named proxy is identifiable on-chain, not generic bytecode | `src/ExampleVaultProxy.sol`'s `NAME` constant; `test/ExampleVault.t.sol::test_proxyIsIdentifiableByName` reads it directly off the deployed proxy |

`src/ExampleVaultProxy.sol` is committed pre-generated output; see the
sibling `upgradeable-contracts` skill for the template and generator
script it came from.
