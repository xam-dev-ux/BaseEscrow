// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BaseEscrow
 * @dev Decentralized escrow system for secure P2P transactions on Base
 * @notice Main contract for managing escrow transactions with dispute resolution
 */
contract BaseEscrow is ReentrancyGuard, Pausable, Ownable {

    // ============ Enums ============

    enum TransactionStatus {
        Created,        // Transaction created, awaiting funding
        Funded,         // Buyer has deposited funds
        ShipmentConfirmed, // Seller has confirmed shipment
        Completed,      // Buyer confirmed receipt, funds released
        InDispute,      // Dispute initiated by either party
        Cancelled,      // Transaction cancelled before funding
        Refunded,       // Funds returned to buyer
        DisputeResolved // Dispute resolved by arbitrators
    }

    enum Category {
        SecondHand,     // Used items
        Freelancing,    // Freelance services
        Services,       // General services
        Digital,        // Digital goods
        Other           // Other categories
    }

    // ============ Structs ============

    struct Transaction {
        uint256 id;
        address payable buyer;
        address payable seller;
        uint256 amount;
        uint256 protocolFee;
        string description;
        Category category;
        TransactionStatus status;
        uint256 createdAt;
        uint256 fundedAt;
        uint256 shipmentConfirmedAt;
        uint256 completedAt;
        uint256 buyerTimeout;    // Time limit for buyer to confirm receipt
        uint256 sellerTimeout;   // Time limit for seller to confirm shipment
        bool buyerRated;
        bool sellerRated;
    }

    struct Rating {
        uint8 score;        // 1-5 stars
        string comment;
        uint256 timestamp;
        uint256 transactionId;
    }

    struct UserProfile {
        uint256 totalTransactionsAsBuyer;
        uint256 totalTransactionsAsSeller;
        uint256 completedTransactions;
        uint256 disputedTransactions;
        uint256 totalRatingsReceived;
        uint256 ratingSum;
        bool exists;
    }

    // ============ State Variables ============

    uint256 public transactionCounter;
    uint256 public protocolFeePercentage; // in basis points (100 = 1%)
    uint256 public constant MAX_FEE = 500; // 5% max fee
    uint256 public constant MIN_TRANSACTION_AMOUNT = 0.001 ether;

    uint256 public buyerTimeoutDuration = 14 days;
    uint256 public sellerTimeoutDuration = 7 days;

    address public arbitrationContract;
    uint256 public totalFeesCollected;

    mapping(uint256 => Transaction) public transactions;
    mapping(address => uint256[]) public userTransactions;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => Rating[]) public userRatings;
    mapping(uint256 => bool) public disputeInitiated;

    // ============ Events ============

    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        Category category,
        string description
    );

    event TransactionFunded(
        uint256 indexed transactionId,
        address indexed buyer,
        uint256 amount,
        uint256 protocolFee
    );

    event ShipmentConfirmed(
        uint256 indexed transactionId,
        address indexed seller,
        uint256 timestamp
    );

    event ReceiptConfirmed(
        uint256 indexed transactionId,
        address indexed buyer,
        uint256 timestamp
    );

    event FundsReleased(
        uint256 indexed transactionId,
        address indexed seller,
        uint256 amount
    );

    event TransactionCancelled(
        uint256 indexed transactionId,
        address indexed canceller
    );

    event RefundIssued(
        uint256 indexed transactionId,
        address indexed buyer,
        uint256 amount
    );

    event DisputeInitiated(
        uint256 indexed transactionId,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed transactionId,
        address indexed winner,
        uint256 amount
    );

    event RatingSubmitted(
        uint256 indexed transactionId,
        address indexed rater,
        address indexed rated,
        uint8 score
    );

    event TimeoutClaimed(
        uint256 indexed transactionId,
        address indexed claimer,
        uint256 amount
    );

    event ArbitrationContractUpdated(address indexed newContract);
    event ProtocolFeeUpdated(uint256 newFee);
    event TimeoutDurationsUpdated(uint256 buyerTimeout, uint256 sellerTimeout);

    // ============ Modifiers ============

    modifier onlyBuyer(uint256 _transactionId) {
        require(
            msg.sender == transactions[_transactionId].buyer,
            "Only buyer can call this"
        );
        _;
    }

    modifier onlySeller(uint256 _transactionId) {
        require(
            msg.sender == transactions[_transactionId].seller,
            "Only seller can call this"
        );
        _;
    }

    modifier onlyParticipant(uint256 _transactionId) {
        require(
            msg.sender == transactions[_transactionId].buyer ||
            msg.sender == transactions[_transactionId].seller,
            "Only participants can call this"
        );
        _;
    }

    modifier onlyArbitration() {
        require(
            msg.sender == arbitrationContract,
            "Only arbitration contract can call this"
        );
        _;
    }

    modifier transactionExists(uint256 _transactionId) {
        require(
            _transactionId > 0 && _transactionId <= transactionCounter,
            "Transaction does not exist"
        );
        _;
    }

    modifier inStatus(uint256 _transactionId, TransactionStatus _status) {
        require(
            transactions[_transactionId].status == _status,
            "Invalid transaction status"
        );
        _;
    }

    // ============ Constructor ============

    constructor(uint256 _protocolFeePercentage) Ownable(msg.sender) {
        require(_protocolFeePercentage <= MAX_FEE, "Fee too high");
        protocolFeePercentage = _protocolFeePercentage;
    }

    // ============ Main Functions ============

    /**
     * @notice Create a new escrow transaction
     * @param _seller Address of the seller
     * @param _description Description of the transaction
     * @param _category Category of the transaction
     */
    function createTransaction(
        address payable _seller,
        string calldata _description,
        Category _category
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(_seller != address(0), "Invalid seller address");
        require(_seller != msg.sender, "Cannot create transaction with yourself");
        require(msg.value >= MIN_TRANSACTION_AMOUNT, "Amount too low");
        require(bytes(_description).length > 0, "Description required");
        require(bytes(_description).length <= 500, "Description too long");

        uint256 protocolFee = (msg.value * protocolFeePercentage) / 10000;
        uint256 escrowAmount = msg.value - protocolFee;

        transactionCounter++;
        uint256 transactionId = transactionCounter;

        transactions[transactionId] = Transaction({
            id: transactionId,
            buyer: payable(msg.sender),
            seller: _seller,
            amount: escrowAmount,
            protocolFee: protocolFee,
            description: _description,
            category: _category,
            status: TransactionStatus.Funded,
            createdAt: block.timestamp,
            fundedAt: block.timestamp,
            shipmentConfirmedAt: 0,
            completedAt: 0,
            buyerTimeout: block.timestamp + buyerTimeoutDuration,
            sellerTimeout: block.timestamp + sellerTimeoutDuration,
            buyerRated: false,
            sellerRated: false
        });

        // Update user profiles
        _initUserProfile(msg.sender);
        _initUserProfile(_seller);
        userProfiles[msg.sender].totalTransactionsAsBuyer++;
        userProfiles[_seller].totalTransactionsAsSeller++;

        // Track transactions
        userTransactions[msg.sender].push(transactionId);
        userTransactions[_seller].push(transactionId);

        totalFeesCollected += protocolFee;

        emit TransactionCreated(
            transactionId,
            msg.sender,
            _seller,
            escrowAmount,
            _category,
            _description
        );

        emit TransactionFunded(
            transactionId,
            msg.sender,
            escrowAmount,
            protocolFee
        );

        return transactionId;
    }

    /**
     * @notice Seller confirms shipment of goods/services
     * @param _transactionId ID of the transaction
     */
    function confirmShipment(uint256 _transactionId)
        external
        whenNotPaused
        transactionExists(_transactionId)
        onlySeller(_transactionId)
        inStatus(_transactionId, TransactionStatus.Funded)
    {
        Transaction storage txn = transactions[_transactionId];
        txn.status = TransactionStatus.ShipmentConfirmed;
        txn.shipmentConfirmedAt = block.timestamp;
        txn.buyerTimeout = block.timestamp + buyerTimeoutDuration;

        emit ShipmentConfirmed(_transactionId, msg.sender, block.timestamp);
    }

    /**
     * @notice Buyer confirms receipt and releases funds to seller
     * @param _transactionId ID of the transaction
     */
    function confirmReceipt(uint256 _transactionId)
        external
        whenNotPaused
        nonReentrant
        transactionExists(_transactionId)
        onlyBuyer(_transactionId)
        inStatus(_transactionId, TransactionStatus.ShipmentConfirmed)
    {
        Transaction storage txn = transactions[_transactionId];
        txn.status = TransactionStatus.Completed;
        txn.completedAt = block.timestamp;

        userProfiles[txn.buyer].completedTransactions++;
        userProfiles[txn.seller].completedTransactions++;

        emit ReceiptConfirmed(_transactionId, msg.sender, block.timestamp);

        // Transfer funds to seller
        (bool success, ) = txn.seller.call{value: txn.amount}("");
        require(success, "Transfer to seller failed");

        emit FundsReleased(_transactionId, txn.seller, txn.amount);
    }

    /**
     * @notice Cancel transaction before shipment confirmation
     * @param _transactionId ID of the transaction
     */
    function cancelTransaction(uint256 _transactionId)
        external
        whenNotPaused
        nonReentrant
        transactionExists(_transactionId)
        onlyParticipant(_transactionId)
    {
        Transaction storage txn = transactions[_transactionId];
        require(
            txn.status == TransactionStatus.Funded,
            "Can only cancel funded transactions"
        );

        txn.status = TransactionStatus.Cancelled;

        emit TransactionCancelled(_transactionId, msg.sender);

        // Refund buyer (minus protocol fee which is already collected)
        (bool success, ) = txn.buyer.call{value: txn.amount}("");
        require(success, "Refund failed");

        emit RefundIssued(_transactionId, txn.buyer, txn.amount);
    }

    /**
     * @notice Initiate a dispute for a transaction
     * @param _transactionId ID of the transaction
     * @param _reason Reason for the dispute
     */
    function initiateDispute(uint256 _transactionId, string calldata _reason)
        external
        whenNotPaused
        transactionExists(_transactionId)
        onlyParticipant(_transactionId)
    {
        Transaction storage txn = transactions[_transactionId];
        require(
            txn.status == TransactionStatus.Funded ||
            txn.status == TransactionStatus.ShipmentConfirmed,
            "Cannot dispute in current status"
        );
        require(!disputeInitiated[_transactionId], "Dispute already initiated");
        require(bytes(_reason).length > 0, "Reason required");
        require(bytes(_reason).length <= 1000, "Reason too long");

        txn.status = TransactionStatus.InDispute;
        disputeInitiated[_transactionId] = true;

        userProfiles[txn.buyer].disputedTransactions++;
        userProfiles[txn.seller].disputedTransactions++;

        emit DisputeInitiated(_transactionId, msg.sender, _reason);
    }

    /**
     * @notice Seller claims funds after buyer timeout
     * @param _transactionId ID of the transaction
     */
    function claimAfterBuyerTimeout(uint256 _transactionId)
        external
        whenNotPaused
        nonReentrant
        transactionExists(_transactionId)
        onlySeller(_transactionId)
        inStatus(_transactionId, TransactionStatus.ShipmentConfirmed)
    {
        Transaction storage txn = transactions[_transactionId];
        require(
            block.timestamp > txn.buyerTimeout,
            "Timeout not reached"
        );

        txn.status = TransactionStatus.Completed;
        txn.completedAt = block.timestamp;

        userProfiles[txn.buyer].completedTransactions++;
        userProfiles[txn.seller].completedTransactions++;

        emit TimeoutClaimed(_transactionId, msg.sender, txn.amount);

        (bool success, ) = txn.seller.call{value: txn.amount}("");
        require(success, "Transfer to seller failed");

        emit FundsReleased(_transactionId, txn.seller, txn.amount);
    }

    /**
     * @notice Buyer claims refund after seller timeout (no shipment)
     * @param _transactionId ID of the transaction
     */
    function claimAfterSellerTimeout(uint256 _transactionId)
        external
        whenNotPaused
        nonReentrant
        transactionExists(_transactionId)
        onlyBuyer(_transactionId)
        inStatus(_transactionId, TransactionStatus.Funded)
    {
        Transaction storage txn = transactions[_transactionId];
        require(
            block.timestamp > txn.sellerTimeout,
            "Timeout not reached"
        );

        txn.status = TransactionStatus.Refunded;

        emit TimeoutClaimed(_transactionId, msg.sender, txn.amount);

        (bool success, ) = txn.buyer.call{value: txn.amount}("");
        require(success, "Refund failed");

        emit RefundIssued(_transactionId, txn.buyer, txn.amount);
    }

    /**
     * @notice Submit a rating for the other party
     * @param _transactionId ID of the transaction
     * @param _score Rating score (1-5)
     * @param _comment Optional comment
     */
    function submitRating(
        uint256 _transactionId,
        uint8 _score,
        string calldata _comment
    )
        external
        transactionExists(_transactionId)
        onlyParticipant(_transactionId)
    {
        Transaction storage txn = transactions[_transactionId];
        require(
            txn.status == TransactionStatus.Completed ||
            txn.status == TransactionStatus.DisputeResolved,
            "Transaction not completed"
        );
        require(_score >= 1 && _score <= 5, "Score must be 1-5");
        require(bytes(_comment).length <= 500, "Comment too long");

        address rated;
        if (msg.sender == txn.buyer) {
            require(!txn.buyerRated, "Already rated");
            txn.buyerRated = true;
            rated = txn.seller;
        } else {
            require(!txn.sellerRated, "Already rated");
            txn.sellerRated = true;
            rated = txn.buyer;
        }

        Rating memory newRating = Rating({
            score: _score,
            comment: _comment,
            timestamp: block.timestamp,
            transactionId: _transactionId
        });

        userRatings[rated].push(newRating);
        userProfiles[rated].totalRatingsReceived++;
        userProfiles[rated].ratingSum += _score;

        emit RatingSubmitted(_transactionId, msg.sender, rated, _score);
    }

    // ============ Arbitration Functions ============

    /**
     * @notice Resolve dispute - called by arbitration contract
     * @param _transactionId ID of the transaction
     * @param _winner Address of the winner (buyer or seller)
     */
    function resolveDispute(uint256 _transactionId, address _winner)
        external
        nonReentrant
        onlyArbitration
        transactionExists(_transactionId)
        inStatus(_transactionId, TransactionStatus.InDispute)
    {
        Transaction storage txn = transactions[_transactionId];
        require(
            _winner == txn.buyer || _winner == txn.seller,
            "Winner must be participant"
        );

        txn.status = TransactionStatus.DisputeResolved;
        txn.completedAt = block.timestamp;

        emit DisputeResolved(_transactionId, _winner, txn.amount);

        if (_winner == txn.buyer) {
            (bool success, ) = txn.buyer.call{value: txn.amount}("");
            require(success, "Transfer to buyer failed");
            emit RefundIssued(_transactionId, txn.buyer, txn.amount);
        } else {
            (bool success, ) = txn.seller.call{value: txn.amount}("");
            require(success, "Transfer to seller failed");
            emit FundsReleased(_transactionId, txn.seller, txn.amount);
        }
    }

    // ============ View Functions ============

    function getTransaction(uint256 _transactionId)
        external
        view
        returns (Transaction memory)
    {
        return transactions[_transactionId];
    }

    function getUserTransactions(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userTransactions[_user];
    }

    function getUserProfile(address _user)
        external
        view
        returns (UserProfile memory)
    {
        return userProfiles[_user];
    }

    function getUserRatings(address _user)
        external
        view
        returns (Rating[] memory)
    {
        return userRatings[_user];
    }

    function getAverageRating(address _user)
        external
        view
        returns (uint256)
    {
        UserProfile memory profile = userProfiles[_user];
        if (profile.totalRatingsReceived == 0) return 0;
        return (profile.ratingSum * 100) / profile.totalRatingsReceived;
    }

    function calculateProtocolFee(uint256 _amount)
        external
        view
        returns (uint256)
    {
        return (_amount * protocolFeePercentage) / 10000;
    }

    // ============ Admin Functions ============

    function setArbitrationContract(address _arbitrationContract)
        external
        onlyOwner
    {
        require(_arbitrationContract != address(0), "Invalid address");
        arbitrationContract = _arbitrationContract;
        emit ArbitrationContractUpdated(_arbitrationContract);
    }

    function setProtocolFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        protocolFeePercentage = _newFee;
        emit ProtocolFeeUpdated(_newFee);
    }

    function setTimeoutDurations(
        uint256 _buyerTimeout,
        uint256 _sellerTimeout
    ) external onlyOwner {
        require(_buyerTimeout >= 1 days, "Buyer timeout too short");
        require(_sellerTimeout >= 1 days, "Seller timeout too short");
        buyerTimeoutDuration = _buyerTimeout;
        sellerTimeoutDuration = _sellerTimeout;
        emit TimeoutDurationsUpdated(_buyerTimeout, _sellerTimeout);
    }

    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    function _initUserProfile(address _user) internal {
        if (!userProfiles[_user].exists) {
            userProfiles[_user].exists = true;
        }
    }

    // ============ Receive Function ============

    receive() external payable {
        revert("Direct transfers not allowed");
    }
}
