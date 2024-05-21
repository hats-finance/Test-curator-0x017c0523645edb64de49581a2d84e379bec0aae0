## Parameters

The following parameters are settable in the protocol. The various roles are described [here](roles.md)


By default, all the these roles, except the `committee`, are assigned to the Hats DAO, which controls some of these settings directly, and others through a timelock [HatTimelockController.sol](../../contracts/HatTimelockController.sol)


 | parameter name |  description | owner| scope | default | limits | setter | 
|---|---|---|---|---|---|---|
| **PROTOCOL SETTINGS** |
|registry.`owner` | | `registry.owner`| global | _hatGovernance | | `registry.transferOwnership`, `registry.renounceOwnership` |
| `HAT` | the token for which bounties will be traded | `registry.owner` | global | | |  `registry.setSwapToken`
| `isEmergencyPaused` | |  `registry.owner`| global | false | | `setEmergencyPaused` |
| `setMaxBountyDelay`  |time that must pass to change to max bounty |`registry.owner`| global | 2 days | >= 2 days | `registry.setMaxBountyDelay` |
| **VAULT CONFIGURATION** | 
| `owner` | controls certain vault settings | `vault.owner` | vault | | owner | |  `vault.transferOwnership`, `vault.renounceOwnership` |
| `committee` | proposes payouts |`vault.committee` | vault | || `vault.setCommittee` | after `committeeCheckIn` |
| `isVaultVisible` | | `registry.owner`| vault | false | | `registry.setVaultVisibility(_vault, _visible)` |
| `vaultDescription` | | `registry.owner`| vault | | | `vault.setVaultDescription` | only an event |
 `depositPause` | pause deposits in the vault | `vault.owner` | vault | | | `vault.setDepositPause` |
| **WITHDRAWAL** |
| `withdrawalFee` |	| `feeSetter`	|vault	| 0	| <= 2% |	`vault.setWithdrawalFee`
| `feeSetter` |sets the withdrawal fee | `registry.owner`| global |zero address | | `registry.setFeeSetter` |
| `withdrawPeriod` | period during which users can withdraw funds [more info](deposits-and-withdrawals.md##Withdrawal) | `registry.owner`| global | 11 hours | >= 1 hours | `registry.setWithdrawSafetyPeriod` |
| `safetyPeriod` | period during which a vault is locked for withdrawals | `registry.owner`| global | 1 hours | <= 6 hours | `registry.setWithdrawSafetyPeriod` |
| `withdrawRequestPendingPeriod`| period between withdraw request and withdrawal ([more info](deposits-and-withdrawals.md##Withdrawal)) |  `registry.owner`| global | 7 days | <= 90 days | `registry.setWithdrawRequestParams` |
| `withdrawRequestEnablePeriod`| | `registry.owner`| global | 7 days | >= 6 hours, <= 100 days | `registry.setWithdrawRequestParams` |
| **SUBMISSION** |
 `claimFee` | fee to be paid when submitting a claim | `registry.owner`| global | 0 | - | `registry.setClaimFee` |
| **PAYOUT** |
| `committee` | arbitrates claims and initiates payouts |`vault.owner` | vault |  ||`vault.setCommittee`  (only if committee has not checked in yet) |
| `committeeCheckedIn` | |`vault.committee` | vault | | | `vault.committeeCheckIn()` |
| `maxBounty` |maximum bounty that can be paid out| `vault.owner` | vault | | <= 90% | `vault.setPendingMaxBounty`, `vault.setMaxBounty` | noActiveClaim |
| `bountyGovernanceHAT`  ||`registry.owner`| vault | | +bountyHackerHatVested <= 20% | `vault.setHATBountySplit` |
| `defaultBountyGovernanceHAT` || `registry.owner`| global | | +defaultBountyHackerHatVested <= 20% | `registry.setDefaultHATBountySplit` |
| `bountyHackerHATVested`| |`registry.owner` | vault | | +bountyGovernanceHAT <= 20% | `vault.setHATBountySplit` |
| `defaultBountyHackerHATVested` || `registry.owner`| global | | +defaultBountyGovernanceHAT <= 20% | `registry.setDefaultHATBountySplit` |
| `bountySplit.hacker` || `vault.owner` | vault | | sum(bountySplit) = 100% | `vault.setBountySplit` | noActiveClaim noSafetyPeriod |
| `bountySplit.hackerVested` || `vault.owner` | vault | | sum(bountySplit) = 100% | `vault.setBountySplit` | noActiveClaim noSafetyPeriod |
| `bountySplit.committee` ||  `vault.owner` | vault | | sum(bountySplit) = 100%, max 10% | `vault.setBountySplit` | noActiveClaim noSafetyPeriod |
| `hatVestingDuration` | | `registry.owner`| global | 90 days | < 180 days |  `registry.setHatVestingParams` |
| `hatVestingPeriods`  ||`registry.owner`| global | 90 | > 0, <= hatVestingDuration |  `registry.setHatVestingParams` |
| `vestingPeriods` || `vault.owner` | vault | | > 0 | `vault.setVestingParams` |
| `vestingDuration` || `vault.owner` | vault  ||<= 120 days, > `vestingPeriods` | [`vault.setVestingParams`](./dodoc/interfaces/IHATClaimsManager.md#setvestingparams) |
| **ARBITRATION** |
| `arbitrator` | contract responsible for arbitration in case of conflicts |`registry.owner`| vault | `defaultArbitrator` | |  `vault.setArbitrator` |
| `defaultArbitrator` | | `registry.owner` | global | registry.owner | | `registry.setDefaultArbitrator` |
| `challengePeriod` | |`registry.owner`| vault | 3 days (defaultChallengePeriod) | >= 1 days, <= 5 days | `vault.setChallengePeriod` |
| `defaultChallengePeriod` || `registry.owner`| global | 3 days | >= 1 days, <= 5 days |  `registry.setDefaultChallengePeriod` |
| `challengeTimeOutPeriod` | |`registry.owner`| vault | 5 weeks | >= 2 days, <= 85 days | `vault.setChallengeTimeOutPeriod` |
| `defaultChallengeTimeOutPeriod` || `registry.owner`| global | 5 weeks | >= 2 days, <= 85 days |  `registry.setDefaultChallengeTimeOutPeriod` |
| `arbitratorCanChangeBounty` | |`registry.owner`| vault | | |  `vault.setArbitratorOptions` |
| `arbitratorCanChangeBeneficiary` || `registry.owner`| vault | | |  `vault.setArbitratorOptions` |
| `arbitratorCanSubmitClaims` | |`registry.owner`| vault | | |  `vault.setArbitratorOptions` |
| **INCENTIVES**|
| `rewardController` || `registry.owner`| vault | | | `vault.addRewardController` | noActiveClaim |
| vault's `allocPoint`  ||`rewardController.owner` | vault | 0 | | `rewardController.setAllocPoint(_vault, _allocPoint)` |
| `rewardController.owner` || `rewardController.owner` | global | | | `rewardController.transferOwnership`, `rewardController.renounceOwnership` |
| `epochRewardPerBlock` || `rewardController.owner` | global | | | `rewardController.setEpochRewardPerBlock` |

