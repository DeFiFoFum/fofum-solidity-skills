---
version: 1.1.0
updated: 2025-12-05
created: 2025-12-05
description: Foundry/Forge testing best practices for VaultEdge protocol
forge_version: ">=0.2.0"
solc_production: "0.8.19"
solc_testing: "0.8.26"
foundry_config: packages/hardhat/foundry.toml
changelog: 
  - v1.1.0: Added testing philosophy, Given-When-Then pattern, performance targets, version tracking
  - v1.0.0: Initial creation with manager-based testing patterns
---

# Forge Testing Best Practices

> ⚠️ **DEVELOPER NOTE: Solidity Version Split**
> - **Production contracts**: `pragma solidity ^0.8.19;`
> - **Test contracts**: Compiled with `solc 0.8.26` (set in `foundry.toml`)
> 
> Tests require 0.8.26 due to stack-too-deep errors with 0.8.19 when running fuzz tests.
> The `foundry.toml` sets `solc = '0.8.26'` and `auto_detect_solc = false`.

## Testing Philosophy

> **"Testing code is as important as production code."**

A well-designed test suite is **paramount to confidence and iteration speed**. It must be:

| Property | Target | Why |
|----------|--------|-----|
| **Fast** | <2 min (target), <10 min (max) | Enables rapid iteration, doesn't block CI/CD |
| **Reliable** | Zero flaky tests | Flaky tests erode trust and slow development |
| **Maintainable** | Easy to read, change, extend | Codebase evolves; tests must evolve with it |
| **High Coverage** | >90% line coverage | Confidence in refactoring and changes |
| **CI/CD Ready** | Deterministic, isolated | Must run reliably in any environment |

**The goal**: Every developer should be able to make changes confidently, knowing the test suite will catch regressions quickly.

---

## Core Principles

### 1. Fixtures Abstract Complexity

Use **fixture classes** to hide infrastructure complexity. Tests should focus on **business logic**, not setup boilerplate:

```solidity
// ✅ Good: Use managers
address alice = protocolFixture.accountsManager().getAlice();
address weth = protocolFixture.collateralManager().getTokenAddress("WETH");
protocolFixture.openVesselWithICR(alice, weth, 200e16, 1000e18);

// ❌ Bad: Manual setup
address alice = makeAddr("alice");
vm.deal(alice, 100 ether);
MockERC20 weth = new MockERC20("WETH", "WETH", 18);
// ... 20 more lines of setup
```

### 2. Given-When-Then Pattern

Each test should follow the **Given-When-Then** structure for human readability:

```solidity
/// @notice Test that adding collateral increases vessel collateral
/// GIVEN: Alice has an active vessel with 5 ETH collateral
/// WHEN: Alice adds 1 ETH collateral
/// THEN: Vessel collateral increases to 6 ETH
function test_AdjustVessel_ShouldAddCollateral() public {
    // GIVEN: Alice has an active vessel
    _openVesselForUser(alice, 5e18, STANDARD_DEBT);
    uint256 collBefore = vesselManager.getVesselColl(weth, alice);
    
    // WHEN: Alice adds 1 ETH collateral
    vm.prank(alice);
    borrowerOperations.addColl(weth, 1e18, address(0), address(0));
    
    // THEN: Vessel collateral increases by 1 ETH
    uint256 collAfter = vesselManager.getVesselColl(weth, alice);
    assertEq(collAfter, collBefore + 1e18, "Collateral should increase by 1 ETH");
}
```

### 3. Single Responsibility Per Test

Each test verifies **ONE behavior**. This makes tests:
- Easy to understand at a glance
- Easy to debug when they fail
- Easy to maintain as code evolves

```solidity
// ✅ Good: Single responsibility, easy to validate
function test_OpenVessel_ShouldCreateActiveVessel() public { /* one thing */ }
function test_OpenVessel_ShouldLockCollateral() public { /* one thing */ }
function test_OpenVessel_ShouldMintDebtTokens() public { /* one thing */ }
function test_OpenVessel_ShouldRevert_WhenCollateralIsZero() public { /* one thing */ }

// ❌ Bad: Testing multiple things - hard to debug, hard to maintain
function test_VesselOperations() public {
    // Opens vessel, adjusts, closes, checks TCR, checks recovery mode...
    // 100 lines of mixed concerns - which assertion failed?
}
```

### 4. Reusable Components

