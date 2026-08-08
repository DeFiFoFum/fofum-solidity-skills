// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @title ExampleVault
/// @notice Reference implementation demonstrating this author's Solidity
/// style: feature-first function ordering, precise NatSpec, and deploy-time
/// value inference. Intended to sit behind a named proxy (see
/// ExampleVaultProxy.sol) rather than be deployed directly.
contract ExampleVault is Initializable {
    using SafeERC20 for IERC20;

    /// @notice The ERC20 token this vault accepts deposits of.
    IERC20 public asset;

    /// @notice Balance held per depositor, denominated in the asset's
    /// smallest unit (e.g. wei for an 18-decimal token).
    mapping(address depositor => uint256 balance) public balanceOf;

    /// @notice Unix timestamp (seconds) this vault started accepting deposits.
    /// @dev Inferred from block.timestamp at initialize() rather than taken as
    /// a parameter, so it can never be backdated by whoever calls initialize,
    /// and a post-deploy validation script can independently recompute it
    /// from the initialization transaction's block and diff against this value.
    uint256 public depositsOpenedAt;

    event Deposited(address indexed from, address indexed creditedTo, uint256 amount);
    event Withdrawn(address indexed depositor, uint256 amount);

    /// @dev Disables initializers on the implementation contract itself, so it
    /// can only ever be initialized through a proxy's delegatecall, never directly.
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the vault for a given asset. Callable once, by
    /// whoever the proxy's constructor forwards the call to at deploy time.
    /// @param asset_ The ERC20 token this vault will hold. Reverts if the
    /// zero address.
    function initialize(IERC20 asset_) external initializer {
        require(address(asset_) != address(0), "ExampleVault: zero asset");
        asset = asset_;
        depositsOpenedAt = block.timestamp;
    }

    // -------------------------------------------------------------------
    // Feature: deposit
    // Both entrypoints and their shared internal helper stay together here,
    // instead of splitting external/internal into separate visibility blocks.
    // -------------------------------------------------------------------

    /// @notice Deposits `amount` of the vault's asset from the caller into
    /// the caller's own balance.
    /// @param amount Amount to deposit, in the asset's smallest unit.
    /// Reverts if zero, and if the caller has not approved this vault for
    /// at least `amount`.
    function deposit(uint256 amount) external {
        _deposit(msg.sender, msg.sender, amount);
    }

    /// @notice Deposits `amount` of the vault's asset from the caller,
    /// crediting `to` instead of the caller.
    /// @param to Address whose balance is credited. Reverts if the zero
    /// address.
    /// @param amount Amount to deposit, in the asset's smallest unit.
    /// Reverts if zero, and if the caller has not approved this vault for
    /// at least `amount`.
    function depositFor(address to, uint256 amount) external {
        require(to != address(0), "ExampleVault: zero recipient");
        _deposit(msg.sender, to, amount);
    }

    /// @dev Shared by deposit() and depositFor(); kept directly below them
    /// rather than in a separate internal-functions section, since reading
    /// the deposit feature end to end means reading all three together.
    function _deposit(address from, address to, uint256 amount) internal {
        require(amount != 0, "ExampleVault: zero amount");
        asset.safeTransferFrom(from, address(this), amount);
        balanceOf[to] += amount;
        emit Deposited(from, to, amount);
    }

    // -------------------------------------------------------------------
    // Feature: withdraw
    // -------------------------------------------------------------------

    /// @notice Withdraws `amount` of the vault's asset from the caller's
    /// balance back to the caller.
    /// @param amount Amount to withdraw, in the asset's smallest unit.
    /// Reverts if it exceeds the caller's current balance.
    function withdraw(uint256 amount) external {
        _withdraw(msg.sender, amount);
    }

    /// @dev Kept directly below withdraw(), its only caller, so the
    /// withdraw feature's full behavior reads top to bottom in one place.
    function _withdraw(address from, uint256 amount) internal {
        balanceOf[from] -= amount; // reverts on underflow if amount > balance
        asset.safeTransfer(from, amount);
        emit Withdrawn(from, amount);
    }
}
