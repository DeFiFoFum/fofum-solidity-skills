# Setting up vendored-bytecode tests with Foundry

How to fetch real deployed bytecode, load it in a test with `vm.etch`, and
avoid the two gotchas that actually break this in practice. Every command
and file below was run end to end against live mainnet WETH9
(`0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`) via a public RPC.

## 1. Fetch the bytecode once

```bash
<plugin-dir>/skills/test-realism/scripts/fetch-vendored-bytecode.sh \
  0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 \
  https://ethereum-rpc.publicnode.com \
  WETH9 \
  ./vendored
```

This writes `vendored/WETH9.runtime.hex` (the runtime bytecode as a
`0x`-prefixed hex string, no trailing newline) and
`vendored/WETH9.provenance.json` (address, RPC hostname, block number,
fetch timestamp - no API keys, since only the RPC hostname is recorded).
Commit both to the repo; they're small text files, not a vendored binary
blob.

## 2. Allow Foundry to read the vendored file

`vm.readFile` is gated by `fs_permissions`. Add to `foundry.toml`:

```toml
fs_permissions = [{ access = "read", path = "./vendored" }]
```

Without this, `vm.readFile` reverts with a permissions error, not a
missing-file error - if that's the failure you're seeing, this is almost
always why.

## 3. The gotcha that actually breaks this

`vm.parseBytes` rejects a trailing newline. A plain `curl ... > file.hex`
or most editors will add one. The fetch script strips it with
`printf '%s'` instead of `echo`, but if you ever hand-edit a vendored file,
verify there's no trailing newline before assuming the vendored bytecode
itself is wrong:

```bash
xxd vendored/WETH9.runtime.hex | tail -1   # last byte should NOT be 0a
```

## 4. Load and use it in a test

```solidity
bytes memory runtimeCode = vm.parseBytes(vm.readFile("vendored/WETH9.runtime.hex"));
address target = makeAddr("vendoredWETH9");
vm.etch(target, runtimeCode);
IWETH9 weth = IWETH9(target);
```

See `assets/proof-of-concept/test/VendoredWETH.t.sol` for the full working
example: 3 tests, verified passing with `make verify` (no RPC needed),
exercising real WETH9 `deposit`, `withdraw`, and `transfer` logic.

## 5. Refreshing vendored bytecode

Re-run the fetch script deliberately if the real contract is known to have
upgraded, or on a periodic cadence for contracts you know evolve.
`assets/proof-of-concept`'s `make refresh-vendored RPC_URL=<rpc>` does
exactly this for real, refetching and diffing against what's committed.
`ci-solidity-tests.yml`'s weekly job has a commented-out example step
showing where to wire the same call into CI; it isn't wired up by default
there because the template doesn't know which contracts your project
vendors. Treat an unrefreshed vendored artifact the same way you'd treat a
`package-lock` that's years old: not wrong by default, but worth knowing
when it was last true.

## For comparison: the live-fork tier

`assets/proof-of-concept/test/ForkWETH.t.sol` runs the same kind of
assertions directly against whatever `--fork-url` points at, with no
vendored file at all:

```bash
make test-fork RPC_URL=https://ethereum-rpc.publicnode.com
```

Verified passing against live mainnet state. This is the higher-realism,
higher-cost tier described in the skill's outcomes: reserve it for the
weekly job, not every push.
