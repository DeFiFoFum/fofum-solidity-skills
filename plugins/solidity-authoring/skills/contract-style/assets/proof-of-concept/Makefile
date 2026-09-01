OZ_VERSION := v5.7.0

.PHONY: setup test verify clean

# Fetches dependencies at pinned versions. Not vendored/committed: this
# keeps the proof-of-concept's own repo footprint small and its
# dependency versions explicit and reproducible, at the cost of needing
# network access once before the first test run.
setup:
	forge install foundry-rs/forge-std --no-git
	forge install OpenZeppelin/openzeppelin-contracts@$(OZ_VERSION) --no-git
	forge install OpenZeppelin/openzeppelin-contracts-upgradeable@$(OZ_VERSION) --no-git

test:
	forge test -vv

# One command: install dependencies, then prove every claim this skill
# makes. Exit code is the whole point, this is meant to be run in CI,
# not just read.
verify: setup test

clean:
	rm -rf lib out cache
