# Fofum Solidity Skills

Claude Code skills for Solidity smart contract development, deployment, and security auditing.

## Plugins

| Plugin | Description | Status |
|--------|-------------|--------|
| [solidity-audit](./plugins/solidity-audit) | Smart contract security auditing | ✅ Ready |
| solidity-dev | Smart contract development | 🔜 Coming |
| solidity-deploy | Deployment & verification | 🔜 Coming |

## Installation

```bash
# Install a specific plugin
claude plugin add defifofum/fofum-solidity-skills/solidity-audit

# Or browse available plugins
claude plugin search fofum
```

## Philosophy

- **100% Markdown** — No executable code, no supply chain risk
- **Focused Plugins** — Each plugin does one thing well
- **Battle-Tested** — Built on methodologies from Trail of Bits, Code4rena, Sherlock, Cyfrin
- **Real Examples** — Learn from actual DeFi exploits and patterns

## Plugin: solidity-audit

Comprehensive smart contract security auditing with:

- **Multi-agent architecture** — Specialized agents for reentrancy, oracles, access control, etc.
- **100+ item checklist** — With SWC IDs and severity guidance
- **5 exploit references** — Reentrancy, oracle, flash loan, access control, logic bugs
- **5 protocol guides** — Lending, AMM, staking, governance, bridges
- **Professional report template** — Ready for client delivery

[View full documentation →](./plugins/solidity-audit/README.md)

## Contributing

PRs welcome! See individual plugin READMEs for contribution guidelines.

## License

MIT
