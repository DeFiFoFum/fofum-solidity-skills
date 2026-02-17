# External References

## Included as Submodules

These are cloned into `submodules/` for offline access:

### DeFiHackLabs (SunWeb3Sec)
- **Path:** `submodules/DeFiHackLabs/`
- **Content:** 100+ Foundry reproductions of real DeFi exploits
- **Use:** Study actual exploit code, understand attack mechanics
- **GitHub:** https://github.com/SunWeb3Sec/DeFiHackLabs

### learn-evm-attacks (Coinspect)
- **Path:** `submodules/learn-evm-attacks/`
- **Content:** 40+ categorized exploits with detailed READMEs and diagrams
- **Use:** Learn attack patterns with visual explanations
- **GitHub:** https://github.com/coinspect/learn-evm-attacks

### Building Secure Contracts (Trail of Bits)
- **Path:** `submodules/building-secure-contracts/`
- **Content:** Comprehensive security guidelines, Slither detectors, testing guides
- **Use:** Best practices, development guidelines, tool documentation
- **GitHub:** https://github.com/crytic/building-secure-contracts

---

## External Resources (Links)

### Vulnerability Registries

#### SWC Registry (Smart Contract Weakness Classification)
- **URL:** https://swcregistry.io/
- **Use:** Standard vulnerability IDs (SWC-XXX) for findings
- **Coverage:** 37 weakness types with examples and remediation

#### Solodit Checklist (Cyfrin)
- **URL:** https://solodit.cyfrin.io/checklist
- **Use:** Actionable audit checklist with toggle tracking
- **Coverage:** Protocol-specific and general security checks

### Learning Roadmaps

#### SlowMist Smart Contract Auditor Roadmap
- **URL:** https://github.com/slowmist/SlowMist-Learning-Roadmap-for-Becoming-a-Smart-Contract-Auditor
- **Use:** Complete skill tree for auditor development
- **Coverage:** Tools, techniques, knowledge areas, practice resources

### Audit Report Databases

#### Solodit
- **URL:** https://solodit.xyz/
- **Use:** Search aggregated findings from all major audit firms
- **Coverage:** Trail of Bits, OpenZeppelin, Consensys, Spearbit, etc.

#### Code4rena Reports
- **URL:** https://code4rena.com/reports
- **Use:** Contest findings with severity and code references
- **Coverage:** Hundreds of protocols, thousands of findings

#### Sherlock Audits
- **URL:** https://audits.sherlock.xyz/
- **Use:** Protocol audits with fix verification
- **Coverage:** DeFi protocols with contest model

### Exploit Trackers

#### Rekt News
- **URL:** https://rekt.news/
- **Use:** Detailed post-mortems of major hacks
- **Coverage:** All significant DeFi exploits since 2020

#### DefiLlama Hacks
- **URL:** https://defillama.com/hacks
- **Use:** Categorized hack database with amounts
- **Coverage:** Sortable by type, chain, amount

### Token Edge Cases

#### weird-erc20 (d-xo)
- **URL:** https://github.com/d-xo/weird-erc20
- **Use:** Non-standard ERC20 implementations
- **Coverage:** Fee-on-transfer, rebasing, blocklists, etc.

---

## Quick Reference Commands

```bash
# Update all submodules
git submodule update --remote --merge

# Search DeFiHackLabs for an exploit
grep -r "Euler" submodules/DeFiHackLabs/

# Find reentrancy examples
find submodules/ -name "*.sol" | xargs grep -l "reentrancy\|ReentrancyGuard"
```