Build a **library of reusable helpers** that tests compose together:

```solidity
// Base test class with common setup
abstract contract VaultEdgeTestBase is Test {
    ProtocolFixture public fixture;
    address public alice;
    address public bob;
    
    function setUp() public virtual {
        fixture = new ProtocolFixture();
        fixture.setupStandardTestingEnvironment();
        alice = fixture.accountsManager().getAlice();
        bob = fixture.accountsManager().getBob();
    }
    
    // Reusable building blocks
    function _openVesselForUser(address user, uint256 coll, uint256 debt) internal { ... }
    function _repayDebtForUser(address user, uint256 amount) internal { ... }
    function _dropPriceTo(uint256 newPrice) internal { ... }
}

// Feature-specific tests inherit and compose
contract BorrowerOperationsTest is VaultEdgeTestBase {
    function test_OpenVessel_ShouldWork() public {
        _openVesselForUser(alice, 5e18, 3000e18);  // Reuse helper
        assertEq(vesselManager.getVesselStatus(weth, alice), 1);
    }
}

contract LiquidationTest is VaultEdgeTestBase {
    function test_Liquidation_ShouldWork() public {
        _openVesselForUser(alice, 5e18, 3000e18);  // Same helper!
        _dropPriceTo(500e8);                        // Compose helpers
        // ... test liquidation
    }
}
```

### 5. Descriptive Test Names

Follow pattern: `test_<Function>_Should<Behavior>[_When<Condition>]`

```solidity
// ✅ Good names - self-documenting, easy to find failures
function test_OpenVessel_ShouldCreateActiveVessel() public {}
function test_OpenVessel_ShouldRevert_WhenCollateralIsZero() public {}
function test_AdjustVessel_ShouldIncreaseDebt_WhenICRAboveMCR() public {}
function test_CloseVessel_ShouldReturnCollateral_WhenDebtFullyRepaid() public {}

// ❌ Bad names - meaningless, hard to debug
function testOpen() public {}
function test1() public {}
function testVesselStuff() public {}
```

### 4. Explicit Assertions

Always assert on actual state changes, not just "it didn't revert":

```solidity
// ✅ Good: Verify actual state
function test_CloseVessel_ShouldReturnCollateral() public {
    _openVesselForUser(alice, 5e18, 3000e18);
    
    uint256 wethBefore = weth.balanceOf(alice);
    
    vm.prank(alice);
    borrowerOperations.closeVessel(wethAddress);
    
    uint256 wethAfter = weth.balanceOf(alice);
    assertEq(wethAfter, wethBefore + 5e18, "Should return full collateral");
    assertEq(vesselManager.getVesselStatus(wethAddress, alice), 0, "Vessel should be closed");
}

// ❌ Bad: Only checking it didn't revert
function test_CloseVessel() public {
    _openVesselForUser(alice, 5e18, 3000e18);
    vm.prank(alice);
    borrowerOperations.closeVessel(wethAddress);
    // No assertions!
}
```

## Test Structure

### Standard Setup Pattern

```solidity
contract MyFeatureTest is Test {
    ProtocolFixture public protocolFixture;
    
    // Named accounts
    address public alice;
    address public bob;
    
    // Contracts under test
    IBorrowerOperations public borrowerOperations;
    IVesselManager public vesselManager;
    
    // Test collateral
    address public wethAddress;
    MockERC20Token public wethToken;
    
    // Constants
    uint256 public constant WETH_PRICE = 2000e8;
    uint256 public constant STANDARD_COLLATERAL = 5e18;
    uint256 public constant STANDARD_DEBT = 3000e18;

    function setUp() public {
        // Deploy protocol
        protocolFixture = new ProtocolFixture();
        protocolFixture.setupStandardTestingEnvironment();
        
        // Get accounts
        alice = protocolFixture.accountsManager().getAlice();
        bob = protocolFixture.accountsManager().getBob();
        
        // Get contracts
        borrowerOperations = IBorrowerOperations(address(protocolFixture.borrowerOperations()));
        vesselManager = IVesselManager(address(protocolFixture.vesselManager()));
        
        // Get collateral
        wethAddress = protocolFixture.collateralManager().getTokenAddress("WETH");
        wethToken = MockERC20Token(wethAddress);
        
        // Setup approvals
        protocolFixture.setupAllUserApprovals();
    }
}
```

### Helper Functions

