// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice V2 adds gasCompensationCap to the struct.
struct CollateralParams {
    uint256 minCollateralRatioBps;
    uint256 liquidationBonusBps;
    uint256 gasCompensationCap;
}

/// @title StorageLayoutV2Bad
/// @notice BAD upgrade from StorageLayoutV1: shrinks __gap to "make room"
/// for the new struct field. The struct's fields were never sequential-slot
/// data (see StorageLayoutV1.sol), so this shrink doesn't free anything it
/// needs to. It just burns one slot of real reserve that a future
/// genuinely-new top-level variable will want. Compare against
/// StorageLayoutV2Good.sol, which makes the same struct change correctly.
contract StorageLayoutV2Bad {
    uint256 public totalCollateralTypes;
    mapping(address => CollateralParams) public params;

    /// @dev WRONG: shrunk from 50 to 49 for a struct-in-mapping field
    /// addition that never touched this contract's own slots. Confirmed via
    /// `forge inspect StorageLayoutV2Bad storage-layout`: params still sits
    /// at slot 1, same as StorageLayoutV1, so nothing about this contract's
    /// own layout needed the reserve to shrink.
    uint256[49] private __gap;
}
