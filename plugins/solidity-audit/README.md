# Fofum Solidity Audit Skill

A comprehensive Claude Code skill for auditing Solidity smart contracts.

**100% markdown, zero executable code.** Safe to use, easy to audit.

## Features

- 📋 **100+ item security checklist** organized by vulnerability category
- 🎯 **Structured 5-phase methodology** (Recon → Static → Manual → Verify → Report)
- 🔥 **Real exploit examples** from The DAO, Cream, Euler, and more
- 📊 **Severity classification** aligned with Code4rena/Sherlock
- 📝 **Report templates** for professional audit deliverables
- 🔗 **Protocol-specific guides** for lending, AMMs, staking, bridges

## Installation

### Via Claude Code Plugin Marketplace

```bash
/plugin marketplace add defifofum/fofum-solidity-audit-skill
/plugin install fofum-solidity-audit-skill
```

### Manual Installation

```bash
git clone https://github.com/defifofum/fofum-solidity-audit-skill
cd fofum-solidity-audit-skill
git submodule update --init --recursive
```

Then add to your Claude Code skills directory or use `--plugin-dir`.

## Usage

Just ask Claude to audit:

```
"Audit my smart contracts"
"Review src/Vault.sol for security issues"
"Check for reentrancy vulnerabilities"
```

Or use the slash command:

```
/audit
/audit src/core/
/audit --focus access-control
```

## What's Included

```
fofum-solidity-audit-skill/
├── skills/fofum-audit/
│   └── SKILL.md              # Main skill with methodology
├── commands/
│   └── audit.md              # /audit slash command
├── resources/
│   ├── checklist.md          # 100+ item checklist with SWC IDs
│   ├── severity.md           # Impact × Likelihood matrix
│   ├── report-template.md    # Professional report format
│   ├── weird-tokens.md       # Fee-on-transfer, rebasing, etc.
│   ├── protocols/            # Protocol-specific guides
│   │   ├── lending.md
│   │   ├── amm.md
│   │   └── ...
│   └── exploits/             # Real exploit breakdowns
│       ├── reentrancy.md
│       ├── oracle.md
│       └── ...
└── submodules/
    ├── DeFiHackLabs/         # 100+ Foundry exploit reproductions
    └── learn-evm-attacks/    # Documented attack patterns
```

## Methodology

### Phase 1: Reconnaissance (15%)
- Scope definition
- Architecture mapping
- Entry point identification
- Role/permission mapping

### Phase 2: Static Analysis (20%)
- Slither scans
- Compiler warnings
- Automated detector results

### Phase 3: Manual Review (50%)
- Checklist-driven review
- Business logic analysis
- Protocol-specific checks
- Economic attack vectors

### Phase 4: Verification (10%)
- PoC development
- Foundry test writing
- Fuzz testing

### Phase 5: Reporting (5%)
- Finding documentation
- Severity classification
- Remediation recommendations

## Exploit Database

This skill includes two comprehensive exploit databases as git submodules:

- **[DeFiHackLabs](https://github.com/SunWeb3Sec/DeFiHackLabs)** (6.4k ⭐) - 100+ Foundry-based exploit reproductions
- **[learn-evm-attacks](https://github.com/coinspect/learn-evm-attacks)** (1.8k ⭐) - Documented exploits with diagrams

To update:
```bash
git submodule update --remote
```

## Safety

This plugin contains **only markdown files**. No:
- ❌ Executable code
- ❌ npm packages
- ❌ Shell scripts
- ❌ Hooks that run on events

You can audit every file yourself. It's just documentation that teaches Claude how to audit.

## Resources

Built on the shoulders of giants:

- [Trail of Bits - Building Secure Contracts](https://github.com/crytic/building-secure-contracts)
- [SWC Registry](https://swcregistry.io/)
- [Solodit Checklist](https://solodit.cyfrin.io/checklist)
- [SlowMist Auditor Roadmap](https://github.com/slowmist/SlowMist-Learning-Roadmap-for-Becoming-a-Smart-Contract-Auditor)
- [Awesome Audit Checklists](https://github.com/TradMod/awesome-audits-checklists)
- [Weird ERC20](https://github.com/d-xo/weird-erc20)

## Contributing

PRs welcome! Please:
1. Keep it markdown-only (no executable code)
2. Include sources/references
3. Add real exploit examples where possible

## License

MIT

## Author

[@defifofum](https://github.com/defifofum)

---

*Built for auditors, by auditors. Stay safe out there.* 🛡️
