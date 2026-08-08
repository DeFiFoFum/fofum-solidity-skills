OZ_VERSION := v5.7.0

.PHONY: setup generate test verify clean

setup:
	forge install foundry-rs/forge-std --no-git
	forge install OpenZeppelin/openzeppelin-contracts@$(OZ_VERSION) --no-git

# Runs the actual generator script (not a hand-written stand-in for it)
# to produce a proxy from the template into src/generated/. If the
# generator or template breaks, this step fails before forge ever gets
# a chance to paper over it.
generate:
	../../scripts/generate-named-proxy.sh GeneratedExampleProxy GeneratedExample ./src/generated

test: generate
	forge test -vv

# One command: install dependencies, generate a proxy from the template
# via the real script, then prove every claim in SKILL.md and
# references/storage-layout-slots.md with passing tests.
verify: setup test

clean:
	rm -rf lib out cache src/generated
