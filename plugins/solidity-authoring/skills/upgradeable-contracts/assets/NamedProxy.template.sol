// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/// @title {{CONTRACT_NAME}}
/// @notice Named transparent proxy for the {{IMPLEMENTATION_NAME}} upgradeable contract.
/// @dev Generated from NamedProxy.template.sol by scripts/generate-named-proxy.sh.
/// Regenerate from the template instead of hand-editing generated output, so
/// every named proxy in a deployment stays shaped identically.
contract {{CONTRACT_NAME}} is TransparentUpgradeableProxy {
    /// @dev Compile-time constant, inlined into bytecode at compile time (not
    /// a storage write). This is what prevents two differently-named proxies
    /// from verifying as byte-identical contracts on a block explorer, and
    /// makes the name readable directly off the deployed proxy.
    string public constant NAME = "{{CONTRACT_NAME}}";

    /// @param logic_ Address of the initial implementation contract.
    /// @param initialOwner_ Owner of the ProxyAdmin this constructor deploys.
    /// OpenZeppelin v5 semantics: this is NOT an existing ProxyAdmin address,
    /// it's the EOA/multisig that will own the ProxyAdmin created for this proxy.
    /// @param data_ Initialization calldata, delegatecalled into logic_ during
    /// construction. Pass empty bytes to skip initialization at construction.
    constructor(
        address logic_,
        address initialOwner_,
        bytes memory data_
    ) TransparentUpgradeableProxy(logic_, initialOwner_, data_) {}
}
