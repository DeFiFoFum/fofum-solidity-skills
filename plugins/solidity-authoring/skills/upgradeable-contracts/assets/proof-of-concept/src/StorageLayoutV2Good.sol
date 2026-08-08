// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct CollateralParams {
    uint256 minCollateralRatioBps;
    uint256 liquidationBonusBps;
    uint256 gasCompensationCap;
}

/// @title StorageLayoutV2Good
/// @notice GOOD upgrade from StorageLayoutV1: the same new struct field as
/// StorageLayoutV2Bad.sol, but __gap is left untouched, because nothing
/// about this contract's own slot layout changed.
contract StorageLayoutV2Good {
    uint256 public totalCollateralTypes;
    mapping(address => CollateralParams) public params;

    /// @dev Correct: unchanged from StorageLayoutV1. `forge inspect
    /// StorageLayoutV2Good storage-layout` shows params still at slot 1 and
    /// __gap still at slot 2 with all 50 elements, exactly matching V1.
    uint256[50] private __gap;
}
