// SPDX-License-Identifier: MIT
// Disclaimer https://github.com/hats-finance/hats-contracts/blob/main/DISCLAIMER.md

pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IHATAirdrop.sol";
import "../interfaces/IHATToken.sol";
import "../interfaces/IHATVault.sol";

contract HATAirdropFactory is Ownable {
    error RedeemDataArraysLengthMismatch();
    error ContractIsNotHATAirdrop();
    error HATAirdropInitializationFailed();

    using SafeERC20 for IERC20;

    mapping(address => bool) public isAirdrop;
    IHATToken public HAT;

    event TokensWithdrawn(address indexed _owner, uint256 _amount);
    event HATAirdropCreated(address indexed _hatAirdrop, bytes _initData, IERC20 _token, uint256 _totalAmount);

    constructor (IHATToken _HAT) {
        HAT = _HAT;
    }

    function withdrawTokens(IERC20 _token, uint256 _amount) external onlyOwner {
        address owner = msg.sender;
        _token.safeTransfer(owner, _amount);
        emit TokensWithdrawn(owner, _amount);
    }

    function redeemMultipleAirdrops(
        IHATAirdrop[] calldata _airdrops,
        uint256[] calldata _amounts,
        bytes32[][] calldata _proofs,
        IHATVault[] calldata _depositIntoVaults,
        uint256[] calldata _amountsToDeposit,
        uint256[] calldata _minShares
    ) public {
        if (
            _airdrops.length != _amounts.length ||
            _airdrops.length != _proofs.length ||
            _airdrops.length != _depositIntoVaults.length ||
            _airdrops.length != _amountsToDeposit.length ||
            _airdrops.length != _minShares.length) {
            revert RedeemDataArraysLengthMismatch();
        }

        address caller = msg.sender;
        for (uint256 i = 0; i < _airdrops.length;) {
            if (!isAirdrop[address(_airdrops[i])]) {
                revert ContractIsNotHATAirdrop();
            }

            _airdrops[i].redeem(caller, _amounts[i], _proofs[i], _depositIntoVaults[i], _amountsToDeposit[i], _minShares[i]);

            unchecked {
                ++i;
            }
        }
    }

    function redeemAndDelegateMultipleAirdrops(
        IHATAirdrop[] calldata _airdrops,
        uint256[] calldata _amounts,
        bytes32[][] calldata _proofs,
        IHATVault[] calldata _depositIntoVaults,
        uint256[] calldata _amountsToDeposit,
        uint256[] calldata _minShares,
        address _delegatee,
        uint256 _nonce,
        uint256 _expiry,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external {
        redeemMultipleAirdrops(_airdrops, _amounts, _proofs, _depositIntoVaults, _amountsToDeposit, _minShares);

        HAT.delegateBySig(_delegatee, _nonce, _expiry, _v, _r, _s);
    }

    function createHATAirdrop(
        address _implementation,
        bytes calldata _initData,
        IERC20 _token,
        uint256 _totalAmount
    ) external onlyOwner returns (address result) {
        result = Clones.cloneDeterministic(_implementation, keccak256(_initData));

        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = result.call(_initData);

        if (!success) {
            revert HATAirdropInitializationFailed();
        }

        isAirdrop[result] = true;

        _token.safeApprove(result, _totalAmount);

        emit HATAirdropCreated(result, _initData, _token, _totalAmount);
    }

    function predictHATAirdropAddress(
        address _implementation,
        bytes calldata _initData
    ) external view returns (address) {
        return Clones.predictDeterministicAddress(_implementation, keccak256(_initData));
    }
}
