# solidity-authoring Quick Start

## 1. Install the plugin

No setup, no dependencies, no credentials: this plugin is markdown guidance
that Claude loads automatically when it's relevant. There's nothing to run
before using it.

## 2. Just ask

The skill routes off what you're doing, not an explicit command:

```
Write a deposit/withdraw vault contract for this token.
```
```
Make the NatSpec on this contract more precise.
```
```
Reorder these functions so the deposit feature reads together.
```

Claude picks up `contract-style` automatically for general Solidity
authoring. If this plugin has grown sibling skills for upgradeable
contracts or testing conventions, see this directory's `README.md` for
what else is available and when each one applies instead.

## 3. See it applied

`skills/contract-style/assets/ExampleVault.sol` is a full worked example
following every convention in the skill; `references/compiling-with-forge.md`
has the exact commands to build and test it yourself.
