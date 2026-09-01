.PHONY: setup test test-fork refresh-vendored verify clean

setup:
	forge install foundry-rs/forge-std --no-git

# Daily tier: no RPC needed, matches the vendored-bytecode-tier claim.
test:
	forge test -vv --no-match-contract ForkWETHTest

# Weekly tier: needs a live RPC. Not part of `verify` (that must run with
# no secrets/network), call it explicitly:
#   make test-fork RPC_URL=https://ethereum-rpc.publicnode.com
test-fork:
	@test -n "$(RPC_URL)" || (echo "Usage: make test-fork RPC_URL=<rpc-url>" >&2; exit 1)
	forge test -vv --match-contract ForkWETHTest --fork-url $(RPC_URL)

# Re-fetches the vendored WETH9 bytecode for real and diffs it against
# what's committed, proving the fetch script still works and showing
# whether the real contract has changed since it was last vendored.
#   make refresh-vendored RPC_URL=https://ethereum-rpc.publicnode.com
refresh-vendored:
	@test -n "$(RPC_URL)" || (echo "Usage: make refresh-vendored RPC_URL=<rpc-url>" >&2; exit 1)
	../../scripts/fetch-vendored-bytecode.sh \
		0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 \
		$(RPC_URL) \
		WETH9 \
		/tmp/vendored-refresh-check
	diff vendored/WETH9.runtime.hex /tmp/vendored-refresh-check/WETH9.runtime.hex \
		&& echo "Vendored WETH9 bytecode still matches live mainnet." \
		|| echo "Vendored WETH9 bytecode differs from live mainnet, consider refreshing."

# The default, secrets-free path: install dependencies and prove every
# daily-tier claim in SKILL.md. Does not need RPC_URL.
verify: setup test

clean:
	rm -rf lib out cache
