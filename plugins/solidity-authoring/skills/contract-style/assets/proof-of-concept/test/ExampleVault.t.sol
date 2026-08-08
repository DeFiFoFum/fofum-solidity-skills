// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ExampleVault} from "../src/ExampleVault.sol";
import {ExampleVaultProxy} from "../src/ExampleVaultProxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MOCK") {
        _mint(msg.sender, 1_000_000e18);
    }
}

/// @notice Tests are grouped by feature, mirroring how ExampleVault.sol
/// itself groups deposit and withdraw together, so a reader can verify one
/// feature's behavior without hunting across the file.
contract ExampleVaultTest is Test {
    ExampleVault internal vault;
    MockToken internal token;
    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");

    function setUp() public {
        token = new MockToken();

        ExampleVault implementation = new ExampleVault();
        bytes memory initData = abi.encodeCall(ExampleVault.initialize, (IERC20(address(token))));
        ExampleVaultProxy proxy = new ExampleVaultProxy(address(implementation), admin, initData);
        vault = ExampleVault(address(proxy));

        token.transfer(alice, 1_000e18);
    }

    /// @dev NAME is inlined at compile time, so it's readable directly off
    /// the deployed proxy without cross-referencing an off-chain address book.
    function test_proxyIsIdentifiableByName() public view {
        assertEq(ExampleVaultProxy(payable(address(vault))).NAME(), "ExampleVaultProxy");
    }

    function test_depositsOpenedAtIsInferredNotHardcoded() public view {
        assertEq(vault.depositsOpenedAt(), block.timestamp);
    }

    // -------------------------------------------------------------------
    // Feature: deposit
    // -------------------------------------------------------------------

    function test_deposit_creditsCallersOwnBalance() public {
        vm.startPrank(alice);
        token.approve(address(vault), 100e18);
        vault.deposit(100e18);
        vm.stopPrank();

        assertEq(vault.balanceOf(alice), 100e18);
    }

    function test_depositFor_creditsSpecifiedRecipient() public {
        address bob = makeAddr("bob");

        vm.startPrank(alice);
        token.approve(address(vault), 50e18);
        vault.depositFor(bob, 50e18);
        vm.stopPrank();

        assertEq(vault.balanceOf(bob), 50e18);
        assertEq(vault.balanceOf(alice), 0);
    }

    function test_depositFor_revertsOnZeroRecipient() public {
        vm.prank(alice);
        vm.expectRevert("ExampleVault: zero recipient");
        vault.depositFor(address(0), 1e18);
    }

    // -------------------------------------------------------------------
    // Feature: withdraw
    // -------------------------------------------------------------------

    function test_withdraw_returnsAssetToCaller() public {
        vm.startPrank(alice);
        token.approve(address(vault), 100e18);
        vault.deposit(100e18);
        vault.withdraw(40e18);
        vm.stopPrank();

        assertEq(vault.balanceOf(alice), 60e18);
        assertEq(token.balanceOf(alice), 1_000e18 - 60e18);
    }

    function test_withdraw_revertsIfAmountExceedsBalance() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.withdraw(1e18);
    }
}