Keep helpers minimal and reusable:

```solidity
/// @dev Opens a vessel for a user with standard parameters
function _openVesselForUser(address user, uint256 collateral, uint256 debt) internal {
    vm.startPrank(user);
    
    // Ensure user has tokens
    uint256 balance = wethToken.balanceOf(user);
    if (balance < collateral) {
        protocolFixture.collateralManager().mintTokens("WETH", user, collateral);
    }
    
    wethToken.approve(address(borrowerOperations), collateral);
    borrowerOperations.openVessel(wethAddress, collateral, debt, address(0), address(0));
    
    // Verify it worked
    assertEq(vesselManager.getVesselStatus(wethAddress, user), 1, "Vessel should be active");
    
    vm.stopPrank();
}
```

## Testing Patterns

### Testing Reverts

```solidity
// With custom error
function test_ShouldRevert_WithCustomError() public {
    vm.expectRevert(VesselOperator__ZeroAddress.selector);
    borrowerOperations.adjustVesselFor(address(0), wethAddress, 1e18, 0, address(0), address(0));
}

// With error message
function test_ShouldRevert_WithMessage() public {
    vm.expectRevert("BorrowerOps: Vessel does not exist or is closed");
    borrowerOperations.closeVessel(wethAddress);
}

// Any revert (less preferred - use specific errors when possible)
function test_ShouldRevert_AnyError() public {
    vm.expectRevert();
    borrowerOperations.openVessel(wethAddress, 0, 0, address(0), address(0));
}
```

### Testing Events

```solidity
function test_ShouldEmitEvent() public {
    _openVesselForUser(alice, STANDARD_COLLATERAL, STANDARD_DEBT);
    
    vm.expectEmit(true, true, true, true);
    emit VesselAdjustedFor(wethAddress, alice, bob, 1e18, 0);
    
    vm.prank(bob);
    borrowerOperations.adjustVesselFor(alice, wethAddress, 1e18, 0, address(0), address(0));
}
```

### Testing with Price Changes

```solidity
function test_LiquidationScenario() public {
    _openVesselForUser(alice, STANDARD_COLLATERAL, STANDARD_DEBT);
    
    // Drop price to make vessel liquidatable
    uint256 crashPrice = WETH_PRICE / 3;
    protocolFixture.collateralManager().updatePrice("WETH", crashPrice);
    
    // Verify ICR dropped
    uint256 newICR = vesselManager.getCurrentICR(wethAddress, alice, crashPrice);
    assertLt(newICR, 110e16, "ICR should be below MCR");
    
    // Reset price for other tests
    protocolFixture.collateralManager().updatePrice("WETH", WETH_PRICE);
}
```

### Testing Time-Dependent Logic

```solidity
function test_FeeDecay() public {
    _openVesselForUser(alice, STANDARD_COLLATERAL, STANDARD_DEBT);
    
    // Fast forward 30 days
    vm.warp(block.timestamp + 30 days);
    
    // Check fee has decayed
    uint256 refund = feeCollector.simulateRefund(alice, wethAddress, 1 ether);
    assertGt(refund, 0, "Should have refund after time passes");
}
```

## Anti-Patterns to Avoid

### ❌ Never Use try-catch to Swallow Failures

```solidity
// ❌ WRONG: Hides failures
function test_SomethingBad() public {
    try borrowerOperations.openVessel(...) {
        // success
    } catch {
        // silently ignore failure - TEST ALWAYS PASSES!
    }
}

// ✅ CORRECT: Let it fail or use expectRevert
function test_SomethingGood() public {
    borrowerOperations.openVessel(...); // Will fail test if reverts
}
```

### ❌ Never Test Implementation Details

```solidity
// ❌ WRONG: Testing internal storage layout
function test_InternalSlot() public {
    bytes32 slot = vm.load(address(contract), bytes32(uint256(5)));
    assertEq(slot, expectedValue);
}

// ✅ CORRECT: Test through public interface
function test_PublicBehavior() public {
    uint256 value = contract.getValue();
    assertEq(value, expectedValue);
}
```

### ❌ Never Hardcode Addresses

```solidity
// ❌ WRONG
address alice = 0x1234...;

// ✅ CORRECT
address alice = protocolFixture.accountsManager().getAlice();
```

## Console Logging (Debug Only)

Use `console.log` for debugging, but keep production tests clean:

