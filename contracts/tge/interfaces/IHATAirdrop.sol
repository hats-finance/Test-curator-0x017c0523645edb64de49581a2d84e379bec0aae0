// SPDX-License-Identifier: MIT
// Disclaimer https://github.com/hats-finance/hats-contracts/blob/main/DISCLAIMER.md

pragma solidity 0.8.16;

import "../../interfaces/IHATVault.sol";


interface IHATAirdrop {
    function redeem(address _account, uint256 _amount, bytes32[] calldata _proof, IHATVault _depositIntoVault, uint256 _amountToDeposit, uint256 _minShares) external;
}