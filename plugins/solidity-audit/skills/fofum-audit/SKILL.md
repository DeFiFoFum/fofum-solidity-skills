---
name: fofum-solidity-audit
description: |
  Comprehensive Solidity smart contract security audit skill. Activates when auditing,
  reviewing, or assessing EVM smart contracts for vulnerabilities. Covers reentrancy,
  access control, oracle manipulation, flash loans, MEV, weird tokens, and protocol-specific
  risks. Includes 100+ item checklist, severity rubric, and real exploit examples.
---

# Fofum Solidity Audit Skill

## Purpose

Systematically audit Solidity smart contracts for security vulnerabilities using a structured methodology that combines:
- **Static pattern detection** (~40% of bugs)
- **Manual review guidance** (~60% of bugs)
- **Real exploit examples** for pattern recognition

## When to Use

- Auditing smart contracts before deployment
- Reviewing code changes for security implications
- Assessing third-party contracts before integration
- Bug bounty hunting
- Learning smart contract security

## When NOT to Use

- General Solidity development (use a dev-focused skill)
- Non-EVM chains (Move, Solana, etc.)
- Off-chain security (infrastructure, keys)

---

## Audit Methodology

### Phase 1: Reconnaissance (15%)

**Objective:** Understand what you're auditing before looking for bugs.

1. **Scope Definition**
   - [ ] Identify all in-scope contracts
   - [ ] Note external dependencies (OpenZeppelin, etc.)
   - [ ] Identify upgrade patterns (proxy, diamond, etc.)

2. **Architecture Mapping**
   - [ ] Draw contract inheritance graph
   - [ ] Map external calls (who calls who)
   - [ ] Identify entry points (public/external functions)
   - [ ] Note privileged roles (owner, admin, guardian)

3. **Documentation Review**
   - [ ] Read protocol documentation/whitepaper
   - [ ] Understand intended behavior
   - [ ] Note claimed invariants

**Output:** Architecture diagram, entry point list, role map

### Phase 2: Static Analysis (20%)

**Objective:** Catch low-hanging fruit automatically.

1. **Run Slither**
   ```bash
   slither . --print human-summary
   slither . --print contract-summary
   slither .
   ```
   - [ ] Review all HIGH/MEDIUM findings
   - [ ] Triage false positives with evidence
   - [ ] Document true positives

2. **Check Compiler Warnings**
   ```bash
   forge build --force 2>&1 | grep -i warning
   ```

3. **Run Additional Detectors**
   - [ ] `slither-check-erc` for token conformance
   - [ ] `slither-check-upgradeability` for proxies

**Output:** Slither report, triaged findings

### Phase 3: Manual Review (50%)

**Objective:** Find bugs that tools miss.

#### 3.1 Access Control
- [ ] All privileged functions have access control
- [ ] Modifiers are applied consistently
- [ ] No unprotected initializers
- [ ] Role changes require multi-sig or timelock

#### 3.2 Reentrancy
- [ ] State changes before external calls (CEI pattern)
- [ ] ReentrancyGuard on vulnerable functions
- [ ] Read-only reentrancy considered
- [ ] Cross-function reentrancy paths checked

#### 3.3 Input Validation
- [ ] All external inputs validated
- [ ] Array lengths checked
- [ ] Address(0) checks where needed
- [ ] Slippage parameters enforced

#### 3.4 Arithmetic
- [ ] Precision loss in divisions
- [ ] Rounding direction (protocol-favorable)
- [ ] Overflow in Solidity <0.8 or unchecked blocks
- [ ] Casting between types

#### 3.5 Oracle & Price Feeds
- [ ] Stale price checks
- [ ] Freshness thresholds appropriate
- [ ] Flash loan resistance (TWAP vs spot)
- [ ] Fallback oracle behavior

#### 3.6 External Integrations
- [ ] Return values checked
- [ ] Weird token handling (fee-on-transfer, rebasing)
- [ ] Reentrancy from callbacks
- [ ] Protocol assumptions documented

#### 3.7 Economic/Logic
- [ ] Incentive alignment
- [ ] Sandwich/frontrunning vectors
- [ ] Flash loan attack paths
- [ ] Governance manipulation

**See:** `resources/checklist.md` for full 100+ item checklist

### Phase 4: Verification (10%)