```solidity
import "forge-std/console.sol";

function test_Debug() public {
    console.log("=== Debug Info ===");
    console.log("Alice balance:", wethToken.balanceOf(alice));
    console.log("Vessel ICR:", vesselManager.getCurrentICR(wethAddress, alice, price));
}
```

## Gas Tracking

```solidity
function test_GasUsage() public {
    uint256 gasBefore = gasleft();
    
    borrowerOperations.openVessel(...);
    
    uint256 gasUsed = gasBefore - gasleft();
    console.log("Gas used:", gasUsed);
    
    // Optional: assert gas is reasonable
    assertLt(gasUsed, 500_000, "Should use less than 500k gas");
}
```

## File Organization

```
test/forge/
├── fixtures/
│   ├── AccountsManager.sol      # Account management
│   ├── CollateralManager.sol    # Collateral/oracle setup
│   └── ProtocolFixture.sol      # Full protocol deployment
├── BorrowerOperations.t.sol     # BorrowerOps tests
├── VesselOperator.t.sol         # VaultEdge extension tests
├── VesselManager.t.sol          # VesselManager tests
└── StabilityPool.t.sol          # StabilityPool tests
```

## Running Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/forge/VesselOperator.t.sol

# Run specific test
forge test --match-test test_AdjustVesselFor_ShouldAddCollateral

# With verbosity
forge test -vvv

# With gas report
forge test --gas-report

# CI profile (more fuzz runs)
forge test --profile ci
```

---

## Performance & CI/CD

### Performance Targets

| Metric | Target | Maximum | Notes |
|--------|--------|---------|-------|
| Full suite | <2 min | <10 min | Enables rapid iteration |
| Single test | <5 sec | <30 sec | Fast feedback loop |
| Fuzz runs (dev) | 256 | - | Quick local validation |
| Fuzz runs (CI) | 1000 | - | Thorough CI coverage |

### Writing Performant Tests

```solidity
// ✅ Good: Reuse fixtures across tests (setUp runs once per test)
function setUp() public {
    fixture = new ProtocolFixture();  // Heavy setup once
    fixture.setupStandardTestingEnvironment();
}

// ✅ Good: Minimal setup per test
function test_FastTest() public {
    _openVesselForUser(alice, 5e18, 3000e18);  // Only what's needed
    // ... test one thing
}

// ❌ Bad: Recreating fixtures in each test
function test_SlowTest() public {
    ProtocolFixture newFixture = new ProtocolFixture();  // Slow!
    newFixture.setupStandardTestingEnvironment();        // Redundant!
    // ...
}
```

### Avoiding Flaky Tests

```solidity
// ✅ Good: Deterministic - same result every time
function test_Deterministic() public {
    uint256 price = 2000e8;  // Fixed price
    protocolFixture.collateralManager().updatePrice("WETH", price);
    // ... predictable assertions
}

// ❌ Bad: Non-deterministic - depends on external state
function test_Flaky() public {
    uint256 price = oracle.getPrice();  // Could change!
    // ... assertions may randomly fail
}

// ✅ Good: Isolated - doesn't depend on test order
function test_Isolated() public {
    // Each test starts fresh from setUp()
    assertEq(vesselManager.getVesselOwnersCount(weth), 0);  // Always 0
}

// ❌ Bad: Depends on other tests running first
function test_DependsOnOther() public {
    // Assumes test_CreateVessel ran first - FLAKY!
    assertEq(vesselManager.getVesselOwnersCount(weth), 1);
}
```

### CI/CD Configuration

The `foundry.toml` defines CI-specific settings:

```toml
# CI configuration (from foundry.toml)
[profile.ci]
fuzz = { runs = 1000 }
invariant = { runs = 1000 }
```

**CI Best Practices:**
- Use `forge test --profile ci` in pipelines
- Cache `lib/` directory between runs
- Run `forge build` before `forge test` for better caching
- Set `fail_on_revert = true` for invariant tests (catches unexpected reverts)

### Maintaining the Test Suite

As the codebase evolves, tests must evolve too:

1. **When adding features**: Add tests FIRST (TDD)
2. **When fixing bugs**: Add regression test that reproduces the bug
3. **When refactoring**: Tests should NOT change (they verify behavior, not implementation)
4. **When tests break**: Fix the test OR the code; never delete tests without replacement

> **Rule**: If you can't explain why a test exists, don't delete it. Investigate first.
