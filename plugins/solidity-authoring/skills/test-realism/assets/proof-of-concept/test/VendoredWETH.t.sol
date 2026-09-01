// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IWETH9} from "../src/IWETH9.sol";

/// @notice Demonstrates the vendored-bytecode tier: no MockWETH.sol, no live
/// RPC fork, just the real mainnet WETH9 runtime bytecode (fetched once by
/// scripts/fetch-vendored-bytecode.sh, see vendored/WETH9.provenance.json)
/// etched into a local test address. Deterministic and network-free at test
/// time, but every assertion below is checking real WETH9 logic, not a
/// hand-rolled reimplementation of it.
contract VendoredWETHTest is Test {
    IWETH9 internal weth;
    address internal alice = makeAddr("alice");

    function setUp() public {
        // Path is relative to the project root running `forge test`, and
        // must be allow-listed in foundry.toml's fs_permissions (see
        // references/vendored-bytecode-setup.md). vm.parseBytes rejects a
        // trailing newline, which is why the fetch script writes one without.
        bytes memory runtimeCode = vm.parseBytes(vm.readFile("vendored/WETH9.runtime.hex"));
        address target = makeAddr("vendoredWETH9");
        vm.etch(target, runtimeCode);
        weth = IWETH9(target);
    }

    function test_depositCreditsCallerBalance() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        weth.deposit{value: 1 ether}();

        assertEq(weth.balanceOf(alice), 1 ether);
        assertEq(weth.totalSupply(), 1 ether);
    }

    function test_withdrawReturnsEtherAndBurns() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        weth.deposit{value: 1 ether}();
        weth.withdraw(0.4 ether);
        vm.stopPrank();

        assertEq(weth.balanceOf(alice), 0.6 ether);
        assertEq(alice.balance, 0.4 ether);
    }

    function test_transferMovesBalance() public {
        address bob = makeAddr("bob");
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        weth.deposit{value: 1 ether}();
        weth.transfer(bob, 0.25 ether);
        vm.stopPrank();

        assertEq(weth.balanceOf(alice), 0.75 ether);
        assertEq(weth.balanceOf(bob), 0.25 ether);
    }
}
