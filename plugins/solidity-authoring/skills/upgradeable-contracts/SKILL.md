---
name: upgradeable-contracts
description: |
  Use when writing, reviewing, or upgrading Solidity contracts that sit
  behind a proxy, and asked to follow this author's conventions rather than
  generic best practice. Triggers: adding a transparent proxy, naming a
  proxy, "named proxy", choosing between transparent/beacon/diamond proxies,
  adding a field to a struct used as a mapping's value type, resizing or
  touching `__gap`, "storage layout", "storage gap", reasoning about whether
  a storage change is upgrade-safe, reviewing an upgrade diff for storage
  collisions. Do NOT use for finding vulnerabilities or writing an audit
  report (see the solidity-audit plugin); do NOT use for actually running
  upgrade/verification/storage-diff tooling (see the evm-ops plugin's
  validate-storage-upgrade and upgrade-pipeline skills, which this skill
  points to but does not replace); and do NOT use for NatSpec, function
  ordering, or non-upgrade deploy conventions (see the sibling
  contract-style skill).
---

# Upgradeable contracts

## Overview

Conventions for contracts that live behind a proxy: how the proxy itself
should be deployed and named, and how storage changes across upgrades stay
safe. Both problems share a root cause when they go wrong: trusting
intuition about how Solidity lays out storage instead of checking the
actual slot mechanics. Apply these by default whenever a contract in this
author's projects is upgradeable.

## Outcomes we are looking for

**Every deployed proxy is identifiable on-chain by name, not generic bytecode.**
Signals: the verified source name shown on a block explorer or in a Tenderly
trace matches the proxy's business purpose, not `TransparentUpgradeableProxy`.

**Storage-layout changes are verified against actual slot mechanics, not intuition.**
Signals: any diff touching `__gap` or a struct used as a mapping's value
type is justified by a `forge inspect ... storage-layout` diff, not by
someone's read of the code; a flagged storage diff is never dismissed
without checking raw slot numbers first; a struct used as a dynamic
array's element type is never resized at all.

**New top-level state variables are only ever appended, and `__gap` tracks them exactly.**
Signals: `__gap` shrinks by precisely the number of new top-level variables
added in the same upgrade, never as a reflex to "we added something."
Existing variables never get reordered or retyped in place.

**Transparent proxies stay the default, chosen deliberately over beacon or diamond.**
Signals: a beacon or diamond proxy in a deployment has a documented reason
(many instances sharing one implementation pointer, for beacon); nothing is
on a diamond by default given its added facet-routing complexity.

## Principles

- Prefer transparent proxies over beacon or diamond proxies by default: the
  tooling around them (verification, upgrade scripts, Safe tx builders) is
  mature and well understood. Reach for a beacon proxy only when many
  instances must share one implementation pointer. Treat diamond proxies as
  a legacy choice; their facet-routing complexity tends to fight upgrade
  tooling as a contract's logic grows across upgrades.
- Give every deployed transparent proxy an on-chain name distinct from
  "TransparentUpgradeableProxy" (see Recommended tools and practices), so
  operators can tell proxies apart in explorers, Tenderly, and Safe UIs
  without cross-referencing an address book first.
- Know which state lives in the contract's own sequential slots and which
  doesn't, and know that mappings and dynamic arrays are NOT
  interchangeable here despite looking similar. A mapping's value type
  never occupies the contract's own slots: each entry is independently
  stored at a keccak256-derived location keyed off the mapping's own
  single anchor slot, so growing that value type's struct is safe. A
  dynamic array's element type is different: elements are packed
  sequentially starting at a keccak256-derived base, back to back, so
  changing the element struct's size changes the stride between elements
  and corrupts every element after the first when read back under the new
  layout. Never resize a struct used as an array's element type in an
  upgrade. See `references/storage-layout-slots.md` for the mechanics, a
  worked mapping example, and a reproduction of the array corruption.
- Treat `__gap` resizing as tied to top-level variables only: shrink it by
  exactly the number of new top-level state variables an upgrade adds,
  and never touch it for a change confined to a mapping's value type, no
  matter how much bigger that type got.
- Verify storage-layout reasoning with `forge inspect <Contract>
  storage-layout`, diffed old vs. new, before trusting either "this needs a
  gap shrink" or "this doesn't." The mistake in the anti-patterns below
  looked correct on a fast read and only turned out wrong once someone
  checked the actual slot numbers against the live contract.

## Anti-patterns

