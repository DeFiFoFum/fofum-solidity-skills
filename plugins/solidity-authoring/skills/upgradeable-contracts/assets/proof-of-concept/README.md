# upgradeable-contracts proof of concept

A self-contained Foundry project proving the claims in `../../SKILL.md`
and `../../references/storage-layout-slots.md` with real code and passing
tests, not just prose.

## Run it

```bash
make verify
```

Installs pinned dependencies, runs the real `scripts/generate-named-proxy.sh`
against `templates/NamedProxy.template.sol` to produce a fresh proxy in
`src/generated/`, then runs the full test suite (which includes building
that generated file, proving the generator's actual output compiles, not
just a hand-written stand-in for it).

`make test` re-runs generate+test without reinstalling dependencies.
`make clean` removes `lib/`, `out/`, `cache/`, and the generated proxy.

## What's proven, and by what

| Claim | Proof |
|---|---|
| Growing a struct used as a mapping's value type is safe | `test/MappingValueGrowthIsSafe.t.sol` seeds real storage, simulates an upgrade with `vm.etch`, and asserts the old data reads back correctly through the new, bigger struct |
| Growing a struct used as a dynamic array's element type is NOT safe | `test/ArrayElementCorruption.t.sol` does the same simulated upgrade and asserts the data comes back corrupted |
| `__gap` shrinks only for genuinely new top-level variables, never for a mapping-value struct change | `src/StorageLayoutV1.sol` → `V2Bad.sol`/`V2Good.sol` → `V3Good.sol`; run `forge inspect <Contract> storage-layout` on each (see `../../references/storage-layout-slots.md` for the exact expected output) |
| The named-proxy template and generator actually produce compilable, correctly-named output | `make verify`'s `generate` step runs `scripts/generate-named-proxy.sh` for real and the resulting `src/generated/GeneratedExampleProxy.sol` is compiled as part of `forge test` |

The `forge inspect storage-layout` claims are compile-time metadata, not
runtime behavior. There's nothing a passing/failing test could assert
about a `__gap` array's declared length, since two different lengths
produce identical execution unless and until a future upgrade actually
needs the reserve, that's what forge inspect verifies instead.
