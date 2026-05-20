# evm-ops Plugin - Makefile
# Install and manage tool dependencies

PLUGIN_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
TOOLS := contract-diff validate-storage sourcify-source check-forge safe-tx-builder tenderly-simulate etherscan-source

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

# Install bun deps for all tools that need them
setup:
	@echo "Installing tool dependencies..."
	@echo ""
	@for tool in $(TOOLS); do \
		if [ -f "$(PLUGIN_DIR)tools/$$tool/package.json" ]; then \
			echo "  → $$tool"; \
			(cd "$(PLUGIN_DIR)tools/$$tool" && bun install --silent 2>/dev/null || bun install); \
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
		echo "⚠️  $(PLUGIN_DIR).env already exists — edit it directly."; \
	else \
		cp "$(PLUGIN_DIR).env.example" "$(PLUGIN_DIR).env"; \
		echo "✅ Created $(PLUGIN_DIR).env"; \
		echo "   Fill in your credentials then run: make verify"; \
	fi

# Check prerequisites
verify:
	@echo "Checking prerequisites..."
	@echo ""
	@command -v bun >/dev/null 2>&1 && echo "  ✅ bun $(shell bun --version)" || echo "  ❌ bun not found — install: curl -fsSL https://bun.sh/install | bash"
	@command -v forge >/dev/null 2>&1 && echo "  ✅ forge $(shell forge --version 2>/dev/null | head -1)" || echo "  ❌ forge not found — install: curl -L https://foundry.paradigm.xyz | bash && foundryup"
	@command -v cast >/dev/null 2>&1 && echo "  ✅ cast" || echo "  ❌ cast not found (install Foundry)"
	@echo ""
	@for tool in contract-diff validate-storage; do \
		if [ -d "$(PLUGIN_DIR)tools/$$tool/node_modules" ]; then \
			echo "  ✅ $$tool deps installed"; \
		else \
			echo "  ❌ $$tool deps missing — run: make setup"; \
		fi; \
	done

# Remove all node_modules
clean:
	@for tool in $(TOOLS); do \
		rm -rf "$(PLUGIN_DIR)tools/$$tool/node_modules"; \
	done
	@echo "Cleaned node_modules from all tools."
