// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AuctionHouse is Ownable, ReentrancyGuard {
    enum AuctionStatus {
        Active,
        Resolved,
        Canceled
    }

    enum DisputeStatus {
        None,
        Raised,
        Resolved
    }

    struct Auction {
        address payable seller;
        string itemDetails;
        uint256 minBid;
        uint256 deadline;
        uint256 buyNowPrice;
        address highestBidder;
        uint256 highestBid;
        AuctionStatus status;
        DisputeStatus disputeStatus;
        address arbitrator;
    }

    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCount;

    event AuctionCreated(
        uint256 _auctionId,
        address _seller,
        string _itemDetails,
        uint256 _minBid,
        uint256 _deadline,
        uint256 _buyNowPrice
    );

    error InvalidItemDetails();
    error InvalidMinimumBid();
    error InvalidAuctionDeadline();
    error InvalidBuyNowPrice();

    /**
     * @notice Empty constructor
     */
    constructor() Ownable(msg.sender) {}

    function createAuction(
        string calldata _itemDetails,
        uint256 _minBid,
        uint256 _deadline,
        uint256 _buyNowPrice
    ) external {
        if (bytes(_itemDetails).length == 0) revert InvalidItemDetails();
        if (_minBid <= 0) revert InvalidMinimumBid();
        if (_deadline <= block.timestamp) revert InvalidAuctionDeadline();
        if (_buyNowPrice != 0 && _buyNowPrice <= _minBid)
            revert InvalidBuyNowPrice();

        auctionCount++;

        auctions[auctionCount] = Auction({
            seller: payable(msg.sender),
            itemDetails: _itemDetails,
            minBid: _minBid,
            buyNowPrice: _buyNowPrice,
            deadline: _deadline,
            highestBidder: address(0),
            highestBid: 0,
            status: AuctionStatus.Active,
            disputeStatus: DisputeStatus.None,
            arbitrator: address(0)
        });

        emit AuctionCreated(
            auctionCount,
            msg.sender,
            _itemDetails,
            _minBid,
            _deadline,
            _buyNowPrice
        );
    }
}
