# ArbitrumEnabledToken









## Methods

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




