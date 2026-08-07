---
name: test-realism
description: |
  Use when writing or reviewing Solidity tests, or deciding how a contract
  or integration should be tested, and asked to follow this author's
  conventions rather than generic best practice. Triggers: "should I mock
  this", writing a mock contract, "test like you fly", integration test vs
  unit test, fork testing, "vendored bytecode", vm.etch, setting up a CI
  test workflow for a Solidity repo, deciding what runs on every PR vs on a
  schedule, gas/performance benchmarking, "how should this be tested". Do
  NOT use for finding vulnerabilities or writing an audit report (see the
  solidity-audit plugin); do NOT use for actually running deployment,
  verification, or Tenderly simulation tooling (see the evm-ops plugin,
  which this skill points to but does not replace); and do NOT use for
  NatSpec, function ordering, proxy patterns, or storage layout (see the
  sibling contract-style and upgradeable-contracts skills).
---

# Test realism

## Overview

How this author decides what a Solidity test should actually run against.
The SpaceX motto "test like you fly, fly like you test" is the frame: the
more a test's execution environment resembles the real deployment
environment, the more it can be trusted as a signal the code will actually
work there. Mocks have a place, but it's a narrow one. This skill covers
the realism spectrum from mock to vendored bytecode to live fork, and which
one belongs in a fast per-PR suite versus a slower scheduled one.

## Outcomes we are looking for

**Tests exercise real external-protocol bytecode wherever feasible, not hand-rolled mocks.**
Signals: interfaces to oracles, DEXs, tokens, and other external protocols
are backed by actual deployed bytecode (vendored or forked), not a custom
`Mock*.sol` reimplementing their behavior; a mock in the diff has a comment
explaining why no real bytecode alternative was reasonable.

**CI on every push is fast, deterministic, and still realistic.**
Signals: the per-push suite runs with no live RPC dependency yet still
exercises real external bytecode via `vm.etch`; it isn't flaky against
provider rate limits or outages, and it isn't secretly a suite of mocks
wearing a "unit test" label.

**Full live-fork and performance tests run on a recurring cadence, not blocking every PR.**
Signals: a scheduled job (cron, not on-push) runs against a live fork and
gas/performance benchmarks; a failure there is treated as its own
monitoring signal to triage, not as a status check blocking an unrelated
same-day PR the way a per-push test failure does.

**A test's realism tier is a deliberate choice, not a default to whatever's fastest to write.**
Signals: a reviewer can point at any test file and say which tier it's in
(mock, vendored bytecode, live fork) and why that tier fits what it's
checking.

## Principles

- Default to real bytecode over a mock. Reach for a mock only when no
  reasonable real bytecode can stand in for the dependency (e.g. a
  deliberately broken counterparty for a specific revert path) or when a
  unit test is isolating behavior from a genuinely irrelevant external
  call for speed. "Faster to write" alone doesn't justify a mock of a
  protocol whose actual behavior the contract depends on.
- For anything that runs on every push, prefer vendored bytecode (a
  deployed contract's real runtime bytecode, fetched once and loaded with
  `vm.etch`) over both mocks and a live RPC fork: it's deterministic,
  doesn't depend on network availability or rate limits, and is still the
  actual bytecode that runs in production, not a stand-in for it.
- Reserve live fork testing (`--fork-url`) for the slower, scheduled suite.
  It's the closest a test gets to flying, but RPC dependency, cost, and
  state drift as the chain moves make it the wrong thing to gate every PR
  on.
- Treat the scheduled fork/performance suite as a monitoring signal, not a
  merge gate: a failure there means something in the live environment
  moved out from under the code, and should be triaged on its own, not
  bundled into whatever PR happens to be open that day.
- Benchmark gas and performance against real bytecode, and real forked
  state where feasible, on the same scheduled cadence as fork tests: the
  gas cost of an external call depends on the real callee's actual
  implementation, and a benchmark against a mock measures the mock, not
  the thing that will actually run.
- Refresh vendored bytecode and pinned fork blocks deliberately rather than
  fetching once and never touching them again; an unrefreshed vendored
  artifact after the real contract upgrades is testing against a version
  of the world that no longer exists.

## Anti-patterns