- A diff adds a field to a struct that's a mapping's value type, and
  shrinks `__gap` by one slot in the same diff, reasoning "we used more
  space, so we need less reserve." The struct's fields never touched the
  contract's own slots; the shrink burns real safety margin to fix a
  problem that didn't exist, and the mistake doesn't surface until a later
  upgrade adds a genuinely new variable and finds the reserve short.
- A `__gap` resize with no corresponding new top-level variable in the same
  diff, or a new top-level variable added with no corresponding `__gap`
  shrink.
- An existing state variable's declared type changed in place (`uint128` to
  `uint256`) instead of leaving it alone and adding a new variable,
  silently reinterpreting whatever bytes were already written to its slot.
- A flagged storage-layout diff dismissed as a false positive on a quick
  read, without pulling the actual `forge inspect ... storage-layout` slot
  numbers to confirm.
- Existing state variables reordered "for readability" during an unrelated
  refactor, shifting every variable declared after it to a different slot.
- Every proxy in a deployment verified and displayed as generic
  `TransparentUpgradeableProxy`, so a dozen live proxies are
  indistinguishable in an explorer or a Tenderly trace until each address
  is looked up.
- Proxy wrapper contracts hand-copied from a previous deployment and
  manually edited, risking a mismatched `NAME` constant that doesn't match
  the contract's actual filename or purpose.
- A field added to a struct used as a dynamic array's element type,
  treated as safe because "it's the same as the mapping case." It isn't:
  array elements are packed back-to-back, so this shifts the stride
  between them and corrupts every element after the first when read back
  under the new layout.

## Recommended tools and practices (as of 2026-07-29)

### For: every deployed proxy is identifiable on-chain by name

- Wrap OpenZeppelin's `TransparentUpgradeableProxy` in a minimal
  per-deployment contract that adds one `string public constant NAME`,
  inlined into bytecode at compile time so it both prevents two proxies
  from verifying as byte-identical contracts and stays readable directly
  off the deployed proxy. `assets/NamedProxy.template.sol` is this pattern
  as a template.
- Generate the wrapper from that template instead of hand-copying an
  existing proxy file per deployment: `scripts/generate-named-proxy.sh
  YourContractProxy YourContract ./src` produces a ready-to-compile file
  deterministically, so every proxy in a deployment stays shaped
  identically and upgrade/verification/Safe tooling can assume the same
  constructor signature across all of them.
- Derive the name from the implementation it wraps wherever possible
  (`{ImplementationName}Proxy`), so the name can't drift from what it
  actually points at.

### For: storage-layout changes verified against actual slot mechanics

- Run `forge inspect <Contract> storage-layout`, before and after, on any
  upgrade touching `__gap` or a struct used as a mapping's value type;
  diff the slot numbers rather than reasoning from the diff alone. For a
  struct used as an array's element type, don't resize it at all, and
  treat any diff that does as a blocker regardless of what the slot diff
  shows.
  `references/storage-layout-slots.md` and its four `assets/StorageLayout*`
  contracts are a reproducible worked example of exactly this check.
- Use evm-ops's `validate-storage-upgrade` skill/tool for real upgrades: it
  runs this same class of check mechanically against deployed source, and
  is what actually caught the `__gap` mistake this skill's anti-patterns
  describe. Treat its ERRORS as blocking.

## References

- `assets/NamedProxy.template.sol`: the named-proxy pattern as a template
  with `{{CONTRACT_NAME}}`/`{{IMPLEMENTATION_NAME}}` placeholders.
- `scripts/generate-named-proxy.sh`: generates a named-proxy contract from
  the template; deterministic, no manual editing of generated output.
- `assets/StorageLayoutV1.sol`, `StorageLayoutV2Bad.sol`,
  `StorageLayoutV2Good.sol`, `StorageLayoutV3Good.sol`: a verified,
  buildable progression showing a mapping-value struct growing safely
  (V1 to V2Good), the same change done wrong (V2Bad), and a genuine new
  top-level variable done right (V3Good).
- `assets/ArrayElementCorruption.t.sol`: a verified, passing test proving
  the opposite case, growing a struct used as an array's element type
  corrupts existing data, unlike the mapping case above.
- `references/storage-layout-slots.md`: the slot mechanics behind those
  four contracts, with the actual `forge inspect` output and the incident
  that motivated this section.
- `../contract-style/references/compiling-with-forge.md`: install and
  remapping steps for building these assets in a real Foundry project.
- OpenZeppelin `TransparentUpgradeableProxy`:
  https://docs.openzeppelin.com/contracts/api/proxy#TransparentUpgradeableProxy
- OpenZeppelin storage gaps pattern:
  https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps

## Continual improvement

File drift, gaps, or proposed updates at
https://github.com/DeFiFoFum/fofum-solidity-skills/issues
