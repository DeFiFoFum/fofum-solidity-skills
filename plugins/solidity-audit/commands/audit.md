---
name: audit
description: Start a comprehensive Solidity smart contract security audit
---

# /audit

Initiates a structured security audit of Solidity smart contracts.

## Usage

```
/audit                          # Audit current directory
/audit src/                     # Audit specific directory
/audit src/Vault.sol           # Audit specific file
/audit --focus reentrancy      # Focus on specific vulnerability class
/audit --quick                 # Quick scan (static analysis only)
```

## Options

- `--focus <category>`: Focus on specific category (reentrancy, access, oracle, etc.)
- `--quick`: Static analysis only, skip manual review
- `--report`: Generate formatted report at end
- `--severity <level>`: Only report findings >= severity (critical, high, medium, low)

## What It Does

1. **Detects project type** (Foundry/Hardhat)
2. **Runs reconnaissance** (scope, architecture, entry points)
3. **Executes static analysis** (Slither if available)
4. **Guides manual review** using checklist
5. **Helps write PoCs** for findings
6. **Generates report** in standard format

## Example Session

```
> /audit src/core/

🔍 Scanning src/core/...
Found 5 contracts, 23 external functions

📋 Phase 1: Reconnaissance
- Drawing inheritance graph...
- Mapping external calls...
- Identifying privileged roles...

⚡ Phase 2: Static Analysis
Running Slither...
[HIGH] Reentrancy in Vault.withdraw()
[MEDIUM] Missing zero-address check in setOracle()

📝 Phase 3: Manual Review
Starting checklist... (use /audit-next to continue)
```
