// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IBaseEscrow {
    function getTransaction(uint256 _transactionId) external view returns (
        uint256 id,
        address buyer,
        address seller,
        uint256 amount,
        uint256 protocolFee,
        string memory description,
        uint8 category,
        uint8 status,
        uint256 createdAt,
        uint256 fundedAt,
        uint256 shipmentConfirmedAt,
        uint256 completedAt,
        uint256 buyerTimeout,
        uint256 sellerTimeout,
        bool buyerRated,
        bool sellerRated
    );
    function resolveDispute(uint256 _transactionId, address _winner) external;
}

/**
 * @title ArbitrationSystem
 * @dev Handles dispute resolution through community arbitrators
 * @notice Manages arbitrator registry, voting, and dispute resolution
 */
contract ArbitrationSystem is ReentrancyGuard, Pausable, Ownable {

    // ============ Enums ============

    enum DisputeStatus {
        Pending,        // Awaiting arbitrator assignment
        Voting,         // Arbitrators are voting
        Resolved,       // Dispute resolved
        Expired         // Voting period expired without quorum
    }

    enum Vote {
        None,
        Buyer,
        Seller
    }

    // ============ Structs ============

    struct Arbitrator {
        address arbitratorAddress;
        uint256 stakedAmount;
        uint256 totalCasesAssigned;
        uint256 totalCasesVoted;
        uint256 correctVotes;
        uint256 reputation;
        bool isActive;
        uint256 registeredAt;
        uint256 lastActiveAt;
    }

    struct Dispute {
        uint256 transactionId;
        address buyer;
        address seller;
        uint256 amount;
        string buyerEvidence;
        string sellerEvidence;
        DisputeStatus status;
        address[] assignedArbitrators;
        mapping(address => Vote) votes;
        uint256 buyerVotes;
        uint256 sellerVotes;
        uint256 createdAt;
        uint256 votingDeadline;
        address winner;
    }

    // ============ State Variables ============

    IBaseEscrow public escrowContract;

    uint256 public constant MIN_STAKE = 0.05 ether;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM_SIZE = 3;
    uint256 public constant ARBITRATORS_PER_DISPUTE = 5;

    uint256 public disputeCounter;
    uint256 public totalArbitrators;
    uint256 public arbitratorRewardPercentage = 50; // 0.5% of dispute amount

    address[] public arbitratorList;
    mapping(address => Arbitrator) public arbitrators;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256) public transactionToDispute;
    mapping(address => uint256[]) public arbitratorDisputes;

    // ============ Events ============

    event ArbitratorRegistered(
        address indexed arbitrator,
        uint256 stakedAmount
    );

    event ArbitratorDeactivated(
        address indexed arbitrator,
        uint256 refundedAmount
    );

    event StakeIncreased(
        address indexed arbitrator,
        uint256 newTotal
    );

    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed transactionId,
        address buyer,
        address seller
    );

    event ArbitratorsAssigned(
        uint256 indexed disputeId,
        address[] arbitrators
    );

    event EvidenceSubmitted(
        uint256 indexed disputeId,
        address indexed submitter,
        bool isBuyer
    );

    event VoteCast(
        uint256 indexed disputeId,
        address indexed arbitrator,
        Vote vote
    );

    event DisputeResolved(
        uint256 indexed disputeId,
        address indexed winner,
        uint256 buyerVotes,
        uint256 sellerVotes
    );

    event ArbitratorRewarded(
        address indexed arbitrator,
        uint256 amount
    );

    event ArbitratorPenalized(
        address indexed arbitrator,
        uint256 amount
    );

    // ============ Modifiers ============

    modifier onlyActiveArbitrator() {
        require(
            arbitrators[msg.sender].isActive,
            "Not an active arbitrator"
        );
        _;
    }

    modifier onlyAssignedArbitrator(uint256 _disputeId) {
        require(
            isAssignedArbitrator(_disputeId, msg.sender),
            "Not assigned to this dispute"
        );
        _;
    }

    modifier disputeExists(uint256 _disputeId) {
        require(
            _disputeId > 0 && _disputeId <= disputeCounter,
            "Dispute does not exist"
        );
        _;
    }

    modifier onlyEscrowContract() {
        require(
            msg.sender == address(escrowContract),
            "Only escrow contract"
        );
        _;
    }

    // ============ Constructor ============

    constructor(address _escrowContract) Ownable(msg.sender) {
        require(_escrowContract != address(0), "Invalid escrow address");
        escrowContract = IBaseEscrow(_escrowContract);
    }

    // ============ Arbitrator Functions ============

    /**
     * @notice Register as an arbitrator with stake
     */
    function registerArbitrator() external payable whenNotPaused {
        require(!arbitrators[msg.sender].isActive, "Already registered");
        require(msg.value >= MIN_STAKE, "Insufficient stake");

        arbitrators[msg.sender] = Arbitrator({
            arbitratorAddress: msg.sender,
            stakedAmount: msg.value,
            totalCasesAssigned: 0,
            totalCasesVoted: 0,
            correctVotes: 0,
            reputation: 100, // Start with base reputation
            isActive: true,
            registeredAt: block.timestamp,
            lastActiveAt: block.timestamp
        });

        arbitratorList.push(msg.sender);
        totalArbitrators++;

        emit ArbitratorRegistered(msg.sender, msg.value);
    }

    /**
     * @notice Increase arbitrator stake
     */
    function increaseStake() external payable onlyActiveArbitrator {
        require(msg.value > 0, "Must send ETH");
        arbitrators[msg.sender].stakedAmount += msg.value;
        emit StakeIncreased(msg.sender, arbitrators[msg.sender].stakedAmount);
    }

    /**
     * @notice Deactivate and withdraw stake (if no pending disputes)
     */
    function deactivateArbitrator() external nonReentrant onlyActiveArbitrator {
        Arbitrator storage arb = arbitrators[msg.sender];

        // Check for pending disputes
        uint256[] memory arbDisputes = arbitratorDisputes[msg.sender];
        for (uint256 i = 0; i < arbDisputes.length; i++) {
            require(
                disputes[arbDisputes[i]].status == DisputeStatus.Resolved ||
                disputes[arbDisputes[i]].status == DisputeStatus.Expired,
                "Has pending disputes"
            );
        }

        uint256 refund = arb.stakedAmount;
        arb.stakedAmount = 0;
        arb.isActive = false;
        totalArbitrators--;

        (bool success, ) = msg.sender.call{value: refund}("");
        require(success, "Refund failed");

        emit ArbitratorDeactivated(msg.sender, refund);
    }

    // ============ Dispute Functions ============

    /**
     * @notice Create a new dispute for a transaction
     * @param _transactionId ID of the disputed transaction
     * @param _buyer Address of the buyer
     * @param _seller Address of the seller
     * @param _amount Amount in dispute
     */
    function createDispute(
        uint256 _transactionId,
        address _buyer,
        address _seller,
        uint256 _amount
    ) external whenNotPaused returns (uint256) {
        require(
            transactionToDispute[_transactionId] == 0,
            "Dispute already exists"
        );
        require(totalArbitrators >= ARBITRATORS_PER_DISPUTE, "Not enough arbitrators");

        disputeCounter++;
        uint256 disputeId = disputeCounter;

        Dispute storage newDispute = disputes[disputeId];
        newDispute.transactionId = _transactionId;
        newDispute.buyer = _buyer;
        newDispute.seller = _seller;
        newDispute.amount = _amount;
        newDispute.status = DisputeStatus.Pending;
        newDispute.createdAt = block.timestamp;
        newDispute.votingDeadline = block.timestamp + VOTING_PERIOD;

        transactionToDispute[_transactionId] = disputeId;

        emit DisputeCreated(disputeId, _transactionId, _buyer, _seller);

        // Auto-assign arbitrators
        _assignArbitrators(disputeId);

        return disputeId;
    }

    /**
     * @notice Submit evidence for a dispute
     * @param _disputeId ID of the dispute
     * @param _evidence Evidence text/IPFS hash
     */
    function submitEvidence(uint256 _disputeId, string calldata _evidence)
        external
        disputeExists(_disputeId)
    {
        Dispute storage dispute = disputes[_disputeId];
        require(
            dispute.status == DisputeStatus.Pending ||
            dispute.status == DisputeStatus.Voting,
            "Cannot submit evidence now"
        );
        require(
            msg.sender == dispute.buyer || msg.sender == dispute.seller,
            "Not a party to dispute"
        );
        require(bytes(_evidence).length > 0, "Evidence required");
        require(bytes(_evidence).length <= 2000, "Evidence too long");

        if (msg.sender == dispute.buyer) {
            dispute.buyerEvidence = _evidence;
            emit EvidenceSubmitted(_disputeId, msg.sender, true);
        } else {
            dispute.sellerEvidence = _evidence;
            emit EvidenceSubmitted(_disputeId, msg.sender, false);
        }
    }

    /**
     * @notice Cast vote on a dispute
     * @param _disputeId ID of the dispute
     * @param _vote Vote for buyer or seller
     */
    function castVote(uint256 _disputeId, Vote _vote)
        external
        whenNotPaused
        disputeExists(_disputeId)
        onlyAssignedArbitrator(_disputeId)
    {
        Dispute storage dispute = disputes[_disputeId];
        require(
            dispute.status == DisputeStatus.Voting,
            "Dispute not in voting phase"
        );
        require(
            block.timestamp < dispute.votingDeadline,
            "Voting period ended"
        );
        require(
            dispute.votes[msg.sender] == Vote.None,
            "Already voted"
        );
        require(
            _vote == Vote.Buyer || _vote == Vote.Seller,
            "Invalid vote"
        );

        dispute.votes[msg.sender] = _vote;
        arbitrators[msg.sender].totalCasesVoted++;
        arbitrators[msg.sender].lastActiveAt = block.timestamp;

        if (_vote == Vote.Buyer) {
            dispute.buyerVotes++;
        } else {
            dispute.sellerVotes++;
        }

        emit VoteCast(_disputeId, msg.sender, _vote);

        // Check if quorum reached
        if (dispute.buyerVotes >= QUORUM_SIZE || dispute.sellerVotes >= QUORUM_SIZE) {
            _resolveDispute(_disputeId);
        }
    }

    /**
     * @notice Finalize dispute after voting period (if no quorum)
     * @param _disputeId ID of the dispute
     */
    function finalizeDispute(uint256 _disputeId)
        external
        disputeExists(_disputeId)
    {
        Dispute storage dispute = disputes[_disputeId];
        require(
            dispute.status == DisputeStatus.Voting,
            "Dispute not in voting phase"
        );
        require(
            block.timestamp >= dispute.votingDeadline,
            "Voting period not ended"
        );

        if (dispute.buyerVotes + dispute.sellerVotes > 0) {
            // Resolve with simple majority if any votes cast
            _resolveDispute(_disputeId);
        } else {
            // Mark as expired if no votes
            dispute.status = DisputeStatus.Expired;
            // Default to refunding buyer in case of no votes
            dispute.winner = dispute.buyer;
            escrowContract.resolveDispute(dispute.transactionId, dispute.buyer);
        }
    }

    // ============ View Functions ============

    function getDispute(uint256 _disputeId)
        external
        view
        returns (
            uint256 transactionId,
            address buyer,
            address seller,
            uint256 amount,
            string memory buyerEvidence,
            string memory sellerEvidence,
            DisputeStatus status,
            uint256 buyerVotes,
            uint256 sellerVotes,
            uint256 votingDeadline,
            address winner
        )
    {
        Dispute storage d = disputes[_disputeId];
        return (
            d.transactionId,
            d.buyer,
            d.seller,
            d.amount,
            d.buyerEvidence,
            d.sellerEvidence,
            d.status,
            d.buyerVotes,
            d.sellerVotes,
            d.votingDeadline,
            d.winner
        );
    }

    function getDisputeArbitrators(uint256 _disputeId)
        external
        view
        returns (address[] memory)
    {
        return disputes[_disputeId].assignedArbitrators;
    }

    function getArbitratorVote(uint256 _disputeId, address _arbitrator)
        external
        view
        returns (Vote)
    {
        return disputes[_disputeId].votes[_arbitrator];
    }

    function getArbitrator(address _arbitrator)
        external
        view
        returns (Arbitrator memory)
    {
        return arbitrators[_arbitrator];
    }

    function getArbitratorDisputes(address _arbitrator)
        external
        view
        returns (uint256[] memory)
    {
        return arbitratorDisputes[_arbitrator];
    }

    function isAssignedArbitrator(uint256 _disputeId, address _arbitrator)
        public
        view
        returns (bool)
    {
        address[] memory assigned = disputes[_disputeId].assignedArbitrators;
        for (uint256 i = 0; i < assigned.length; i++) {
            if (assigned[i] == _arbitrator) {
                return true;
            }
        }
        return false;
    }

    function getActiveArbitratorsCount() external view returns (uint256) {
        return totalArbitrators;
    }

    // ============ Admin Functions ============

    function setEscrowContract(address _escrowContract) external onlyOwner {
        require(_escrowContract != address(0), "Invalid address");
        escrowContract = IBaseEscrow(_escrowContract);
    }

    function setArbitratorRewardPercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 500, "Max 5%");
        arbitratorRewardPercentage = _percentage;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    /**
     * @notice Randomly assign arbitrators to a dispute
     */
    function _assignArbitrators(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];

        address[] memory eligible = _getEligibleArbitrators(
            dispute.buyer,
            dispute.seller
        );

        require(
            eligible.length >= ARBITRATORS_PER_DISPUTE,
            "Not enough eligible arbitrators"
        );

        // Pseudo-random selection using block data
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _disputeId,
            eligible.length
        )));

        address[] memory selected = new address[](ARBITRATORS_PER_DISPUTE);
        bool[] memory used = new bool[](eligible.length);
        uint256 selectedCount = 0;

        while (selectedCount < ARBITRATORS_PER_DISPUTE) {
            uint256 index = seed % eligible.length;
            seed = uint256(keccak256(abi.encodePacked(seed)));

            if (!used[index]) {
                used[index] = true;
                selected[selectedCount] = eligible[index];
                arbitrators[eligible[index]].totalCasesAssigned++;
                arbitratorDisputes[eligible[index]].push(_disputeId);
                selectedCount++;
            }
        }

        dispute.assignedArbitrators = selected;
        dispute.status = DisputeStatus.Voting;

        emit ArbitratorsAssigned(_disputeId, selected);
    }

    /**
     * @notice Get list of eligible arbitrators (not parties to dispute)
     */
    function _getEligibleArbitrators(address _buyer, address _seller)
        internal
        view
        returns (address[] memory)
    {
        uint256 eligibleCount = 0;

        // First pass: count eligible
        for (uint256 i = 0; i < arbitratorList.length; i++) {
            address arb = arbitratorList[i];
            if (
                arbitrators[arb].isActive &&
                arb != _buyer &&
                arb != _seller
            ) {
                eligibleCount++;
            }
        }

        // Second pass: collect eligible
        address[] memory eligible = new address[](eligibleCount);
        uint256 index = 0;

        for (uint256 i = 0; i < arbitratorList.length; i++) {
            address arb = arbitratorList[i];
            if (
                arbitrators[arb].isActive &&
                arb != _buyer &&
                arb != _seller
            ) {
                eligible[index] = arb;
                index++;
            }
        }

        return eligible;
    }

    /**
     * @notice Resolve a dispute based on votes
     */
    function _resolveDispute(uint256 _disputeId) internal {
        Dispute storage dispute = disputes[_disputeId];
        dispute.status = DisputeStatus.Resolved;

        address winner;
        if (dispute.buyerVotes > dispute.sellerVotes) {
            winner = dispute.buyer;
        } else if (dispute.sellerVotes > dispute.buyerVotes) {
            winner = dispute.seller;
        } else {
            // Tie: default to buyer (consumer protection)
            winner = dispute.buyer;
        }

        dispute.winner = winner;

        // Update arbitrator reputations and distribute rewards
        _processArbitratorOutcomes(_disputeId, winner);

        // Resolve in escrow contract
        escrowContract.resolveDispute(dispute.transactionId, winner);

        emit DisputeResolved(
            _disputeId,
            winner,
            dispute.buyerVotes,
            dispute.sellerVotes
        );
    }

    /**
     * @notice Process arbitrator rewards and penalties
     */
    function _processArbitratorOutcomes(uint256 _disputeId, address _winner) internal {
        Dispute storage dispute = disputes[_disputeId];
        Vote winningVote = (_winner == dispute.buyer) ? Vote.Buyer : Vote.Seller;

        uint256 rewardPool = (dispute.amount * arbitratorRewardPercentage) / 10000;
        uint256 correctVoters = 0;

        // Count correct voters
        for (uint256 i = 0; i < dispute.assignedArbitrators.length; i++) {
            address arb = dispute.assignedArbitrators[i];
            if (dispute.votes[arb] == winningVote) {
                correctVoters++;
            }
        }

        // Distribute rewards and penalties
        for (uint256 i = 0; i < dispute.assignedArbitrators.length; i++) {
            address arb = dispute.assignedArbitrators[i];
            Arbitrator storage arbitrator = arbitrators[arb];

            if (dispute.votes[arb] == winningVote) {
                // Correct vote: reward
                arbitrator.correctVotes++;
                arbitrator.reputation = _min(arbitrator.reputation + 5, 200);

                if (correctVoters > 0) {
                    uint256 reward = rewardPool / correctVoters;
                    if (reward > 0) {
                        arbitrator.stakedAmount += reward;
                        emit ArbitratorRewarded(arb, reward);
                    }
                }
            } else if (dispute.votes[arb] == Vote.None) {
                // Did not vote: penalize
                uint256 penalty = arbitrator.stakedAmount / 20; // 5% penalty
                arbitrator.stakedAmount -= penalty;
                arbitrator.reputation = _max(arbitrator.reputation - 10, 0);

                if (arbitrator.stakedAmount < MIN_STAKE) {
                    arbitrator.isActive = false;
                    totalArbitrators--;
                }

                emit ArbitratorPenalized(arb, penalty);
            } else {
                // Wrong vote: small reputation penalty
                arbitrator.reputation = _max(arbitrator.reputation - 2, 0);
            }
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function _max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    // ============ Receive Function ============

    receive() external payable {
        revert("Direct transfers not allowed");
    }
}