- A `MockUniswapRouter.sol` or `MockChainlinkAggregator.sol` reimplementing
  a real external protocol's interface, that quietly drifts from the real
  contract's actual behavior over time (fee-on-transfer quirks, rounding,
  revert conditions) while the tests against it keep passing.
- Every test in the suite hitting a live RPC fork, so the per-push CI
  suite is flaky and slow, and depends on RPC provider uptime and rate
  limits to merge anything.
- A gas benchmark run against mocked dependencies, whose reported gas cost
  bears no relationship to what the real external call actually costs.
- A "fork test" pinned to a block from months ago and never refreshed, so
  it's testing against how the world used to be rather than how it
  currently is.
- Vendored bytecode fetched once and left unrefreshed indefinitely after
  the real on-chain contract upgrades, so CI keeps passing against stale
  logic without anyone noticing.
- A scheduled fork-test failure treated as a blocking gate on an unrelated
  same-day PR, instead of being triaged as its own signal about the live
  environment.
- A mock named generically (`MockToken`, `MockReceiver`) shared across
  unrelated tests out of convenience, instead of named for the specific
  behavior it exists to fake (`RevertingReceiver`) and scoped to the one
  test that needs it.

## Recommended tools and practices (as of 2026-08-06)

### For: CI on every push uses real bytecode without a live RPC dependency

- Fetch a dependency's real deployed runtime bytecode once with
  `scripts/fetch-vendored-bytecode.sh <address> <rpc-url> <name>
  [output-dir]`, and load it in a test with `vm.parseBytes(vm.readFile(...))`
  plus `vm.etch`. `assets/VendoredWETH.t.sol` is a verified, passing
  example against real mainnet WETH9 bytecode; `references/
  vendored-bytecode-setup.md` covers the `fs_permissions` config and the
  trailing-newline gotcha that actually breaks this in practice.
- Use the evm-ops plugin's `etherscan-source`/`sourcify-source` tools when
  you need real deployed *source* (not just runtime bytecode) to compile
  against locally, e.g. to call internal helper logic a bare interface
  can't reach.

### For: full fork/performance tests run on a schedule, not per-PR

- Use `forge test --fork-url <rpc>` in a separate, cron-triggered CI job,
  not the on-push one. `assets/ci-solidity-tests.yml` is a verified
  two-job GitHub Actions workflow: `daily` runs vendored-bytecode tests on
  every push, `weekly` runs live-fork tests and `forge snapshot --diff` on
  a Monday cron. `assets/ForkWETH.t.sol` is the fork-tier counterpart to
  the vendored example, verified passing with `--fork-url` against live
  mainnet.
- Pin and periodically refresh the fork block as part of that scheduled
  job, so "weekly" also means "against roughly current chain state," not
  a block frozen at the job's creation date.

### For: mocks reserved for their limited real place

- When a mock is genuinely justified, name it for the specific behavior it
  fakes so the reason reads at the call site, and keep it local to the
  test that needs it rather than promoting it to a shared fixture other
  tests reach for by default.

## References

- `scripts/fetch-vendored-bytecode.sh`: fetches a contract's real deployed
  runtime bytecode from a live RPC and writes it as a vendored artifact
  plus provenance JSON; deterministic, re-run deliberately to refresh.
- `assets/IWETH9.sol`: minimal interface used by both example tests below.
- `assets/VendoredWETH.t.sol`: the vendored-bytecode tier, 3 tests verified
  passing against real mainnet WETH9 bytecode with no RPC at test time.
- `assets/vendored/WETH9.runtime.hex` and `WETH9.provenance.json`: the
  vendored artifact `VendoredWETH.t.sol` loads, with fetch provenance.
- `assets/ForkWETH.t.sol`: the live-fork tier, 2 tests verified passing
  with `forge test --fork-url` against real mainnet state.
- `assets/ci-solidity-tests.yml`: verified-valid GitHub Actions workflow
  showing the daily/weekly split described above.
- `references/vendored-bytecode-setup.md`: exact setup steps, including the
  `fs_permissions` requirement and the trailing-newline gotcha.
- `../contract-style/references/compiling-with-forge.md`: base Foundry
  project setup these examples assume.

## Continual improvement

File drift, gaps, or proposed updates at
https://github.com/DeFiFoFum/fofum-solidity-skills/issues
