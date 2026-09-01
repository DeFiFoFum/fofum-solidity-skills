// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IWETH9} from "../src/IWETH9.sol";

/// @notice Demonstrates the live-fork tier: no vendored artifact at all,
/// calls go straight through to the real deployed WETH9 on whatever chain
/// state --fork-url points at. This is the closest a test gets to "flying",
/// but it needs a live RPC and its result depends on the exact block forked,
/// which is why it belongs in the weekly job, not gating every PR. Run with:
///   forge test --match-contract ForkWETHTest --fork-url <mainnet-rpc-url>
contract ForkWETHTest is Test {
    IWETH9 internal weth = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    function test_realMainnetTotalSupplyIsNonZero() public view {
        assertGt(weth.totalSupply(), 1_000_000 ether);
    }

    function test_depositAgainstLiveContract() public {
        address alice = makeAddr("alice");
        vm.deal(alice, 1 ether);
        uint256 before = weth.totalSupply();

        vm.prank(alice);
        weth.deposit{value: 1 ether}();

        assertEq(weth.balanceOf(alice), 1 ether);
        assertEq(weth.totalSupply(), before + 1 ether);
    }
}
