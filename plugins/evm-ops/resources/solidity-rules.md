---
version: 1.0.0
updated: 2025-06-23
created: 2025-06-23
description: Solidity rules and style guide
changelog: -
---

# Solidity Cursor Rules

/*
███████╗ ██████╗ ██╗     ██╗██████╗ ██╗████████╗██╗   ██╗
██╔════╝██╔═══██╗██║     ██║██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝
███████╗██║   ██║██║     ██║██║  ██║██║   ██║    ╚████╔╝
╚════██║██║   ██║██║     ██║██║  ██║██║   ██║     ╚██╔╝  
███████║╚██████╔╝███████╗██║██████╔╝██║   ██║      ██║
╚══════╝ ╚═════╝ ╚══════╝╚═╝╚═════╝ ╚═╝   ╚═╝      ╚═╝
*/

## Table of Contents

- [Solidity Cursor Rules](#solidity-cursor-rules)
  - [Table of Contents](#table-of-contents)
    - [Upgradeable Contract Pattern (Preferred)](#upgradeable-contract-pattern-preferred)
    - [Documentation Standards](#documentation-standards)
    - [Security Considerations](#security-considerations)
    - [Code Style](#code-style)
  - [Contract Organization and Style Guide](#contract-organization-and-style-guide)

### Upgradeable Contract Pattern (Preferred)

- Always use `_disableInitializers()` in constructor
- Provide `initialize()` function with `initializer` modifier
- Include storage gap: `uint256[50] private __gap;`
- Use upgradeable OpenZeppelin imports
- This allows optional upgrades later or permanent immutability

### Documentation Standards

- Use natspec (at least) for all `external`/`public` functions
- Include `@inheritdoc` for interface implementations
- Document security considerations in contract header
- Explain key features and use cases
- Document access control patterns and fund recovery scenarios

### Security Considerations

- Always consider how reentrancy attacks can play out and order the operations so reentrancy attacks are a net loss for attackers. 
  - (`Check-Effects-Interactions` actually doesn't always work, sometimes calling an external contract first provides better reentrancy protection)
- When working with ERC-20 tokens, always consider how non-standard tokens would react to your implementation. If standard ERC-20 tokens are expected, state that and add protections for reflect tokens and/or whitelists.
- Consider fund recovery scenarios in design
- Document address-based isolation models
- Explain access control patterns clearly
- Note any admin functions and their limitations
- Put events and errors in interfaces for better organization

### Code Style

- Use clear variable names, DO NOT use abbreviations
- Comment complex logic thoroughly
- Comment unexpected logic with `// @dev` tags
- Use meaningful error messages
- Prefer role-based function segregation over Solidity style guide ordering

## Contract Organization and Style Guide

All contracts should follow this organization pattern with clear header sections:

```solidity
// SPDX-License-Identifier: GPL-3.0-later
pragma solidity 0.8.x;

/// @title ITradingPlatform
/// @notice Interface for the trading platform contract
/// @dev Defines all events, errors, and external function signatures
interface ITradingPlatform {
    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------
    
    event Deposited(address indexed user, uint256 amount);
    event ReferralBonus(address indexed referrer, uint256 bonus);
    event OrderCreated(bytes32 indexed orderId, address indexed trader, uint256 amount, uint256 price);
    event OrderCancelled(bytes32 indexed orderId);
    event Withdrawn(address indexed user, uint256 amount);
    
    /// -----------------------------------------------------------------------
    /// Errors
    /// -----------------------------------------------------------------------
    
    error InsufficientBalance(address user, uint256 requested, uint256 available);
    error InvalidAmount();
    error InvalidPrice();
    error UnauthorizedAccess();
    error TransferFailed();
    
    /// -----------------------------------------------------------------------
    /// Function Signatures
    /// -----------------------------------------------------------------------
    
    function deposit() external payable;
    function depositWithReferral(address referrer) external payable;
    function createOrder(uint256 amount, uint256 price) external;
    function cancelOrder(bytes32 orderId) external;
    function withdraw(uint256 amount) external;
    function getUserBalance(address user) external view returns (uint256);
    function getOrder(bytes32 orderId) external view returns (Order memory);
}
// SPDX-License-Identifier: GPL-3.0-later
pragma solidity 0.8.19;
```

```solidity
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

/// @title TradingPlatformAccess
/// @notice Manages access control for the trading platform
/// @dev Centralizes all role-based access control functionality
abstract contract TradingPlatformAccess is AccessControlEnumerableUpgradeable {
    /// -----------------------------------------------------------------------
    /// Roles
    /// -----------------------------------------------------------------------
    
    bytes32 public constant TRADER_MANAGER_ROLE = keccak256("TRADER_MANAGER_ROLE");
    bytes32 public constant RISK_OPERATOR_ROLE = keccak256("RISK_OPERATOR_ROLE");
    
    /// -----------------------------------------------------------------------
    /// State Variables
    /// -----------------------------------------------------------------------

    uint256 public maxOrderSize;
    bool public isPaused;
    
    /// @dev Gap for future storage variables
    uint256[49] private __gap;
    
    /// -----------------------------------------------------------------------
    /// Events
    /// -----------------------------------------------------------------------
    
    event MaxOrderSizeUpdated(uint256 newSize);
    event PlatformPaused(bool isPaused);
    
    /// -----------------------------------------------------------------------
    /// Admin Functions
    /// -----------------------------------------------------------------------
    
    /// @notice Sets the maximum allowed order size
    /// @param _maxOrderSize New maximum order size
    function setMaxOrderSize(uint256 _maxOrderSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxOrderSize = _maxOrderSize;
        emit MaxOrderSizeUpdated(_maxOrderSize);
    }
    
    /// @notice Pauses or unpauses the platform
    /// @param _paused New pause state
    function setPaused(bool _paused) external onlyRole(TRADER_MANAGER_ROLE) {
        isPaused = _paused;
        emit PlatformPaused(_paused);
    }
}
```

```solidity
// SPDX-License-Identifier: GPL-3.0-later
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ITradingPlatform.sol";
import "./TradingPlatformAccess.sol";

/// @title TradingPlatform
/// @notice Implements a basic trading platform with deposits, withdrawals, and order management
/// @dev Implements checks-effects-interactions pattern and role-based access control
contract TradingPlatform is ITradingPlatform, Initializable, TradingPlatformAccess {
    /// -----------------------------------------------------------------------
    /// State Variables
    /// -----------------------------------------------------------------------
    
    mapping(address => uint256) public userBalances;
    mapping(bytes32 => Order) public orders;
    
    /// @dev Gap for future storage variables
    uint256[50] private __gap;

    /// -----------------------------------------------------------------------
    /// Constructor
    /// -----------------------------------------------------------------------
    
    constructor() {
        _disableInitializers();
    }

    /// -----------------------------------------------------------------------
    /// Initialization
    /// -----------------------------------------------------------------------
    
    /// @notice Initializes the contract with an admin
    /// @param admin Address of the initial admin
    function initialize(address admin) external initializer {
        __AccessControlEnumerable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// -----------------------------------------------------------------------
    /// View Functions
    /// -----------------------------------------------------------------------
    
    /// @notice Gets the balance of a user
    /// @param user Address to check
    /// @return Balance of the user
    function getUserBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    /// @notice Gets order details
    /// @param orderId ID of the order to fetch
    /// @return Order struct containing order details
    function getOrder(bytes32 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    /// -----------------------------------------------------------------------
    /// Deposit Actions
    /// -----------------------------------------------------------------------
    
    /// @notice Allows users to deposit ETH
    function deposit() external payable {
        _processDeposit(msg.sender, msg.value);
    }

    /// @notice Deposits ETH with a referral bonus
    /// @param referrer Address of the referrer
    function depositWithReferral(address referrer) external payable {
        _processDeposit(msg.sender, msg.value);
        _handleReferralBonus(referrer, msg.value);
    }

    /// @notice Processes the actual deposit
    /// @param user User depositing
    /// @param amount Amount being deposited
    function _processDeposit(address user, uint256 amount) internal {
        if (amount == 0) revert InvalidAmount();
        userBalances[user] += amount;
        emit Deposited(user, amount);
    }

    /// @notice Handles referral bonus calculation and distribution
    /// @param referrer Address to receive the bonus
    /// @param amount Base amount for bonus calculation
    function _handleReferralBonus(address referrer, uint256 amount) internal {
        uint256 bonus = (amount * 5) / 100;
        userBalances[referrer] += bonus;
        emit ReferralBonus(referrer, bonus);
    }

    /// -----------------------------------------------------------------------
    /// Trading Actions
    /// -----------------------------------------------------------------------
    
    /// @notice Creates a new trading order
    /// @param amount Amount to trade
    /// @param price Price for the trade
    function createOrder(uint256 amount, uint256 price) external {
        _validateOrder(amount, price);
        _createOrder(msg.sender, amount, price);
    }

    /// @notice Validates order parameters
    /// @param amount Order amount
    /// @param price Order price
    function _validateOrder(uint256 amount, uint256 price) internal view {
        if (amount == 0) revert InvalidAmount();
        if (price == 0) revert InvalidPrice();
        if (userBalances[msg.sender] < amount) {
            revert InsufficientBalance(
                msg.sender,
                amount,
                userBalances[msg.sender]
            );
        }
    }

    /// @notice Creates the order after validation
    /// @param trader Address creating the order
    /// @param amount Order amount
    /// @param price Order price
    function _createOrder(address trader, uint256 amount, uint256 price) internal {
        bytes32 orderId = keccak256(
            abi.encodePacked(trader, amount, price, block.timestamp)
        );
        
        userBalances[trader] -= amount;
        orders[orderId] = Order({
            trader: trader,
            amount: amount,
            price: price,
            timestamp: block.timestamp
        });
        
        emit OrderCreated(orderId, trader, amount, price);
    }

    /// @notice Cancels an existing order
    /// @param orderId ID of the order to cancel
    function cancelOrder(bytes32 orderId) external {
        _validateOrderOwnership(orderId);
        _cancelOrder(orderId);
    }

    /// @notice Validates order ownership
    /// @param orderId ID of the order
    function _validateOrderOwnership(bytes32 orderId) internal view {
        if (orders[orderId].trader != msg.sender) revert UnauthorizedAccess();
    }

    /// @notice Processes order cancellation
    /// @param orderId ID of the order to cancel
    function _cancelOrder(bytes32 orderId) internal {
        Order memory order = orders[orderId];
        delete orders[orderId];
        userBalances[order.trader] += order.amount;
        
        emit OrderCancelled(orderId);
    }

    /// -----------------------------------------------------------------------
    /// Withdrawal Actions
    /// -----------------------------------------------------------------------
    
    /// @notice Withdraws funds from the platform
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) external {
        _validateWithdrawal(msg.sender, amount);
        _processWithdrawal(msg.sender, amount);
    }

    /// @notice Validates withdrawal parameters
    /// @param user Address attempting withdrawal
    /// @param amount Amount to withdraw
    function _validateWithdrawal(address user, uint256 amount) internal view {
        if (amount == 0) revert InvalidAmount();
        if (userBalances[user] < amount) {
            revert InsufficientBalance(user, amount, userBalances[user]);
        }
    }

    /// @notice Processes the withdrawal
    /// @param user Address to receive funds
    /// @param amount Amount to withdraw
    function _processWithdrawal(address user, uint256 amount) internal {
        userBalances[user] -= amount;
        
        (bool success, ) = user.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdrawn(user, amount);
    }

    /// -----------------------------------------------------------------------
    /// Receive/Fallback Functions
    /// -----------------------------------------------------------------------
    
    /// @notice Handles direct ETH transfers
    receive() external payable {
        _processDeposit(msg.sender, msg.value);
    }
    
    /// @notice Fallback function
    fallback() external payable {}
}
```
