// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

/**
 * @title AuctionHouse
 * @author kyrers
 * @notice A simple auction house that locks funds until the auction is resolved.
 */
contract AuctionHouse is Ownable, ReentrancyGuard {
    enum AuctionStatus {
        Active,
        Finished,
        Resolved
    }

    enum DisputeStatus {
        None,
        Raised,
        Resolved
    }
    struct Auction {
        string itemDetails;
        uint256 minBid;
        uint256 deadline;
        uint256 buyNowPrice;
        uint256 highestBid;
        address payable seller;
        address highestBidder;
        AuctionStatus status;
        DisputeStatus disputeStatus;
    }

    uint32 public constant AUCTION_EXTENSION_TIME = 300;
    uint256 public constant AUCTION_HOUSE_FEE = 2;
    IERC20 public paymentToken;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => uint256)) public auctionBids;
    uint256 public auctionCount;
    address public arbitrator;

    event AuctionCreated(
        address indexed seller,
        string itemDetails,
        uint256 indexed auctionId,
        uint256 minBid,
        uint256 deadline,
        uint256 buyNowPrice
    );

    event AuctionDeadlineExtended(
        uint256 indexed auctionId,
        uint256 newDeadline
    );

    event AuctionResolved(
        uint256 indexed auctionId,
        uint256 highestBid,
        address indexed highestBidder
    );

    event BidPlaced(
        uint256 indexed auctionId,
        uint256 newHighestBid,
        address indexed newHighestBidder
    );

    event BuyNowCompleted(
        uint256 indexed auctionId,
        uint256 buyNowPrice,
        address indexed buyer
    );

    event DisputeRaised(uint256 indexed auctionId, address indexed disputer);
    event DisputeResolved(
        uint256 indexed auctionId,
        bool releaseFundsToSeller,
        address indexed seller,
        address indexed disputer
    );

    event RefundProcessed(
        uint256 indexed auctionId,
        uint256 amount,
        address indexed to
    );

    error AuctionAlreadyResolved();
    error AuctionBeingDisputed();
    error AuctionDeadlineHasPassed();
    error AuctionDeadlineNotReached();
    error AuctionNotResolved();
    error AuctionNoLongerActive();
    error AuctionWinnerCannotClaimFunds();
    error BuyNowNotAvailable();
    error DisputeAlreadyRaised();
    error InvalidArbitratorAddress();
    error InvalidAuctionId();
    error InvalidPaymentTokenAddress();
    error InvalidAuctionDeadline();
    error InvalidBidAmount();
    error InvalidBuyNowPrice();
    error InvalidItemDetails();
    error InvalidMinimumBid();
    error NoBidOrFundsClaimedAlready();
    error NoDisputeRaised();
    error NotTheArbitrator();
    error NotTheHighestBidder();
    error NotTheSeller();

    modifier canBeDisputed(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.status == AuctionStatus.Resolved)
            revert AuctionAlreadyResolved();
        if (auction.disputeStatus != DisputeStatus.None)
            revert DisputeAlreadyRaised();
        _;
    }

    modifier canClaimFunds(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.status != AuctionStatus.Resolved)
            revert AuctionNotResolved();
        if (auction.highestBidder == msg.sender)
            revert AuctionWinnerCannotClaimFunds();
        if (auctionBids[auctionId][msg.sender] == 0)
            revert NoBidOrFundsClaimedAlready();
        _;
    }

    modifier isAcceptingBids(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.status != AuctionStatus.Active)
            revert AuctionNoLongerActive();
        if (auction.deadline < block.timestamp)
            revert AuctionDeadlineHasPassed();
        _;
    }

    modifier isBuyNowPossible(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        uint256 buyNowPrice = auction.buyNowPrice;
        if (buyNowPrice == 0) revert BuyNowNotAvailable();
        _;
    }

    modifier isPastDeadline(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.deadline >= block.timestamp)
            revert AuctionDeadlineNotReached();
        _;
    }

    modifier isValidAuction(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.seller == address(0)) revert InvalidAuctionId();
        _;
    }

    modifier onlyArbitrator() {
        if (msg.sender != arbitrator) revert NotTheArbitrator();
        _;
    }
    modifier onlyHighestBidder(uint256 auctionId) {
        if (msg.sender != auctions[auctionId].highestBidder)
            revert NotTheHighestBidder();
        _;
    }

    /**
     * @param paymentToken_ The token in which payments will be handled.
     * @param arbitrator_  The default arbitrator address.
     */
    constructor(
        address paymentToken_,
        address arbitrator_
    ) Ownable(msg.sender) {
        if (paymentToken_ == address(0)) revert InvalidPaymentTokenAddress();
        if (arbitrator_ == address(0)) revert InvalidArbitratorAddress();

        paymentToken = IERC20(paymentToken_);
        arbitrator = arbitrator_;
    }

    /**
     * @notice Create a new auction.
     * @dev The buyNowPrice is optional. 0 represents no buyNowPrice available.
     * @param itemDetails A string representing an item.
     * @param minBid The minimum bid accepted.
     * @param deadline When will the auction end.
     * @param buyNowPrice The buy now price (optional).
     */
    function createAuction(
        string calldata itemDetails,
        uint256 minBid,
        uint256 deadline,
        uint256 buyNowPrice
    ) external {
        if (bytes(itemDetails).length == 0) revert InvalidItemDetails();
        if (minBid <= 0) revert InvalidMinimumBid();
        if (deadline <= block.timestamp) revert InvalidAuctionDeadline();
        if (buyNowPrice != 0 && buyNowPrice <= minBid)
            revert InvalidBuyNowPrice();

        auctionCount++;

        auctions[auctionCount] = Auction({
            itemDetails: itemDetails,
            minBid: minBid,
            deadline: deadline,
            buyNowPrice: buyNowPrice,
            highestBid: 0,
            seller: payable(msg.sender),
            highestBidder: address(0),
            status: AuctionStatus.Active,
            disputeStatus: DisputeStatus.None
        });

        emit AuctionCreated(
            msg.sender,
            itemDetails,
            auctionCount,
            minBid,
            deadline,
            buyNowPrice
        );
    }

    /**
     * @notice Place a bid on an valid auction.
     * @dev If called with a bidAmount that equals or surpasses the auction buyNowPrice, it will be treated as a buy now. Additionally, users can increase their bids.
     * @param auctionId The id of the auction
     * @param bidAmount The bid amount
     */
    function placeBid(
        uint256 auctionId,
        uint256 bidAmount
    )
        external
        nonReentrant
        isValidAuction(auctionId)
        isAcceptingBids(auctionId)
    {
        Auction storage auction = auctions[auctionId];

        if (bidAmount <= auction.highestBid || bidAmount < auction.minBid)
            revert InvalidBidAmount();

        // Check if the new user bid meets the buy now price
        if (auction.buyNowPrice > 0 && bidAmount >= auction.buyNowPrice) {
            _buyNow(auctionId);
            return;
        }

        // Prevent last-second bidding by extending the deadline by 5 minutes if bid is placed within the last 5 minutes
        uint256 auctionTimeRemaining = auction.deadline - block.timestamp;
        if (auctionTimeRemaining <= AUCTION_EXTENSION_TIME) {
            auction.deadline += AUCTION_EXTENSION_TIME;
        }

        // Get the user current bid
        uint256 currentBid = auctionBids[auctionId][msg.sender];

        auctionBids[auctionId][msg.sender] = bidAmount;
        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;

        // Calculate needed amount so we don't lock unnecessary user tokens
        uint256 neededAmount = bidAmount - currentBid;
        paymentToken.transferFrom(msg.sender, address(this), neededAmount);

        emit BidPlaced(auctionId, auction.highestBid, auction.highestBidder);
        emit AuctionDeadlineExtended(auctionId, auction.deadline);
    }

    /**
     * @notice Ensure no one will outbid you.
     * @dev No more bids will be accepted, but the auction won't be resolved.
     * @param auctionId The auction id.
     */
    function buyNow(
        uint256 auctionId
    )
        external
        nonReentrant
        isValidAuction(auctionId)
        isAcceptingBids(auctionId)
    {
        _buyNow(auctionId);
    }

    /**
     * @notice Resolve an auction. The house takes a 2% fee.
     * @dev Only the seller can do this and under certain conditions.
     * @param auctionId The auction id.
     */
    function resolveAuction(
        uint256 auctionId
    )
        external
        nonReentrant
        isValidAuction(auctionId)
        isPastDeadline(auctionId)
    {
        Auction storage auction = auctions[auctionId];

        if (msg.sender != auction.seller) {
            revert NotTheSeller();
        }

        if (auction.status == AuctionStatus.Resolved) {
            revert AuctionAlreadyResolved();
        }

        if (auction.disputeStatus == DisputeStatus.Raised) {
            revert AuctionBeingDisputed();
        }

        auction.status = AuctionStatus.Resolved;

        if (auction.highestBid > 0) {
            // Simulate transferring the item by clearing the details
            auction.itemDetails = "";

            // Transfer the funds to the seller but take a 2% fee
            uint256 fee = (auction.highestBid * AUCTION_HOUSE_FEE) / 100;
            uint256 sellerAmount = auction.highestBid - fee;
            paymentToken.transfer(auction.seller, sellerAmount);
        }

        emit AuctionResolved(
            auctionId,
            auction.highestBid,
            auction.highestBidder
        );
    }

    /**
     * @notice Raise a dispute for an auction.
     * @dev Only the highest bidder can do this.
     * @param auctionId The auction id.
     */
    function raiseDispute(
        uint256 auctionId
    )
        external
        isValidAuction(auctionId)
        isPastDeadline(auctionId)
        onlyHighestBidder(auctionId)
        canBeDisputed(auctionId)
    {
        Auction storage auction = auctions[auctionId];

        auction.disputeStatus = DisputeStatus.Raised;

        emit DisputeRaised(auctionId, msg.sender);
    }

    /**
     * @notice Allow a predefined arbitrator to resolve an ongoing dispute.
     * @dev If the funds are sent to the seller, the highest bidder will always receive his item.
     * @param auctionId The auction id.
     * @param releaseFundsToSeller Whether or not the funds should be sent to the seller.
     */
    function resolveDispute(
        uint256 auctionId,
        bool releaseFundsToSeller
    ) external isValidAuction(auctionId) onlyArbitrator {
        Auction storage auction = auctions[auctionId];

        if (auction.disputeStatus != DisputeStatus.Raised)
            revert NoDisputeRaised();

        auction.status = AuctionStatus.Resolved;
        auction.disputeStatus = DisputeStatus.Resolved;

        if (releaseFundsToSeller) {
            // Simulate transferring the item by clearing the details
            auction.itemDetails = "";

            // Transfer the funds to the seller but take a 2% fee
            uint256 fee = (auction.highestBid * AUCTION_HOUSE_FEE) / 100;
            uint256 sellerAmount = auction.highestBid - fee;
            paymentToken.transfer(auction.seller, sellerAmount);
        } else {
            // Refund the highest bidder entirely
            paymentToken.transfer(auction.highestBidder, auction.highestBid);
        }

        emit DisputeResolved(
            auctionId,
            releaseFundsToSeller,
            auction.seller,
            auction.highestBidder
        );

        emit AuctionResolved(
            auctionId,
            auction.highestBid,
            auction.highestBidder
        );
    }

    /**
     * @notice Retrieve your funds if you didn't win the auction.
     * @param auctionId The auction id.
     */
    function refund(
        uint256 auctionId
    ) external isValidAuction(auctionId) canClaimFunds(auctionId) {
        uint256 bidAmount = auctionBids[auctionId][msg.sender];

        auctionBids[auctionId][msg.sender] = 0;
        paymentToken.transfer(msg.sender, bidAmount);

        emit RefundProcessed(auctionId, bidAmount, msg.sender);
    }

    /**
     * @notice Get all the details of a given auction.
     * @param auctionId The auction id.
     */
    function getAuctionDetails(
        uint256 auctionId
    ) external view isValidAuction(auctionId) returns (Auction memory auction) {
        auction = auctions[auctionId];
    }

    /**
     * @dev Takes the user current bid into consideration so we only get the tokens needed to equal the auction buyNow price.
     * @param _auctionId The auction id.
     */
    function _buyNow(uint256 _auctionId) private isBuyNowPossible(_auctionId) {
        Auction storage auction = auctions[_auctionId];

        //Get the user current bid
        uint256 currentBid = auctionBids[_auctionId][msg.sender];

        auction.status = AuctionStatus.Finished;
        auction.highestBidder = msg.sender;
        auction.highestBid = auction.buyNowPrice;

        //Calculate needed amount so we don't lock unnecessary user tokens
        uint256 neededAmount = auction.buyNowPrice - currentBid;
        paymentToken.transferFrom(msg.sender, address(this), neededAmount);

        emit BuyNowCompleted(_auctionId, auction.buyNowPrice, msg.sender);
    }
}
