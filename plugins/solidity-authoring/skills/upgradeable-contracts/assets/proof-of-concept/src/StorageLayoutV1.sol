// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Per-collateral configuration. This struct is the value type of a
/// mapping below - see the note on `params` for why growing this struct
/// later is storage-layout-safe on its own.
struct CollateralParams {
    uint256 minCollateralRatioBps;
    uint256 liquidationBonusBps;
}

/// @title StorageLayoutV1
/// @notice Baseline version, before a field is added to CollateralParams.
/// Compare against StorageLayoutV2Bad.sol and StorageLayoutV2Good.sol.
contract StorageLayoutV1 {
    uint256 public totalCollateralTypes;

    /// @notice Config per collateral token.
    /// @dev A mapping's value-type fields never occupy this contract's own
    /// sequential slots: each entry lives at
    /// keccak256(abi.encode(key, slotOf(params))), independent of how many
    /// fields CollateralParams has. Verify with `forge inspect
    /// StorageLayoutV1 storage-layout` - params sits at slot 1 regardless of
    /// the struct's size.
    mapping(address => CollateralParams) public params;

    /// @dev Reserved for new top-level state variables in a future upgrade.
    /// Shrink by exactly the number of NEW top-level variables added in the
    /// same upgrade. Growing a mapping's value struct is not that - see
    /// StorageLayoutV2Bad.sol for the mistake and StorageLayoutV2Good.sol
    /// for the fix.
    uint256[50] private __gap;
}
