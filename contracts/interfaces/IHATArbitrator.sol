// SPDX-License-Identifier: MIT
// Disclaimer https://github.com/hats-finance/hats-contracts/blob/main/DISCLAIMER.md

pragma solidity 0.8.16;

import "./IHATVault.sol";

interface IHATArbitrator {
    error bondsNeededToStartDisputeMustBeHigherThanMinAmount();
    error BondAmountSubmittedTooLow();
    error ClaimIsNotCurrentlyActiveClaim();
    error CannotSubmitMoreEvidence();
    error ClaimIsNotDisputed();
    error OnlyExpertCommittee();
    error AlreadyResolved();
    error NoResolution();
    error ChallengePeriodDidNotPass();
    error CanOnlyBeCalledByCourt();
    error ChallengePeriodPassed();
    error CannotClaimBond();
    error CannotDismissUnchallengedResolution();
    error ClaimReviewPeriodEnd();
    error ClaimReviewPeriodDidNotEnd();
    error ClaimExpired();
    error AlreadyChallenged();

    struct Resolution {
        address beneficiary;
        uint16 bountyPercentage;
        uint256 resolvedAt;
    }

    struct SubmitClaimRequest {
        address submitter;
        uint256 bond;
        uint256 submittedAt;
        string descriptionHash;
    }

    event ClaimDisputed(
        IHATVault indexed _vault,
        bytes32 indexed _claimId,
        address indexed _disputer,
        uint256 _bondAmount,
        string _descriptionHash
    );
    event DisputeDismissed(
        IHATVault indexed _vault,
        bytes32 indexed _claimId,
        string _descriptionHash
    );
    event DisputeAccepted(
        IHATVault indexed _vault,
        bytes32 indexed _claimId,
        uint16 _bountyPercentage,
        address _beneficiary,
        string _descriptionHash
    );
    event DisputersRefunded(
        IHATVault indexed _vault,
        bytes32 indexed _claimId,
        address[] _disputers
    );
    event DisputersConfiscated(
        IHATVault indexed _vault,
        bytes32 indexed _claimId,
        address[] _disputers
    );
    event BondRefundClaimed(
        IHATVault indexed _vault,
        bytes32 indexed _claimId,
        address _disputer,
        uint256 _amountClaimed
    );
    event ResolutionExecuted(
        IHATVault indexed _vault,
        bytes32 indexed _claimId
    );
    event ResolutionDismissed(
        IHATVault indexed _vault,
        bytes32 indexed _claimId
    );
    event ResolutionChallenged(
        IHATVault indexed _vault,
        bytes32 indexed _claimId
    );

    event SubmitClaimRequestCreated(
        bytes32 indexed _internalClaimId,
        address indexed _submitter,
        uint256 _bond,
        string _descriptionHash
    );
    event SubmitClaimRequestDismissed(
        bytes32 indexed _internalClaimId,
        string _descriptionHash
    );
    event SubmitClaimRequestApproved(
        bytes32 indexed _internalClaimId,
        bytes32 indexed _claimId,
        IHATVault indexed _vault
    );
    event SubmitClaimRequestExpired(bytes32 indexed _internalClaimId);

    /**
     * Dispute the commitee's claim
     * Can be called by anyone
     * @param _vault the vault that the claim was created
     * @param _claimId the id of the claim
     * @param _bondAmount Amount of tokens that the disputer will put up as a bond. This must be at least minBondAmount.
     * The dispute is accepted if the total amount of bonds exceeds bondsNeededToStartDispute
     */
    function dispute(
        IHATVault _vault,
        bytes32 _claimId,
        uint256 _bondAmount,
        string calldata _descriptionHash
    ) external;

    /**
     * Dismiss the dispute - i.e. approve the original claim from the committee
     * Can only be called by the expert commmittee.
     * The expert committee will receive the bonds of the disputers as a payment for their service
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     * @param _descriptionHash an (ipfs) hash representing the motiviations of the dismissal
     */
    function dismissDispute(
        IHATVault _vault,
        bytes32 _claimId,
        string calldata _descriptionHash
    )
        external;

