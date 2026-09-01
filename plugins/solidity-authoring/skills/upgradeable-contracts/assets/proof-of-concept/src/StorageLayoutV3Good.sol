// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct CollateralParams {
    uint256 minCollateralRatioBps;
    uint256 liquidationBonusBps;
    uint256 gasCompensationCap;
}

/// @title StorageLayoutV3Good
/// @notice GOOD upgrade from StorageLayoutV2Good: this time a genuinely new
/// TOP-LEVEL variable is added (feeRecipient), appended after the last
/// existing variable and before __gap. __gap correctly shrinks by exactly 1
/// to match - the case __gap actually exists for.
contract StorageLayoutV3Good {
    uint256 public totalCollateralTypes;
    mapping(address => CollateralParams) public params;

    /// @notice New in V3: address collected fees are swept to.
    address public feeRecipient;

    /// @dev Correct: shrunk by exactly 1, matching the 1 new top-level
    /// variable above. `forge inspect StorageLayoutV3Good storage-layout`
    /// shows feeRecipient at slot 2 and __gap moved to slot 3 with 49
    /// elements, replacing exactly the 1 slot feeRecipient now occupies.
    uint256[49] private __gap;
}
