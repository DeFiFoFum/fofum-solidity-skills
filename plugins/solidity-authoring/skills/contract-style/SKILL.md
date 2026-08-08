---
name: contract-style
description: |
  Use when writing, editing, or reviewing Solidity contracts and asked to follow
  this author's conventions rather than generic best practice. Triggers: writing
  a new contract or function, adding or tightening NatSpec, ordering functions or
  visibility groups, "make the natspec more precise", "don't mention audit issues
  in comments", "feature-first" ordering, writing a deploy script that sets an
  initial timestamp, snapshot, epoch, or starting value. Do NOT use for finding
  vulnerabilities or writing an audit report (see the solidity-audit plugin); do
  NOT use for running deployment, verification, or upgrade tooling itself (see
  the evm-ops plugin); and do NOT use for proxy patterns or storage-layout safety
  on upgradeable contracts (see the sibling upgradeable-contracts skill) - this
  skill is general authoring conventions, not upgrade-specific ones.
---

# Solidity contract style

## Overview

Conventions for how contracts in this author's projects get written, not how
they get audited or operated. Covers comment/NatSpec discipline, function
ordering inside a contract, and deploy-time value handling. Apply these by
default when generating or editing `.sol` files unless the project's own
style guide says otherwise. Proxy patterns and storage-layout safety for
upgradeable contracts live in the sibling `upgradeable-contracts` skill.

## Outcomes we are looking for

**Comments and NatSpec describe current behavior, never audit history.**
Signals: no comment references a finding ID, ticket number, "per audit," or
"fixed after review"; every `external`/`public` function has `@notice`,
`@param`, and `@return` NatSpec that states units and rounding direction.

**Functions belonging to one feature stay adjacent, regardless of visibility.**
Signals: grepping a feature's function-name prefix returns a contiguous block
of lines, not scattered hits across separate `external`/`internal`/`private`
sections of the file.

**Deploy-time values are computed at deploy, not typed in by hand.**
Signals: initial timestamps, snapshots, or starting epochs come from a chain
read in the constructor/initializer or from the deploy script's own broadcast
receipt; a post-deploy validation script can recompute and diff them.

## Principles

- Order functions by feature first, visibility second: keep every function
  that belongs to one feature (its entrypoints, overloads, and internal
  helpers) contiguous, with the external/public entrypoint first within that
  cluster. A reader should be able to read one feature top to bottom without
  jumping across the file.
- Write NatSpec that documents current, exact behavior: units (wei vs. ether,
  bps vs. percent), rounding direction, and non-obvious revert conditions.
  Restating the function name as a sentence is not NatSpec.
- Keep audit trail out of source comments entirely. Findings, ticket numbers,
  and "fixed per review" notes belong in the commit message, PR description,
  or audit report, never in code that ships.
- Default to inferring deploy-time values (initial timestamp, starting
  snapshot, starting epoch) from chain state at deploy time rather than
  hardcoding them into constructor or initializer arguments. Fall back to an
  explicit hardcoded value only when inference itself creates a security risk
  (e.g. a value an attacker could influence by timing the deploy transaction);
  security wins over deploy convenience whenever the two conflict.
- Comment only what the code can't say for itself: skip restating the next
  line, and reserve prose for the constraint, invariant, or edge case a
  reader can't get from the code alone.
- Give revert reasons and custom errors that name the actual constraint
  violated (`ExampleVault: zero recipient`, not `ExampleVault: invalid
  input`), so the message alone is enough to diagnose a failed call without
  opening the function body.

## Anti-patterns

- A comment reading something like `// fixed per audit finding H-2` or
  `// mitigated per Q3 review` left in shipped source, permanently coupling
  the code to a specific stale report instead of describing what the code
  does now.
- `@notice Sets the value` on a function called `setValue` - NatSpec that
  restates the identifier and adds nothing a reader didn't already know.
- A file where every `external` function sits in one block at the top and
  every `internal` helper sits in another block at the bottom, so
  understanding one feature means jumping between two ends of the file.
- A hand-typed literal like `startEpoch: 42` or a fixed unix timestamp sitting
  in a deploy script or config file, disconnected from the block that will
  actually mine the deployment, silently drifting from reality if the deploy
  is delayed or retried.
- A `@dev` line that restates the next line of code in prose (`// increments
  the counter` above `counter++;`) instead of explaining the one thing the
  code itself can't: why this value, why this order, why this edge case.
- A deploy script that computes a "current timestamp" from the machine
  running the script instead of reading it back from the transaction that
  actually got mined, so the value recorded off-chain quietly disagrees with
  what the constructor stored on-chain.

## Recommended tools and practices (as of 2026-07-29)

### For: deploy-time values are inferred, not hardcoded

- Read `block.timestamp` or another live chain value inside the
  constructor/initializer, or capture it from the deploy script's own
  broadcast receipt, rather than passing a literal timestamp/epoch/snapshot
  as a constructor argument.
- Have the post-deploy validation script recompute the same value
  independently and diff it against what actually landed on-chain, so a
  silent mismatch (delayed deploy, retried transaction) is caught
  automatically instead of requiring manual review.

### For: NatSpec precision

- Every `external`/`public` function: `@notice` in plain terms, `@param` per
  parameter, `@return` per return value, with units and rounding direction
  called out whenever they're not the obvious default.
- State non-obvious revert conditions explicitly, either in `@notice` or a
  `@dev` line - e.g. "reverts if `amount` rounds to zero after fee" - rather
  than leaving them to be discovered by reading the function body.

## References

- `assets/proof-of-concept/`: a self-contained, runnable Foundry project
  proving every claim above with real code, not just prose. `make verify`
  installs pinned dependencies and runs the tests; see its own README for
  what's proven and by what. `src/ExampleVault.sol` applies feature-first
  ordering, precise NatSpec, and inferred `depositsOpenedAt`;
  `src/ExampleVaultProxy.sol` is the named-proxy wrapper it's deployed
  behind (generated output, not hand-written; see the sibling
  `upgradeable-contracts` skill for the template and generator it came
  from); `test/ExampleVault.t.sol` has 7 tests, grouped by feature,
  verified passing.
- `references/compiling-with-forge.md`: the same setup as a manual
  walkthrough, for copying individual files into an existing project
  rather than running the proof-of-concept as-is.

## Continual improvement

File drift, gaps, or proposed updates at
https://github.com/DeFiFoFum/fofum-solidity-skills/issues
