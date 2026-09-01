# test-realism proof of concept

A self-contained Foundry project proving the claims in `../../SKILL.md`
with real code and passing tests, not just prose.

## Run it

```bash
make verify
```

Installs `forge-std` and runs the daily (RPC-free) tier: no secrets or
network access needed beyond dependency install. This is deliberately the
same split the skill argues for, `verify` never touches a live RPC.

To exercise the other tiers, which do need a live RPC and are not part of
`verify` for exactly that reason:

```bash
make test-fork RPC_URL=https://ethereum-rpc.publicnode.com
make refresh-vendored RPC_URL=https://ethereum-rpc.publicnode.com
```

`make clean` removes `lib/`/`out/`/`cache/`.

## What's proven, and by what

| Claim | Proof |
|---|---|
| Vendored bytecode is real, not a mock, and testable with no RPC at test time | `test/VendoredWETH.t.sol` etches `vendored/WETH9.runtime.hex` (fetched from live mainnet) and exercises real `deposit`/`withdraw`/`transfer` logic; 3 tests, part of `make verify` |
| A live fork test hits real, current chain state | `test/ForkWETH.t.sol`, run with `make test-fork`; asserts against the actual deployed WETH9 at `0xC02aaA...756Cc2` |
| The vendored artifact can be refreshed and diffed against live state | `make refresh-vendored` re-runs `scripts/fetch-vendored-bytecode.sh` for real and diffs the result against what's committed |
| CI can split daily (vendored, on push) from weekly (fork, cron) | `ci-solidity-tests.yml`, a verified-valid GitHub Actions workflow implementing exactly this split |

`scripts/fetch-vendored-bytecode.sh` lives one level up, in the skill's
own `scripts/` directory, since it's a general-purpose tool this
proof-of-concept exercises rather than something specific to it.
