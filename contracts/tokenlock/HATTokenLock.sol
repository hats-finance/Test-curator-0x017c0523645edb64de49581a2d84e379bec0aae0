// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./TokenLock.sol";
import "../token/HATToken.sol";


contract HATTokenLock is TokenLock {
    error DelegateDisabled();

    bool public canDelegate;

    // Initializer
    function initialize(
        address _tokenLockOwner,
        address _beneficiary,
        HATToken _token,
        uint256 _managedAmount,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _periods,
        uint256 _releaseStartTime,
        uint256 _vestingCliffTime,
        bool _revocable,
        bool _canDelegate
    ) external {
        _initialize(
            _tokenLockOwner,
            _beneficiary,
            address(_token),
            _managedAmount,
            _startTime,
            _endTime,
            _periods,
            _releaseStartTime,
            _vestingCliffTime,
            _revocable
        );
        if (_canDelegate) {
            _token.delegate(_beneficiary);
            canDelegate = true;
        }      
    }

    /// @dev delegate voting power
    /// @param _delegatee Address of delegatee
    function delegate(address _delegatee)
        external
        onlyBeneficiary
    {
        if (!canDelegate) {
            revert DelegateDisabled();
        }
        HATToken(address(token)).delegate(_delegatee);
    }
}
