// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../token/HATTokenArbitrumBridgeL1.sol";

contract MockL1CustomGateway {
    function registerTokenToL2(
        address _l2Address,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256) {
        require(HATTokenArbitrumBridgeL1(msg.sender).isArbitrumEnabled() == uint8(0xb1), "Failed to verify");
        return 1;
    }
}
