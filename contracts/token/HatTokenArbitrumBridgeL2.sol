// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./HATToken.sol";
import "@arbitrum/token-bridge-contracts/contracts/tokenbridge/arbitrum/IArbToken.sol";

contract HATTokenArbitrumBridgeL2 is HATToken, IArbToken {
    address public l2Gateway;
    address public override l1Address;

    modifier onlyL2Gateway() {
        require(msg.sender == l2Gateway, "NOT_GATEWAY");
        _;
    }

    constructor(address _l2Gateway, address _l1TokenAddress) HATToken(address(0)) {
        l2Gateway = _l2Gateway;
        l1Address = _l1TokenAddress;
        transferable = true;
        emit TransferableSet();
    }

    /**
     * @notice should increase token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeMint(address account, uint256 amount) external override onlyL2Gateway {
        _mint(account, amount);
    }

    /**
     * @notice should decrease token supply by amount, and should only be callable by the L2Gateway.
     */
    function bridgeBurn(address account, uint256 amount) external override onlyL2Gateway {
        _burn(account, amount);
    }
}