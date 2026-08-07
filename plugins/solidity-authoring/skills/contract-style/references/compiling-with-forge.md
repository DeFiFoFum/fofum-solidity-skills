# Compiling the style-guide examples with Foundry

How to drop `assets/ExampleVault.sol`, `assets/NamedProxy.template.sol`, and
their generated/test companions into a real Foundry project and build and
test them. Every command below was run end to end against
`OpenZeppelin/openzeppelin-contracts` and
`OpenZeppelin/openzeppelin-contracts-upgradeable` at their default branch
tags; no submodules are vendored into this skill, only the small example
contracts themselves.

## 1. Scaffold or reuse a Foundry project

```bash
forge init --no-git my-project   # skip --no-git if you want forge to init git too
cd my-project
```

## 2. Install the two OpenZeppelin dependencies

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
```

`forge-std` is already installed by `forge init`.

## 3. Add remappings

```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/
forge-std/=lib/forge-std/src/
```

Append these to `remappings.txt` (create it at the project root if it
doesn't exist yet).

## 4. Place the files

The example contracts use relative imports (`./ExampleVault.sol`), so keep
them colocated in the same directory rather than splitting across `src/`
and `test/`:

```bash
cp <plugin-dir>/skills/contract-style/assets/ExampleVault.sol       src/
cp <plugin-dir>/skills/contract-style/assets/ExampleVaultProxy.sol  src/
cp <plugin-dir>/skills/contract-style/assets/ExampleVault.t.sol     src/
```

`ExampleVaultProxy.sol` is the already-generated output of
`NamedProxy.template.sol` for a contract named `ExampleVault`. To generate a
named proxy for one of your own contracts instead of copying the example,
see `scripts/generate-named-proxy.sh` and run:

```bash
<plugin-dir>/skills/contract-style/scripts/generate-named-proxy.sh \
  YourContractProxy YourContract ./src
```

## 5. Build and test

```bash
forge build
forge test -vv
```

Expected result: a clean build (OpenZeppelin's proxy prints one standard
"payable fallback with no receive function" warning, safe to ignore) and 7
passing tests covering the deposit/withdraw features and the two behaviors
this style guide cares about: `test_proxyIsIdentifiableByName` and
`test_depositsOpenedAtIsInferredNotHardcoded`.

## Compiler version

The examples use `pragma solidity ^0.8.24`. Foundry will auto-select a
compatible installed solc (0.8.26 at the time this was verified); pin
`solc_version` in `foundry.toml` if your project needs a fixed version.
