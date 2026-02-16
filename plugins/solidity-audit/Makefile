# Fofum Solidity Audit Skill - Makefile
# Simple commands for managing subtrees and development

.PHONY: help setup update-all update-tob update-hacks update-attacks clean index search

# Default target
help:
	@echo "Fofum Solidity Audit Skill"
	@echo ""
	@echo "Setup:"
	@echo "  make setup          - Add all upstream subtrees (first time only)"
	@echo ""
	@echo "Updates:"
	@echo "  make update-all     - Pull updates from all upstreams"
	@echo "  make update-tob     - Pull Trail of Bits skills updates"
	@echo "  make update-hacks   - Pull DeFiHackLabs updates"
	@echo "  make update-attacks - Pull learn-evm-attacks updates"
	@echo ""
	@echo "Vector Index:"
	@echo "  make index          - Build/rebuild exploit vector index"
	@echo "  make search Q=query - Search exploits (e.g., make search Q='reentrancy')"
	@echo ""
	@echo "Other:"
	@echo "  make clean          - Remove upstream directories (use with caution)"
	@echo "  make status         - Show git status"

# First-time setup: add all subtrees
setup:
	@echo "Adding Trail of Bits skills..."
	git subtree add --prefix=upstream/trailofbits-skills \
		https://github.com/trailofbits/skills.git main --squash
	@echo ""
	@echo "Adding DeFiHackLabs..."
	git subtree add --prefix=upstream/DeFiHackLabs \
		https://github.com/SunWeb3Sec/DeFiHackLabs.git main --squash
	@echo ""
	@echo "Adding learn-evm-attacks..."
	git subtree add --prefix=upstream/learn-evm-attacks \
		https://github.com/coinspect/learn-evm-attacks.git master --squash
	@echo ""
	@echo "✅ Setup complete! All upstream repos added."

# Update all upstreams
update-all: update-tob update-hacks update-attacks
	@echo "✅ All upstreams updated!"

# Update Trail of Bits skills
update-tob:
	@echo "Pulling Trail of Bits skills updates..."
	git subtree pull --prefix=upstream/trailofbits-skills \
		https://github.com/trailofbits/skills.git main --squash -m "Update: Trail of Bits skills"

# Update DeFiHackLabs
update-hacks:
	@echo "Pulling DeFiHackLabs updates..."
	git subtree pull --prefix=upstream/DeFiHackLabs \
		https://github.com/SunWeb3Sec/DeFiHackLabs.git main --squash -m "Update: DeFiHackLabs"

# Update learn-evm-attacks
update-attacks:
	@echo "Pulling learn-evm-attacks updates..."
	git subtree pull --prefix=upstream/learn-evm-attacks \
		https://github.com/coinspect/learn-evm-attacks.git master --squash -m "Update: learn-evm-attacks"

# Show status
status:
	@git status
	@echo ""
	@echo "Upstream directories:"
	@ls -la upstream/ 2>/dev/null || echo "  (not set up yet - run 'make setup')"

# Build vector index
index:
	@echo "Building exploit vector index..."
	@pip install -q lancedb sentence-transformers 2>/dev/null || true
	python scripts/build-index.py

# Search exploits
search:
ifndef Q
	@echo "Usage: make search Q='your query'"
	@echo "Example: make search Q='reentrancy callback'"
else
	@python scripts/search-exploits.py "$(Q)"
endif

# Clean upstream (use with caution!)
clean:
	@echo "⚠️  This will remove all upstream directories!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	rm -rf upstream/
	git add -A
	git commit -m "Remove upstream subtrees"
	@echo "Cleaned. Run 'make setup' to re-add."