    /**
     * Acccept the dispute - i.e. rule in favor of the disputers and against the original claim from the committee
     * Can only be called by the Expert Committee
     * The expert committee can include a payment for their service in the payout process
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     * @param _bountyPercentage the percentage of the vault that will be paid out to the _beneficiary
     * @param _beneficiary the (new) benficiary of the claim
     * @param _disputersToRefund array of addresses of disputers that will get their bond back
     * @param _disputersToConfiscate array of addresses of disputers that will lose their bond
     * @param _descriptionHash a motivation of the ruling
     */
    function acceptDispute(
        IHATVault _vault,
        bytes32 _claimId,
        uint16 _bountyPercentage,
        address _beneficiary,
        address[] calldata _disputersToRefund,
        address[] calldata _disputersToConfiscate,
        string calldata _descriptionHash
    )
        external;

    /**
     * @notice release the bonds of the disputers, so that they can claim them back
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     * @param _disputersToRefund array of addresses
     */
    function refundDisputers(
        IHATVault _vault,
        bytes32 _claimId,
        address[] calldata _disputersToRefund
    )
        external;

    /**
     * Forfeit the bonds of the given list of disputers. Their bonds will be sent to the expert committee
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     * @param _disputersToConfiscate a list of addresses of disputers whose bond will be forfeited
     */
    function confiscateDisputers(
        IHATVault _vault,
        bytes32 _claimId,
        address[] calldata _disputersToConfiscate
    )
        external;

    /**
     * reclaim a bond that msg.sender has put up for a given claim
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     */
    function reclaimBond(IHATVault _vault, bytes32 _claimId) external;

    /**
     * @notice execute a resolution from the expert committee
     * if the resolution was challenged, this can only be called by the court
     * if the resolution was not challenged durring the resolutionChallengePeriod, this can be called by anyone
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     */
    function executeResolution(
        IHATVault _vault,
        bytes32 _claimId
    )
        external;

    /**
     * Dismiss a resolution from the expert committee
     * can only be called by the court
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     */
    function dismissResolution(
        IHATVault _vault,
        bytes32 _claimId
    )
        external;

    /**
     * Challenge a resolution of the expert committee - i.e. bring it to the attation of the court
     * @param _vault the address of the vault where the claim was started
     * @param _claimId id of the claim that was disputed. Must be the currently active claim
     */
    function challengeResolution(
        IHATVault _vault,
        bytes32 _claimId
    )
        external;

    /**
     * Submit a request for the expert committee to consider a claim
     * A security researcher can use this if his claim is ignored by the committee
     * The requester must provide a bond, which they will lose if the claim is considered invalid by the committee
     * @param _descriptionHash a hash of a description of the claim
     */
    function submitClaimRequest(string calldata _descriptionHash) external;

    /**
     * Dismiss a request to create a claim. Can only be called by the expert committee
     * @param _internalClaimId the id of the claim to dismiss
     * @param _descriptionHash a motivation for the dismissal
     */
    function dismissSubmitClaimRequest(
        bytes32 _internalClaimId,
        string calldata _descriptionHash
    ) external;

    /**
     * Submit a new claim on the basis of a submitClaimRequest
     * only calleable by the expert committee
     * the claim must be submitted within the submitClaimRequestReviewPeriod
     * @param _vault the vault where the claim was created
     * @param _internalClaimId the id of the claim to approve
     * @param _bountyPercentage the percentage of the vault that will be paid out to the _beneficiary
     * @param _beneficiary the (new) benficiary of the claim
     * @param _descriptionHash a motivation for the claim
     */
    function approveSubmitClaimRequest(
        IHATVault _vault,
        bytes32 _internalClaimId,
        address _beneficiary,
        uint16 _bountyPercentage,
        string calldata _descriptionHash
    ) external;

    /**
     * Refund the bond of the claimRequest by the sumbitter of the claim
     * @param _internalClaimId the claim of which the bond will be refunded
     */
    function refundExpiredSubmitClaimRequest(
        bytes32 _internalClaimId
    ) external;
}
