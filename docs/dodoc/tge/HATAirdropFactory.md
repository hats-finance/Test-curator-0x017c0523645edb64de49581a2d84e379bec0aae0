# HATAirdropFactory









## Methods

### HAT

```solidity
function HAT() external view returns (contract IHATToken)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IHATToken | undefined |

### createHATAirdrop

```solidity
function createHATAirdrop(address _implementation, bytes _initData, contract IERC20 _token, uint256 _totalAmount) external nonpayable returns (address result)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _implementation | address | undefined |
| _initData | bytes | undefined |
| _token | contract IERC20 | undefined |
| _totalAmount | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| result | address | undefined |

### isAirdrop

```solidity
function isAirdrop(address) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### predictHATAirdropAddress

```solidity
function predictHATAirdropAddress(address _implementation, bytes _initData) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _implementation | address | undefined |
| _initData | bytes | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### redeemAndDelegateMultipleAirdrops

```solidity
function redeemAndDelegateMultipleAirdrops(contract IHATAirdrop[] _airdrops, uint256[] _amounts, bytes32[][] _proofs, contract IHATVault[] _depositIntoVaults, uint256[] _amountsToDeposit, uint256[] _minShares, address _delegatee, uint256 _nonce, uint256 _expiry, uint8 _v, bytes32 _r, bytes32 _s) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _airdrops | contract IHATAirdrop[] | undefined |
| _amounts | uint256[] | undefined |
| _proofs | bytes32[][] | undefined |
| _depositIntoVaults | contract IHATVault[] | undefined |
| _amountsToDeposit | uint256[] | undefined |
| _minShares | uint256[] | undefined |
| _delegatee | address | undefined |
| _nonce | uint256 | undefined |
| _expiry | uint256 | undefined |
| _v | uint8 | undefined |
| _r | bytes32 | undefined |
| _s | bytes32 | undefined |

### redeemMultipleAirdrops

```solidity
function redeemMultipleAirdrops(contract IHATAirdrop[] _airdrops, uint256[] _amounts, bytes32[][] _proofs, contract IHATVault[] _depositIntoVaults, uint256[] _amountsToDeposit, uint256[] _minShares) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _airdrops | contract IHATAirdrop[] | undefined |
| _amounts | uint256[] | undefined |
| _proofs | bytes32[][] | undefined |
| _depositIntoVaults | contract IHATVault[] | undefined |
| _amountsToDeposit | uint256[] | undefined |
| _minShares | uint256[] | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### withdrawTokens

```solidity
function withdrawTokens(contract IERC20 _token, uint256 _amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | contract IERC20 | undefined |
| _amount | uint256 | undefined |



## Events

### HATAirdropCreated

```solidity
event HATAirdropCreated(address indexed _hatAirdrop, bytes _initData, contract IERC20 _token, uint256 _totalAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _hatAirdrop `indexed` | address | undefined |
| _initData  | bytes | undefined |
| _token  | contract IERC20 | undefined |
| _totalAmount  | uint256 | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### TokensWithdrawn

```solidity
event TokensWithdrawn(address indexed _owner, uint256 _amount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _amount  | uint256 | undefined |



## Errors

### ContractIsNotHATAirdrop

```solidity
error ContractIsNotHATAirdrop()
```






### HATAirdropInitializationFailed

```solidity
error HATAirdropInitializationFailed()
```






### RedeemDataArraysLengthMismatch

```solidity
error RedeemDataArraysLengthMismatch()
```







