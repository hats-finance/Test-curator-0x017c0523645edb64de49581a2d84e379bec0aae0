// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;


contract MockL2GatewayRouter {
    function setGateway(
        address _gateway,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256) {
        return 1;
    }
}
