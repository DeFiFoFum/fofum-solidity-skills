// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StorageLayoutV1} from "../src/StorageLayoutV1.sol";
import {StorageLayoutV2Good} from "../src/StorageLayoutV2Good.sol";

/// @notice The runtime counterpart to ArrayElementCorruption.t.sol, proving
/// the opposite (safe) case with the same technique: seed real storage,
/// simulate an upgrade with vm.etch, and read the old data back through the
/// new, bigger struct. See references/storage-layout-slots.md for why
/// mappings and arrays behave differently here.
contract MappingValueGrowthIsSafeTest is Test {
    function test_growingMappingValueStructPreservesExistingData() public {
        StorageLayoutV1 v1 = new StorageLayoutV1();
        address token = makeAddr("token");

        // Seed storage directly (these demo contracts have no setters):
        // totalCollateralTypes is slot 0.
        vm.store(address(v1), bytes32(uint256(0)), bytes32(uint256(3)));

        // params is slot 1; a mapping entry's fields live at
        // keccak256(abi.encode(key, mappingSlot)), sequential from there,
        // independent of every other entry and of the contract's own slots.
        bytes32 base = keccak256(abi.encode(token, uint256(1)));
        vm.store(address(v1), base, bytes32(uint256(500))); // minCollateralRatioBps
        vm.store(address(v1), bytes32(uint256(base) + 1), bytes32(uint256(150))); // liquidationBonusBps

        // Simulate the upgrade: etch V2Good's bytecode (3-field struct) onto
        // the same address/storage V1 just wrote to, exactly what upgrading
        // an implementation contract does.
        StorageLayoutV2Good v2 = new StorageLayoutV2Good();
        vm.etch(address(v1), address(v2).code);
        StorageLayoutV2Good upgraded = StorageLayoutV2Good(address(v1));

        // Top-level state (slot 0) is untouched by the mapping-value change.
        assertEq(upgraded.totalCollateralTypes(), 3);

        // The pre-upgrade fields read back correctly through the new,
        // bigger struct; the new third field reads as zero (never written),
        // not garbage bled in from a neighboring entry the way the array
        // case corrupts data.
        (uint256 minCollateralRatioBps, uint256 liquidationBonusBps, uint256 gasCompensationCap) =
            upgraded.params(token);
        assertEq(minCollateralRatioBps, 500);
        assertEq(liquidationBonusBps, 150);
        assertEq(gasCompensationCap, 0);
    }
}
