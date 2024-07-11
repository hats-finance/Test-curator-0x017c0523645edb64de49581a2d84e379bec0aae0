
import "./HATToken.sol";
import "@arbitrum/token-bridge-contracts/contracts/tokenbridge/ethereum/ICustomToken.sol";

contract HATTokenArbitrumBridgeL1 is ICustomToken, HATToken {
    /** functions for registring the token with the arbitrum bridge */
    function isArbitrumEnabled() external view override returns (uint8) {
        return uint8(0xb1);
    }

    function registerTokenOnL2(
        address l2CustomTokenAddress,
        uint256 maxSubmissionCostForCustomGateway,
        uint256 maxSubmissionCostForRouter,
        uint256 maxGasForCustomGateway,
        uint256 maxGasForRouter,
        uint256 gasPriceBid,
        uint256 valueForGateway,
        uint256 valueForRouter,
        address creditBackAddress
    ) public payable virtual override {
        IL1CustomGateway(gateway).registerTokenToL2{ value: valueForGateway }(
            l2CustomTokenAddress,
            maxGasForCustomGateway,
            gasPriceBid,
            maxSubmissionCostForCustomGateway,
            creditBackAddress
        );

        IGatewayRouter2(router).setGateway{ value: valueForRouter }(
            gateway,
            maxGasForRouter,
            gasPriceBid,
            maxSubmissionCostForRouter,
            creditBackAddress
        );
    }
}