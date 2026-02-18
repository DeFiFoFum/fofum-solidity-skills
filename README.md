# Fofum Solidity Skills

> **Claude Code skills for Solidity smart contract security auditing**

100% markdown, zero supply chain risk. Battle-tested against [$3.4B+ in real exploits](https://github.com/DeFiFoFum/fofum-solidity-evals).

## Quick Start

```bash
# 1. Add the marketplace
/plugin marketplace add DeFiFoFum/fofum-solidity-skills

# 2. Install the audit plugin
/plugin install solidity-audit@fofum-solidity-skills

# 3. Validate your setup
/validate
```

Or run `/plugin` → **Discover** tab → browse and install.

## What You Get

The `solidity-audit` plugin gives Claude:

- **5-phase audit methodology** — Combines Trail of Bits, Code4rena, Sherlock, Cyfrin, SlowMist
- **100+ item checklist** — With SWC IDs and severity guidance
- **6 specialized agents** — Reentrancy, oracle, access control, flash loan, upgradeability, gas
- **5 exploit references** — Real patterns from $3.4B+ in hacks
- **5 protocol guides** — Lending, AMM, staking, governance, bridges
- **Professional report template** — Ready for client delivery
- **`/validate` command** — Check your setup has recommended tools

## Usage

Once installed, just ask Claude to audit your contracts:

```
Audit the contracts in src/
```

```
Review this contract for security vulnerabilities: [paste code]
```

```
Run a full security audit on this DeFi protocol
```

Claude automatically uses the skill's methodology, checklists, and agents.

## Eval Results

Tested against 22 real-world exploits:

```
✅ RECALL:           100.0% (22/22 known bugs found)
🎁 EXTRA FINDINGS:   19 (bonus issues discovered)
❌ FALSE POSITIVES:  0
📊 OVERALL GRADE:    A+
```

See [fofum-solidity-evals](https://github.com/DeFiFoFum/fofum-solidity-evals) for methodology and benchmarks.

## Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| [solidity-audit](./plugins/solidity-audit) | Smart contract security auditing | ✅ Ready |
| solidity-dev | Smart contract development | 🔜 Coming |
| solidity-deploy | Deployment & verification | 🔜 Coming |

## Philosophy

- **100% Markdown** — No executable code, no npm install, no hooks, no submodules.
- **Zero Supply Chain Risk** — Safe to use on production codebases.
- **Battle-Tested** — Methodologies from the best audit firms.
- **Self-Contained** — All knowledge embedded in markdown files.

## Resources Included

### Exploit References
- Reentrancy patterns (classic, cross-function, read-only)
- Oracle manipulation attacks
- Flash loan exploits
- Access control failures
- Logic bugs and edge cases

### Protocol Guides
- Lending protocols (Compound/Aave patterns)
- AMMs (Uniswap, Curve, Balancer)
- Staking systems
- Governance mechanisms
- Cross-chain bridges

### External Learning Resources
For hands-on exploit reproduction, we recommend:
- [DeFiHackLabs](https://github.com/SunWeb3Sec/DeFiHackLabs) — 300+ exploit reproductions
- [learn-evm-attacks](https://github.com/coinspect/learn-evm-attacks) — Categorized with diagrams
- [building-secure-contracts](https://github.com/crytic/building-secure-contracts) — Trail of Bits guides

## Updating

To get the latest version:
```
/plugin marketplace update fofum-solidity-skills
/plugin install solidity-audit@fofum-solidity-skills
```

## Contributing

PRs welcome! See [STANDARDS.md](./STANDARDS.md) for how to create new skills and plugins.

## License

MIT
