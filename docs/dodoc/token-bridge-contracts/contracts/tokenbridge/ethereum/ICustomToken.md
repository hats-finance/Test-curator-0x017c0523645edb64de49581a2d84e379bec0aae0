# ICustomToken



> Minimum expected interface for L1 custom token (see TestCustomTokenL1.sol for an example implementation)





## Methods

### balanceOf

```solidity
function balanceOf(address account) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### isArbitrumEnabled

```solidity
function isArbitrumEnabled() external view returns (uint8)
```

should return `0xb1` if token is enabled for arbitrum gateways

*Previous implmentation used to return `uint8(0xa4b1)`, however that causes compile time error in Solidity 0.8. due to type mismatch.      In current version `uint8(0xb1)` shall be returned, which results in no change as that&#39;s the same value as truncated `uint8(0xa4b1)`.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### registerTokenOnL2

```solidity
function registerTokenOnL2(address l2CustomTokenAddress, uint256 maxSubmissionCostForCustomBridge, uint256 maxSubmissionCostForRouter, uint256 maxGasForCustomBridge, uint256 maxGasForRouter, uint256 gasPriceBid, uint256 valueForGateway, uint256 valueForRouter, address creditBackAddress) external payable
```

Should make an external call to EthERC20Bridge.registerCustomL2Token



#### Parameters

| Name | Type | Description |
|---|---|---|
| l2CustomTokenAddress | address | undefined |
| maxSubmissionCostForCustomBridge | uint256 | undefined |
| maxSubmissionCostForRouter | uint256 | undefined |
| maxGasForCustomBridge | uint256 | undefined |
| maxGasForRouter | uint256 | undefined |
| gasPriceBid | uint256 | undefined |
| valueForGateway | uint256 | undefined |
| valueForRouter | uint256 | undefined |
| creditBackAddress | address | undefined |

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| sender | address | undefined |
| recipient | address | undefined |
| amount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |




