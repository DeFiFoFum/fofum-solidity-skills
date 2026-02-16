# Quick Start Guide

Get auditing in 5 minutes.

## Installation

### Option A: Claude Code Plugin (Recommended)

```bash
# Add as plugin
claude /plugin install /path/to/fofum-solidity-audit-skill

# Or if published to marketplace
/plugin marketplace add defifofum/fofum-solidity-audit-skill
/plugin install fofum-solidity-audit-skill
```

### Option B: Clone Locally

```bash
git clone https://github.com/defifofum/fofum-solidity-audit-skill
cd fofum-solidity-audit-skill
```

Then point Claude Code at it:
```bash
claude --plugin-dir /path/to/fofum-solidity-audit-skill
```

---

## Running Your First Audit

### Method 1: Natural Language

Just ask Claude:

```
"Audit the smart contracts in src/"

"Review this contract for security vulnerabilities"

"Check src/Vault.sol for reentrancy issues"
```

The skill auto-activates when it detects audit-related requests.

### Method 2: Slash Command

```
/audit                      # Audit current directory
/audit src/                 # Audit specific directory
/audit src/Vault.sol       # Audit specific file
/audit --focus reentrancy  # Focus on specific vulnerability class
```

---

## What Happens

```
┌─────────────────────────────────────────────────────────┐
│  You: "Audit my contracts"                              │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Reconnaissance                                │
│  - Detect project type (Foundry/Hardhat)               │
│  - Map contract structure                               │
│  - Identify entry points                                │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2: Static Analysis                               │
│  - Run Slither (if available)                          │
│  - Check compiler warnings                              │
│  - Generate call graphs                                 │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Manual Review                                 │
│  - Check 100+ item checklist                           │
│  - Apply specialized agent knowledge                    │
│  - Reference exploit patterns                           │
└─────────────────────────────┬───────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 4 & 5: Verify & Report                          │
│  - Write PoCs for findings                             │
│  - Generate formatted report                            │
└─────────────────────────────────────────────────────────┘
```

---

## Multi-Agent Mode (Parallel Auditing)

For faster, more thorough audits, enable agent teams:

### Enable Agent Teams

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

### Invoke with Agents

```
"Audit src/ using the multi-agent approach"

"Run a parallel audit with specialized agents for reentrancy, 
access control, and oracle vulnerabilities"
```

### What Happens

```
                    Lead Auditor
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │Reentrancy│   │  Access  │   │  Oracle  │
   │  Agent   │   │ Control  │   │  Agent   │
   └────┬─────┘   └────┬─────┘   └────┬─────┘
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              Synthesized Report
```

---

## Example Session

```
You: /audit src/core/

Claude: 🔍 Starting audit of src/core/

**Scope:**
- Vault.sol (245 lines)
- Oracle.sol (89 lines)
- Token.sol (156 lines)

**Phase 1: Reconnaissance**
- Project type: Foundry
- Entry points: 12 external functions
- Privileged roles: owner, guardian

**Phase 2: Static Analysis**
Running Slither...
⚠️ [HIGH] Reentrancy in Vault.withdraw() (Vault.sol:142)
⚠️ [MEDIUM] Missing zero-address check (Oracle.sol:34)

**Phase 3: Manual Review**
Checking access control... ✓
Checking reentrancy patterns... ⚠️ 1 finding
Checking oracle integration... ✓
Checking token handling... ✓

**Findings Summary:**
| Severity | Count |
|----------|-------|
| High     | 1     |
| Medium   | 1     |
| Low      | 0     |

Would you like me to:
1. Show detailed findings with PoCs
2. Generate full audit report
3. Focus on a specific finding
```

---

## Tips

### For Best Results

1. **Provide context** - Share any documentation, specs, or known issues
2. **Scope clearly** - Tell Claude which contracts are in scope
3. **Install Slither** - Static analysis catches low-hanging fruit
4. **Review findings** - AI can have false positives

### Slither Setup (Optional but Recommended)

```bash
pip install slither-analyzer
```

### Focus on Specific Areas

```
/audit --focus reentrancy      # Just reentrancy
/audit --focus access-control  # Just access control
/audit --focus oracle          # Just oracle issues
```

---

## Troubleshooting

**Skill not activating?**
- Check plugin is installed: `/plugin list`
- Try explicit: "Use the fofum-audit skill to review this code"

**Slither not running?**
- Install: `pip install slither-analyzer`
- Check: `slither --version`

**Agents not spawning?**
- Enable: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Restart Claude Code

---

## Next Steps

- Read `SKILL.md` for full methodology
- Check `resources/checklist.md` for all 100+ items
- Browse `upstream/DeFiHackLabs/` for exploit examples
- Customize agents in `agents/` for your needs
