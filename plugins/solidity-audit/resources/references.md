# External References

## Exploit Reproduction Repositories

### DeFiHackLabs (SunWeb3Sec)
- **URL:** https://github.com/SunWeb3Sec/DeFiHackLabs
- **Stars:** 6.4k+
- **Content:** 300+ Foundry reproductions of real DeFi exploits
- **Use:** Study actual exploit code, understand attack mechanics
- **Clone:** `git clone https://github.com/SunWeb3Sec/DeFiHackLabs.git`

### learn-evm-attacks (Coinspect)
- **URL:** https://github.com/coinspect/learn-evm-attacks
- **Stars:** 1.8k+
- **Content:** 40+ categorized exploits with detailed READMEs and diagrams
- **Use:** Learn attack patterns with visual explanations
- **Clone:** `git clone https://github.com/coinspect/learn-evm-attacks.git`

### Building Secure Contracts (Trail of Bits)
- **URL:** https://github.com/crytic/building-secure-contracts
- **Stars:** 2.4k+
- **Content:** Comprehensive security guidelines, Slither detectors, testing guides
- **Use:** Best practices, development guidelines, tool documentation
- **Clone:** `git clone https://github.com/crytic/building-secure-contracts.git`

---

## Vulnerability Registries

### SWC Registry (Smart Contract Weakness Classification)
- **URL:** https://swcregistry.io/
- **Use:** Standard vulnerability IDs (SWC-XXX) for findings
- **Coverage:** 37 weakness types with examples and remediation

### Solodit Checklist (Cyfrin)
- **URL:** https://solodit.cyfrin.io/checklist
- **Use:** Actionable audit checklist with toggle tracking
- **Coverage:** Protocol-specific and general security checks

---

## Learning Roadmaps

### SlowMist Smart Contract Auditor Roadmap
- **URL:** https://github.com/slowmist/SlowMist-Learning-Roadmap-for-Becoming-a-Smart-Contract-Auditor
- **Use:** Complete skill tree for auditor development
- **Coverage:** Tools, techniques, knowledge areas, practice resources

---

## Audit Report Databases

### Solodit
- **URL:** https://solodit.xyz/
- **Use:** Search aggregated findings from all major audit firms
- **Coverage:** Trail of Bits, OpenZeppelin, Consensys, Spearbit, etc.

### Code4rena Reports
- **URL:** https://code4rena.com/reports
- **Use:** Contest findings with severity and code references
- **Coverage:** Hundreds of protocols, thousands of findings

### Sherlock Audits
- **URL:** https://audits.sherlock.xyz/
- **Use:** Protocol audits with fix verification
- **Coverage:** DeFi protocols with contest model

---

## Exploit Trackers

### Rekt News
- **URL:** https://rekt.news/
- **Use:** Detailed post-mortems of major hacks
- **Coverage:** All significant DeFi exploits since 2020

### DefiLlama Hacks
- **URL:** https://defillama.com/hacks
- **Use:** Categorized hack database with amounts
- **Coverage:** Sortable by type, chain, amount

---

## Token Edge Cases

### weird-erc20 (d-xo)
- **URL:** https://github.com/d-xo/weird-erc20
- **Use:** Non-standard ERC20 implementations
- **Coverage:** Fee-on-transfer, rebasing, blocklists, etc.

---

## Tools

### Static Analysis
- **Slither:** `pip install slither-analyzer`
- **Mythril:** `pip install mythril`
- **Aderyn:** `cargo install aderyn`

### Testing & Fuzzing
- **Foundry:** `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **Echidna:** `pip install echidna`

### Visualization
- **sol2uml:** `npm install -g sol2uml`
- **Surya:** `npm install -g surya`
