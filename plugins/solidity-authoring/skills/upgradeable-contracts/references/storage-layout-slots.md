# Storage-layout slot mechanics

Read this when a diff touches `__gap`, adds a field to a struct that's a
mapping's value type, or otherwise changes state-variable declarations in a
contract that sits behind a proxy. Explains why some of those changes are
storage-layout-safe and some aren't, with a worked example you can rebuild
and inspect yourself rather than take on faith.

## The rule

A contract's own sequential storage slots (slot 0, 1, 2, ...) are consumed
only by its directly-declared, top-level state variables, in declaration
order. A `mapping`'s own slot just anchors a hash: each entry's actual data
lives at `keccak256(abi.encode(key, mappingSlot))`, a location derived from
that one anchor slot, completely independent of the mapping's value type.
Growing a struct that's a mapping's value type (or an array's element type)
never changes the contract's own slot count, because that struct never had
its own reserved slots to begin with.

`__gap` exists to reserve capacity for genuinely new *top-level* state
variables in a future upgrade. Shrinking it only makes sense when a diff
adds a new top-level variable; shrink by exactly that many slots, no more,
no less.

## The incident this generalizes from

A real upgrade added a new field to a struct that was a mapping's value
type, and shrank `__gap` by one slot in the same commit, reasoning "we used
more space, so we need less reserve." The struct's fields never touched the
contract's own slots, so the shrink solved a problem that didn't exist. It
didn't corrupt anything on that specific upgrade (nothing occupied that slot
either way), but it silently ate one slot of the safety margin reserved for
a genuinely new variable two upgrades later - exactly the kind of mistake
that looks fine in review and only bites once someone else trusts the
reserve is still full size. An automated storage-diff tool caught it; a
first-pass manual read had nearly waved it through as a false positive.

## Reproduce it yourself

The four contracts in `assets/` model exactly this progression. Copy them
into a Foundry project (see `../contract-style/references/compiling-with-forge.md`
for the install/remapping steps) and run:

```bash
forge inspect StorageLayoutV1 storage-layout
forge inspect StorageLayoutV2Bad storage-layout
forge inspect StorageLayoutV2Good storage-layout
forge inspect StorageLayoutV3Good storage-layout
```

Verified output (slot column is what matters):

| Contract | `totalCollateralTypes` | `params` | `feeRecipient` | `__gap` |
|---|---|---|---|---|
| `StorageLayoutV1` | slot 0 | slot 1 | - | slot 2, 50 elements |
| `StorageLayoutV2Bad` | slot 0 | slot 1 (unchanged) | - | slot 2, **49 elements (wrong shrink)** |
| `StorageLayoutV2Good` | slot 0 | slot 1 (unchanged) | - | slot 2, 50 elements (correct, unchanged) |
| `StorageLayoutV3Good` | slot 0 | slot 1 (unchanged) | slot 2 (new) | slot 3, 49 elements (correct: shrunk by exactly 1 for the 1 new variable) |

`params` sits at slot 1 in all four contracts, regardless of whether
`CollateralParams` has two fields or three. Only `StorageLayoutV3Good`,
which adds an actual top-level variable, legitimately moves `__gap` and
shrinks it, and it shrinks by exactly the one slot that variable now
occupies.

## Applying this to a real diff

Ask, for any diff that touches `__gap` or a struct used inside a
`mapping`/array: did this diff add, remove, or reorder a *top-level* state
variable? If yes, `__gap` should move/shrink by exactly that count. If no,
whatever else the diff did to a mapping's value type, `__gap` should not
change at all. Don't settle this from memory under time pressure; run
`forge inspect <old> storage-layout` and `forge inspect <new> storage-layout`
and diff the slot numbers, the same way the incident above was actually
caught and confirmed.
