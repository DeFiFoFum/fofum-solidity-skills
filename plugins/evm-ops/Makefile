# evm-ops Plugin - Makefile
# Install and manage tool dependencies.
#
# Only useful for Claude Code plugin installs, where the whole plugin tree is
# present. When skills are installed individually with `npx skills`, follow the
# per-skill setup instructions in each SKILL.md instead.

PLUGIN_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
# Tools live inside the skill that owns them: skills/<skill>/tools/<tool>/
TOOL_DIRS := $(wildcard $(PLUGIN_DIR)skills/*/tools/*/)
# Tools with real dependencies to install
DEP_TOOLS := skills/contract-diff/tools/contract-diff skills/validate-storage-upgrade/tools/validate-storage

.PHONY: help setup setup-env install verify clean

help:
	@echo "evm-ops Plugin"
	@echo ""
	@echo "  make setup       - Install all tool dependencies (run once after install)"
	@echo "  make setup-env   - Create .env from .env.example for global credentials"
	@echo "  make verify      - Check all prerequisites (Bun, Forge, cast)"
	@echo "  make clean       - Remove all node_modules from tools"
	@echo ""
	@echo "Plugin installed at: $(PLUGIN_DIR)"

# Install bun deps for every tool that ships a package.json
setup:
	@echo "Installing tool dependencies..."
	@echo ""
	@for tool in $(TOOL_DIRS); do \
		if [ -f "$$tool/package.json" ]; then \
			echo "  → $$tool"; \
			(cd "$$tool" && bun install --silent 2>/dev/null || bun install); \
		fi; \
	done
	@echo ""
	@echo "✅ Setup complete! All tool dependencies installed."
	@echo ""
	@echo "Next: add to your project's .env:"
	@echo "  ETHERSCAN_V2_API_KEY=..."
	@echo "  TENDERLY_USER=..."
	@echo "  TENDERLY_PROJECT=..."
	@echo "  TENDERLY_ACCESS_KEY=..."
	@echo "  RPC_URL=..."

# Create plugin-level .env from example
setup-env:
	@if [ -f "$(PLUGIN_DIR).env" ]; then \
		echo "⚠️  $(PLUGIN_DIR).env already exists: edit it directly."; \
	else \
		cp "$(PLUGIN_DIR).env.example" "$(PLUGIN_DIR).env"; \
		echo "✅ Created $(PLUGIN_DIR).env"; \
		echo "   Fill in your credentials then run: make verify"; \
	fi

# Check prerequisites
verify:
	@echo "Checking prerequisites..."
	@echo ""
	@command -v bun >/dev/null 2>&1 && echo "  ✅ bun $(shell bun --version)" || echo "  ❌ bun not found: curl -fsSL https://bun.sh/install | bash"
	@command -v forge >/dev/null 2>&1 && echo "  ✅ forge $(shell forge --version 2>/dev/null | head -1)" || echo "  ❌ forge not found: curl -L https://foundry.paradigm.xyz | bash && foundryup"
	@command -v cast >/dev/null 2>&1 && echo "  ✅ cast" || echo "  ❌ cast not found (install Foundry)"
	@echo ""
	@for tool in $(DEP_TOOLS); do \
		if [ -d "$(PLUGIN_DIR)$$tool/node_modules" ]; then \
			echo "  ✅ $$tool deps installed"; \
		else \
			echo "  ❌ $$tool deps missing: run make setup"; \
		fi; \
	done

# Remove all node_modules
clean:
	@for tool in $(TOOL_DIRS); do \
		rm -rf "$$tool/node_modules"; \
	done
	@echo "Cleaned node_modules from all tools."
