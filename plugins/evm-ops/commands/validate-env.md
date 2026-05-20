---
name: validate-env
description: Check that all required tools and environment variables are configured for evm-ops. Use when setting up the plugin, troubleshooting missing credentials, or verifying the environment before running upgrade workflows.
---

# Validate Environment

Check all prerequisites for evm-ops.

## Checks to Run

- [ ] Bun installed: `bun --version`
- [ ] Forge installed: `forge --version`
- [ ] cast installed: `cast --version`
- [ ] `.env` file exists in project root
- [ ] `ETHERSCAN_V2_API_KEY` set in `.env`
- [ ] `TENDERLY_USER`, `TENDERLY_PROJECT`, `TENDERLY_ACCESS_KEY` set in `.env`
- [ ] RPC URL configured (`RPC_URL` or chain-specific variant)
- [ ] Tool deps installed in plugin directory (not project): run `make -f ${CLAUDE_SKILL_DIR}/../Makefile verify`

## Fix Instructions

**Missing Bun:** `curl -fsSL https://bun.sh/install | bash`

**Missing Foundry:** `curl -L https://foundry.paradigm.xyz | bash && foundryup`

**Missing tool deps** (works for both local and global plugin installs):
```bash
make -f ${CLAUDE_SKILL_DIR}/../Makefile setup
```

**Missing API keys:** add to project `.env`:
```bash
ETHERSCAN_V2_API_KEY=your_etherscan_key
TENDERLY_USER=your_username
TENDERLY_PROJECT=your_project
TENDERLY_ACCESS_KEY=your_key
RPC_URL=https://your-rpc-url
```
