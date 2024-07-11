# IArbToken









## Methods

### bridgeBurn

```solidity
function bridgeBurn(address account, uint256 amount) external nonpayable
```

should decrease token supply by amount, and should (probably) only be callable by the L1 bridge.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| amount | uint256 | undefined |

### bridgeMint

```solidity
function bridgeMint(address account, uint256 amount) external nonpayable
```

should increase token supply by amount, and should (probably) only be callable by the L1 bridge.



#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined |
| amount | uint256 | undefined |

### l1Address

```solidity
function l1Address() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | address of layer 1 token |




