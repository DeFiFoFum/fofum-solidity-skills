// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

/// @notice Demonstrates why a struct used as a dynamic array's element type
/// cannot be grown the way a mapping's value type can (see
/// references/storage-layout-slots.md). ParamsV1 and ParamsV2 model "the
/// same array, one field added" across an upgrade.
struct ParamsV1 {
    uint256 a;
    uint256 b;
}

contract ArrayV1 {
    ParamsV1[] public items;

    function push(uint256 a, uint256 b) external {
        items.push(ParamsV1(a, b));
    }
}

struct ParamsV2 {
    uint256 a;
    uint256 b;
    uint256 c; // added field: 2 slots per element -> 3 slots per element
}

contract ArrayV2 {
    ParamsV2[] public items;
}

contract ArrayElementCorruptionTest is Test {
    function test_growingArrayElementStructCorruptsExistingData() public {
        ArrayV1 v1 = new ArrayV1();
        v1.push(111, 222);
        v1.push(333, 444);

        // Simulate an upgrade that changes the element struct's size: etch
        // V2's logic onto the same address/storage V1 already wrote to,
        // exactly what upgrading an implementation contract does.
        ArrayV2 v2 = new ArrayV2();
        vm.etch(address(v1), address(v2).code);
        ArrayV2 upgraded = ArrayV2(address(v1));

        (uint256 a1, uint256 b1, ) = upgraded.items(1);

        // Element 1 should still read (333, 444) if this were safe. It
        // doesn't: the stride changed, so element 1's fields now read from
        // the wrong offsets. This assertion is the corruption itself, not
        // a check that could pass or fail depending on unrelated details.
        assertTrue(
            a1 != 333 || b1 != 444,
            "expected element 1 to read back corrupted after the element struct grew"
        );
    }
}