**Objective:** Confirm findings with evidence.

1. **Write PoC Tests**
   - Each HIGH/CRITICAL needs a Foundry test
   - Show exact attack path
   - Quantify impact (funds at risk)

2. **Test Edge Cases**
   ```bash
   forge test --match-contract Exploit -vvvv
   ```

3. **Fuzz Critical Functions**
   ```bash
   forge test --match-test testFuzz
   ```

### Phase 5: Reporting (5%)

**Objective:** Communicate findings clearly.

**See:** `resources/report-template.md`

---

## Severity Classification

| Severity | Criteria |
|----------|----------|
| **Critical** | Direct loss of funds, no user action required |
| **High** | Loss of funds with user action, or protocol insolvency |
| **Medium** | Conditional loss, or significant protocol disruption |
| **Low** | Minor issues, best practice violations |
| **Informational** | Gas optimizations, code quality |

**See:** `resources/severity.md` for detailed rubric

---

## Quick Reference: Common Vulnerabilities

### Reentrancy (SWC-107)
```solidity
// VULNERABLE
function withdraw() external {
    uint amount = balances[msg.sender];
    (bool success,) = msg.sender.call{value: amount}("");
    balances[msg.sender] = 0; // State change AFTER external call
}

// FIXED: CEI Pattern
function withdraw() external {
    uint amount = balances[msg.sender];
    balances[msg.sender] = 0; // State change BEFORE
    (bool success,) = msg.sender.call{value: amount}("");
}
```

### Access Control (SWC-105)
```solidity
// VULNERABLE
function setPrice(uint _price) external {
    price = _price; // Anyone can call!
}

// FIXED
function setPrice(uint _price) external onlyOwner {
    price = _price;
}
```

### Oracle Manipulation
```solidity
// VULNERABLE: Spot price
uint price = pair.getReserves().reserve0 / pair.getReserves().reserve1;

// FIXED: TWAP
uint price = oracle.consult(token, 1e18, 30 minutes);
```

**See:** `resources/exploits/` for real-world examples

---

## Protocol-Specific Guides

- **Lending:** `resources/protocols/lending.md`
- **AMMs:** `resources/protocols/amm.md`
- **Staking:** `resources/protocols/staking.md`
- **Governance:** `resources/protocols/governance.md`
- **Bridges:** `resources/protocols/bridges.md`

---

## Exploit Reference Library

Real exploits with root cause analysis:

- **Reentrancy:** `resources/exploits/reentrancy.md` (DAO, Cream, Fei)
- **Oracle:** `resources/exploits/oracle.md` (Harvest, Mango)
- **Flash Loans:** `resources/exploits/flash-loan.md` (Euler, bZx)
- **Access Control:** `resources/exploits/access-control.md` (Parity, Ronin)
- **Logic Bugs:** `resources/exploits/logic-bugs.md` (Nomad, Wormhole)

For full Foundry reproductions (external repos, not bundled with this skill):
- <https://github.com/SunWeb3Sec/DeFiHackLabs>
- <https://github.com/coinspect/learn-evm-attacks>

---

## Rationalizations to Reject

| Rationalization | Why It's Wrong |
|-----------------|----------------|
| "Slither found nothing, must be safe" | Slither misses ~60% of bugs (logic, economic) |
| "It's audited by X firm" | Audits miss bugs; multiple reviews are better |
| "No reentrancy guard but CEI is followed" | Check ALL functions, not just the obvious ones |
| "Only admin can call this" | Admin keys get compromised; assume adversarial |
| "This is standard OpenZeppelin code" | Integration bugs happen at the seams |
| "Low probability, won't happen" | If profitable, attackers WILL find it |

---

## External Resources

- **Trail of Bits:** <https://github.com/crytic/building-secure-contracts>
- **SWC Registry:** <https://swcregistry.io/>
- **Solodit Checklist:** <https://solodit.cyfrin.io/checklist>
- **Weird ERC20:** <https://github.com/d-xo/weird-erc20>
- **DeFiHackLabs:** <https://github.com/SunWeb3Sec/DeFiHackLabs>

---

## Ready to Audit

Provide me with:
1. Contract files or repository URL
2. Scope (which contracts to audit)
3. Any documentation or specs
4. Known issues to exclude

I'll follow this methodology systematically.
