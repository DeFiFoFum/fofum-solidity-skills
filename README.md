# Fofum Solidity Skills

Claude Code plugin marketplace for Solidity smart contract development and security. Install plugins to give Claude specialized knowledge and tools for auditing, upgrading, and operating EVM contracts.

## Plugins

| Plugin | Purpose | Type |
|--------|---------|------|
| [solidity-audit](#solidity-audit) | Smart contract security auditing | 100% Markdown |
| [evm-ops](#evm-ops) | Live contract operations: diffs, upgrades, simulations | TypeScript tools |
| [solidity-authoring](#solidity-authoring) | Contract authoring conventions: NatSpec, storage safety, test realism | 100% Markdown |

---

## Install

### Claude Code (full plugins: skills, commands, and agents)

```bash
# Add this marketplace
/plugin marketplace add DeFiFoFum/fofum-solidity-skills

# Install a plugin
/plugin install solidity-audit@fofum-solidity-skills
/plugin install evm-ops@fofum-solidity-skills
/plugin install solidity-authoring@fofum-solidity-skills
```

Or use the `/plugin` → **Discover** tab to browse and install.

### Any other agent (Cursor, Codex, Cline, Copilot, Windsurf, and 70+ more)

Every skill here is self-contained, so the [`skills` CLI](https://github.com/vercel-labs/skills) can install it into whichever harness you use:

```bash
# Pick skills interactively
npx skills add DeFiFoFum/fofum-solidity-skills

# Or install one non-interactively, globally, for a specific agent
npx skills add DeFiFoFum/fofum-solidity-skills --skill fofum-solidity-audit -g -a cursor -y
```

Slash commands and subagents are Claude Code plugin features and do not transfer. The skills themselves, plus their tools, resources, and assets, do.

---

## solidity-audit

Security audit plugin with multi-agent architecture, 100+ item checklist, and real exploit references. 100% Markdown: no executable code, no npm install, safe for production codebases.

**What you get:**
- 5-phase audit methodology (Reconnaissance, Static Analysis, Manual Review, Verification, Reporting)
- 100+ item checklist with SWC IDs and severity guidance
- 6 specialized agents: reentrancy, oracle, access control, flash loan, upgradeability, logic
- Exploit references from $3.4B+ in real hacks
- Protocol guides: lending, AMM, staking, governance, bridges
- Professional report template

**Quick start:**

```bash
/plugin install solidity-audit@fofum-solidity-skills
/validate
```

Then ask Claude:

```
Audit the contracts in src/
```

```
Run a full security audit on this DeFi protocol
```

**Eval results** (22 real-world exploits):
```
Recall:          100% (22/22 known bugs found)
Extra findings:  19
False positives: 0
Grade:           A+
```

See [fofum-solidity-evals](https://github.com/DeFiFoFum/fofum-solidity-evals) for methodology.

---

## evm-ops

Operations toolkit for managing live EVM smart contracts. Includes Bun-runnable TypeScript tools for fetching verified source, generating upgrade diffs, validating storage layouts, building Gnosis Safe transactions, and simulating on Tenderly.

**What you get:**
- `etherscan-source`: fetch verified source from Etherscan V2 (all major chains)
- `contract-diff`: side-by-side HTML diffs of old vs new implementation for multi-sig review
- `validate-storage-upgrade`: storage layout safety checks before proxy upgrades
- `safe-tx-builder`: generate Gnosis Safe Transaction Builder JSON for proxy upgrades
- `tenderly-simulate`: simulate Safe transaction batches before signing
- `/upgrade-pipeline`: orchestrate the full upgrade workflow end-to-end

**Prerequisites:** Bun, Foundry (forge + cast), Etherscan V2 API key, Tenderly credentials.

**Quick start:**

```bash
/plugin install evm-ops@fofum-solidity-skills
```

Install tool dependencies (run once, works for both local and global installs):

```bash
make -f ~/.claude/plugins/evm-ops/Makefile setup
```

Set up global credentials (optional: tools also read from project `.env`):

```bash
make -f ~/.claude/plugins/evm-ops/Makefile setup-env
# Edit ~/.claude/plugins/evm-ops/.env with your API keys
```

Verify everything is configured:

```bash
/validate-env
```

Then ask Claude:

```
Fetch the source for 0x1234... on base
```

```
Generate an upgrade diff for VaultManager: 0xOLD vs 0xNEW on linea
```

```
Validate storage upgrade safety for MyContract against deployed on arbitrum
```

```
/upgrade-pipeline --chain base --proxy-admin 0x... --safe 0x... MyContract:0xOLD:0xNEW
```

**Supply chain note:** evm-ops includes TypeScript tools (Bun-runnable). Each tool lives inside the skill that owns it, at `skills/<skill>/tools/`. Review them before installing if supply chain is a concern.

---

## solidity-authoring

Authoring conventions for writing Solidity, separate from auditing it (`solidity-audit`) or operating it (`evm-ops`). 100% Markdown, with example contracts and scripts as skill assets.

**What you get:**
- `contract-style`: NatSpec precision, feature-first function ordering, deploy-time value inference
- `upgradeable-contracts`: named-proxy pattern, proxy type selection, storage-layout safety across upgrades
- `test-realism`: mock vs. vendored-bytecode vs. live-fork testing tiers, and CI cadence

**Quick start:**

```bash
/plugin install solidity-authoring@fofum-solidity-skills
```

Then ask Claude:

```
Write a new upgradeable vault contract following my conventions
```

---

## Contributing

PRs welcome. See [STANDARDS.md](./STANDARDS.md) for how to author new skills and plugins.

## License

MIT
