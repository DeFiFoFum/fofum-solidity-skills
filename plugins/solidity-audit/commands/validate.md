# /validate

Verify your Claude Code setup is ready for Solidity security auditing.

## Usage

```
/validate
```

## What It Checks

### Required
- ✅ **fofum-solidity-audit**: This plugin (you have it if you're seeing this)

### Recommended  
- 🔧 **Trail of Bits tools**: Slither, Echidna for static analysis
  - Install: `pip install slither-analyzer`
  - Or: `/plugin install slither@claude-plugins-official` (if available)

### Optional Enhancements
- 📊 **Foundry**: For running tests and fuzzing
  - Install: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- 🔍 **Mythril**: Symbolic execution
  - Install: `pip install mythril`

## Validation Steps

When you run `/validate`, Claude will:

1. **Check plugin installation**
   - Confirm fofum-solidity-audit is loaded
   - Check version matches latest

2. **Check tooling** (if available)
   ```bash
   which slither && slither --version
   which forge && forge --version
   which myth && myth version
   ```

3. **Report status**
   - ✅ Ready items
   - ⚠️ Missing recommended tools
   - 💡 Suggestions for improvement

## Example Output

```
🔍 Fofum Solidity Audit - Setup Validation
==========================================

✅ Plugin: fofum-solidity-audit v0.2.0
✅ Slither: 0.10.0
⚠️ Foundry: Not found (recommended for testing)
⚠️ Mythril: Not found (optional)

Status: Ready for auditing!
Tip: Install Foundry for enhanced testing capabilities.
```

## Why These Tools?

| Tool | Purpose | Impact |
|------|---------|--------|
| Slither | Static analysis | Catches common bugs automatically |
| Foundry | Testing/fuzzing | Verify findings with PoC |
| Mythril | Symbolic execution | Deep path analysis |

The audit skill works without these tools, but they significantly enhance findings quality.
