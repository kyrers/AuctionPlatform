import { expect } from "chai";
import { ethers } from "hardhat";

const FIRST_AUCTION_ID = 1;
const FIRST_AUCTION_ITEM_DETAILS = "Item 1";
const FIRST_AUCTION_MIN_BID = ethers.parseUnits("10", 18);
const FIRST_AUCTION_BUY_NOW_PRICE = ethers.parseUnits("20", 18);

const SECOND_AUCTION_ID = 2;
const SECOND_AUCTION_ITEM_DETAILS = "Item 2";
const SECOND_AUCTION_MIN_BID = ethers.parseUnits("30", 18);

const THIRD_AUCTION_ID = 3;
const THIRD_AUCTION_ITEM_DETAILS = "Item 3";
const THIRD_AUCTION_MIN_BID = ethers.parseUnits("50", 18);
const THIRD_AUCTION_BUY_NOW_PRICE = ethers.parseUnits("200", 18);

const FOURTH_AUCTION_ID = 4;
const FOURTH_AUCTION_ITEM_DETAILS = "Item 4";
const FOURTH_AUCTION_MIN_BID = ethers.parseUnits("100", 18);
const FOURTH_AUCTION_BUY_NOW_PRICE = ethers.parseUnits("200", 18);

const FIFTH_AUCTION_ID = 5;
const FIFTH_AUCTION_ITEM_DETAILS = "Item 5";
const FIFTH_AUCTION_MIN_BID = ethers.parseUnits("100", 18);
const FIFTH_AUCTION_BUY_NOW_PRICE = ethers.parseUnits("2000", 18);

const EMPTY_AUCTION_ID = 6;
const EMPTY_AUCTION_ITEM_DETAILS = "Empty Item";
const EMPTY_AUCTION_MIN_BID = ethers.parseUnits("10", 18);
const EMPTY_AUCTION_BUY_NOW_PRICE = ethers.parseUnits("100", 18);

describe("### AuctionHouse Contract ###", function () {
  let tokenContract: any;
  let auctionHouseContract: any;
  let owner: any;
  let bidder1: any;
  let bidder2: any;
  let arbitrator: any;
  let latestBlockTimestamp: number;
  let firstAuctionDeadline: number;
  let secondAuctionDeadline: number;
  let thirdAuctionDeadline: number;
  let fourthAuctionDeadline: number;
  let fifthAuctionDeadline: number;
  let emptyAuctionDeadline: number;

  before(async function () {
    [owner, bidder1, bidder2, arbitrator] = await ethers.getSigners();
    const ahtFactory = await ethers.getContractFactory("AuctionHouseToken");
    tokenContract = await ahtFactory.deploy("AuctionHouseToken", "AHT");

    const ahFactory = await ethers.getContractFactory("AuctionHouse");
    auctionHouseContract = await ahFactory.deploy(
      tokenContract.target,
      arbitrator.address
    );

    await tokenContract.mint(bidder1.address, ethers.parseUnits("1000", 18));
    await tokenContract.mint(bidder2.address, ethers.parseUnits("1000", 18));

    const latestBlock = await ethers.provider.getBlock("latest");
    if (!latestBlock) {
      throw new Error("Failed to fetch the latest block");
    }
    latestBlockTimestamp = latestBlock.timestamp;
    firstAuctionDeadline = latestBlockTimestamp + 1800;
    secondAuctionDeadline = latestBlockTimestamp + 7200;
    thirdAuctionDeadline = latestBlockTimestamp + 14400;
    fourthAuctionDeadline = latestBlockTimestamp + 28800;
    fifthAuctionDeadline = latestBlockTimestamp + 57600;
    emptyAuctionDeadline = latestBlockTimestamp + 14400;
  });

  /* DEPLOYMENT */
  describe("# DEPLOYMENT #", function () {
    it("Should set owner to msg.sender", async function () {
      const contractOwner = await auctionHouseContract.owner();
      expect(owner.address).to.equal(contractOwner);
    });

    it("should deploy the AuctionHouseContract with the AuctionHouseToken", async function () {
      expect(await auctionHouseContract.paymentToken()).to.equal(
        tokenContract.target
      );
    });
  });

  /* CREATE AUCTION */
  describe("# CREATE AUCTION #", function () {
    it("Should create an auction with valid parameters", async function () {
      await expect(
        auctionHouseContract.createAuction(
          FIRST_AUCTION_ITEM_DETAILS,
          FIRST_AUCTION_MIN_BID,
          firstAuctionDeadline,
          FIRST_AUCTION_BUY_NOW_PRICE
        )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          owner.address,
          FIRST_AUCTION_ITEM_DETAILS,
          FIRST_AUCTION_ID,
          FIRST_AUCTION_MIN_BID,
          firstAuctionDeadline,
          FIRST_AUCTION_BUY_NOW_PRICE
        );
    });

    it("Should create an auction with no Buy Now price", async function () {
      await expect(
        auctionHouseContract.createAuction(
          SECOND_AUCTION_ITEM_DETAILS,
          SECOND_AUCTION_MIN_BID,
          secondAuctionDeadline,
          0
        )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          owner.address,
          SECOND_AUCTION_ITEM_DETAILS,
          SECOND_AUCTION_ID,
          SECOND_AUCTION_MIN_BID,
          secondAuctionDeadline,
          0
        );
    });

    it("Should create a third, fourth, fifth, and empty, auction with valid parameters", async function () {
      await expect(
        auctionHouseContract
          .connect(bidder1)
          .createAuction(
            THIRD_AUCTION_ITEM_DETAILS,
            THIRD_AUCTION_MIN_BID,
            thirdAuctionDeadline,
            THIRD_AUCTION_BUY_NOW_PRICE
          )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          bidder1.address,
          THIRD_AUCTION_ITEM_DETAILS,
          THIRD_AUCTION_ID,
          THIRD_AUCTION_MIN_BID,
          thirdAuctionDeadline,
          THIRD_AUCTION_BUY_NOW_PRICE
        );

      await expect(
        auctionHouseContract.createAuction(
          FOURTH_AUCTION_ITEM_DETAILS,
          FOURTH_AUCTION_MIN_BID,
          fourthAuctionDeadline,
          FOURTH_AUCTION_BUY_NOW_PRICE
        )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          owner.address,
          FOURTH_AUCTION_ITEM_DETAILS,
          FOURTH_AUCTION_ID,
          FOURTH_AUCTION_MIN_BID,
          fourthAuctionDeadline,
          FOURTH_AUCTION_BUY_NOW_PRICE
        );

      await expect(
        auctionHouseContract.createAuction(
          FIFTH_AUCTION_ITEM_DETAILS,
          FIFTH_AUCTION_MIN_BID,
          fifthAuctionDeadline,
          FIFTH_AUCTION_BUY_NOW_PRICE
        )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          owner.address,
          FIFTH_AUCTION_ITEM_DETAILS,
          FIFTH_AUCTION_ID,
          FIFTH_AUCTION_MIN_BID,
          fifthAuctionDeadline,
          FIFTH_AUCTION_BUY_NOW_PRICE
        );

      await expect(
        auctionHouseContract
          .connect(bidder2)
          .createAuction(
            EMPTY_AUCTION_ITEM_DETAILS,
            EMPTY_AUCTION_MIN_BID,
            emptyAuctionDeadline,
            EMPTY_AUCTION_BUY_NOW_PRICE
          )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          bidder2.address,
          EMPTY_AUCTION_ITEM_DETAILS,
          EMPTY_AUCTION_ID,
          EMPTY_AUCTION_MIN_BID,
          emptyAuctionDeadline,
          EMPTY_AUCTION_BUY_NOW_PRICE
        );
    });

    it("Should revert because the item details is an empty string", async function () {
      const invalidItemDetails = "";

      await expect(
        auctionHouseContract.createAuction(
          invalidItemDetails,
          FIRST_AUCTION_MIN_BID,
          firstAuctionDeadline,
          FIRST_AUCTION_BUY_NOW_PRICE
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidItemDetails"
      );
    });

    it("Should revert because the minimum bid is 0", async function () {
      await expect(
        auctionHouseContract.createAuction(
          FIRST_AUCTION_ITEM_DETAILS,
          0,
          firstAuctionDeadline,
          FIRST_AUCTION_BUY_NOW_PRICE
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidMinimumBid"
      );
    });

    it("Should revert because the deadline is in the past", async function () {
      const invalidAuctionDeadline = latestBlockTimestamp - 1000;

      await expect(
        auctionHouseContract.createAuction(
          FIRST_AUCTION_ITEM_DETAILS,
          FIRST_AUCTION_MIN_BID,
          invalidAuctionDeadline,
          FIRST_AUCTION_BUY_NOW_PRICE
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidAuctionDeadline"
      );
    });

    it("Should revert because the deadline is immediate", async function () {
      const invalidAuctionDeadline = latestBlockTimestamp;

      await expect(
        auctionHouseContract.createAuction(
          FIRST_AUCTION_ITEM_DETAILS,
          FIRST_AUCTION_MIN_BID,
          invalidAuctionDeadline,
          FIRST_AUCTION_BUY_NOW_PRICE
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidAuctionDeadline"
      );
    });

    it("Should revert because the buyNowPrice is less than the minBid", async function () {
      const invalidBuyNowPrice = ethers.parseUnits("5", 18);

      await expect(
        auctionHouseContract.createAuction(
          FIRST_AUCTION_ITEM_DETAILS,
          FIRST_AUCTION_MIN_BID,
          firstAuctionDeadline,
          invalidBuyNowPrice
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidBuyNowPrice"
      );
    });

    it("Should revert because the buyNowPrice is equal to the minBid", async function () {
      await expect(
        auctionHouseContract.createAuction(
          FIRST_AUCTION_ITEM_DETAILS,
          FIRST_AUCTION_MIN_BID,
          firstAuctionDeadline,
          FIRST_AUCTION_MIN_BID
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidBuyNowPrice"
      );
    });
  });

  /* PLACE BID AND BUY NOW */
  describe("# PLACE BID AND BUY NOW #", function () {
    describe("> USING AN INEXISTENT AUCTION ID", function () {
      it("Placing a bid should revert because the auction id is invalid", async function () {
        const bidAmount = ethers.parseUnits("10", 18);

        await expect(
          auctionHouseContract.connect(bidder1).placeBid(100, bidAmount)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });

      it("Buy now should revert because the auction id is invalid", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).buyNow(100)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });
    });

    describe("> FIRST AUCTION", function () {
      it("Should revert because Bidder1 has not allowed any tokens to be used by the AuctionHouse", async function () {
        const bidAmount = ethers.parseUnits("10", 18);

        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(FIRST_AUCTION_ID, bidAmount)
        )
          .to.be.revertedWithCustomError(
            tokenContract,
            "ERC20InsufficientAllowance"
          )
          .withArgs(auctionHouseContract.target, 0, bidAmount);

        const auction = await auctionHouseContract.auctions(FIRST_AUCTION_ID);
        expect(auction.highestBid).to.equal(0);
        expect(auction.highestBidder).to.equal(ethers.ZeroAddress);
      });

      it("Should accept Bidder1 bid and set the highest bid and bidder", async function () {
        const bidAmount = ethers.parseUnits("12", 18);

        // Approve auctionHouseContract to spend 10000 tokens on behalf of bidder1
        await tokenContract
          .connect(bidder1)
          .approve(auctionHouseContract.target, ethers.parseUnits("10000", 18));

        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(FIRST_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(FIRST_AUCTION_ID, bidAmount, bidder1.address);

        const auction = await auctionHouseContract.auctions(FIRST_AUCTION_ID);
        expect(auction.highestBid).to.equal(bidAmount);
        expect(auction.highestBidder).to.equal(bidder1.address);
      });

      it("Should reject Bidder2 bid because it is lower than the minimum bid", async function () {
        const invalidBid = ethers.parseUnits("5", 18);

        // Approve auctionHouseContract to spend 1000 tokens on behalf of bidder2
        await tokenContract
          .connect(bidder2)
          .approve(auctionHouseContract.target, ethers.parseUnits("10000", 18));

        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(FIRST_AUCTION_ID, invalidBid)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidBidAmount"
        );
      });

      it("Should reject Bidder2 bid because it is less than the current highest bid", async function () {
        // Lower than the current highest bid of 12AHT
        const lowerBid = ethers.parseUnits("11", 18);

        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(FIRST_AUCTION_ID, lowerBid)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidBidAmount"
        );
      });

      it("Should keep Bidder1 as the leader and only transfer the difference as he is increasing his bid", async function () {
        const initialBalance = await tokenContract.balanceOf(bidder1.address);
        const topUpBid = ethers.parseUnits("14", 18);
        const difference = ethers.parseUnits("2", 18);

        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(FIRST_AUCTION_ID, topUpBid)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(FIRST_AUCTION_ID, topUpBid, bidder1.address);

        const finalBalance = await tokenContract.balanceOf(bidder1.address);
        expect(finalBalance).to.be.equal(initialBalance - difference);

        const auction = await auctionHouseContract.auctions(FIRST_AUCTION_ID);
        expect(auction.highestBid).to.equal(topUpBid);
        expect(auction.highestBidder).to.equal(bidder1.address);
      });

      it("Should make Bidder2 the leader because he has the highest bid", async function () {
        const bidAmount = ethers.parseUnits("15", 18);
        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(FIRST_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(FIRST_AUCTION_ID, bidAmount, bidder2.address);

        const auction = await auctionHouseContract.auctions(FIRST_AUCTION_ID);
        expect(auction.highestBid).to.equal(bidAmount);
        expect(auction.highestBidder).to.equal(bidder2.address);
      });

      it("Should extend the auction deadline by 5 minutes when a bid is placed in the last 5 minutes", async function () {
        const currentBlock = await ethers.provider.getBlock("latest");
        if (!currentBlock) {
          throw new Error("Failed to fetch the latest block");
        }

        const timeToIncrease =
          firstAuctionDeadline - currentBlock.timestamp - 250;
        await ethers.provider.send("evm_increaseTime", [timeToIncrease]);

        // Mine a new block to reflect the increased time
        await ethers.provider.send("evm_mine", []);

        const bidAmount = ethers.parseUnits("16", 18);
        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(FIRST_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(FIRST_AUCTION_ID, bidAmount, bidder1.address)
          .to.emit(auctionHouseContract, "AuctionDeadlineExtended")
          .withArgs(FIRST_AUCTION_ID, firstAuctionDeadline + 300);

        const newDeadline = (
          await auctionHouseContract.auctions(FIRST_AUCTION_ID)
        ).deadline;

        expect(newDeadline).to.equal(firstAuctionDeadline + 300);
      });

      it("Should revert because the auction deadline has passed", async function () {
        await ethers.provider.send("evm_increaseTime", [2500]);
        await ethers.provider.send("evm_mine", []);

        // Place a valid bid after the deadline has passed
        const bidAmount = ethers.parseUnits("17", 18);

        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(FIRST_AUCTION_ID, bidAmount)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionDeadlineHasPassed"
        );
      });
    });

    describe("> SECOND AUCTION", function () {
      it("Should not allow buyNow because no buyNowPrice was set", async function () {
        await expect(
          auctionHouseContract.connect(bidder2).buyNow(SECOND_AUCTION_ID)
        ).to.revertedWithCustomError(
          auctionHouseContract,
          "BuyNowNotAvailable"
        );
      });

      it("Should accept Bidder 2 bid and set the highest bid and bidder", async function () {
        const bidAmount = ethers.parseUnits("50", 18);

        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(SECOND_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(SECOND_AUCTION_ID, bidAmount, bidder2.address);

        const auction = await auctionHouseContract.auctions(SECOND_AUCTION_ID);
        expect(auction.highestBid).to.equal(bidAmount);
        expect(auction.highestBidder).to.equal(bidder2.address);
      });
    });

    describe("> THIRD AUCTION", function () {
      it("Should accept Bidder 1 bid and set the highest bid and bidder", async function () {
        const bidAmount = ethers.parseUnits("50", 18);

        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(THIRD_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(THIRD_AUCTION_ID, bidAmount, bidder1.address);

        const auction = await auctionHouseContract.auctions(THIRD_AUCTION_ID);
        expect(auction.highestBid).to.equal(bidAmount);
        expect(auction.highestBidder).to.equal(bidder1.address);
      });

      it("Should consider Bidder 2 bid as a buy now, since it meets the value", async function () {
        const bidAmount = ethers.parseUnits("200", 18);
        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(THIRD_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BuyNowCompleted")
          .withArgs(THIRD_AUCTION_ID, bidAmount, bidder2.address);

        const auction = await auctionHouseContract.auctions(THIRD_AUCTION_ID);
        expect(auction.highestBid).to.equal(bidAmount);
        expect(auction.highestBidder).to.equal(bidder2.address);
      });

      it("Should not accept further bids as the someone bidded the buyNow price", async function () {
        const bidAmount = ethers.parseUnits("60", 18);
        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(THIRD_AUCTION_ID, bidAmount)
        ).to.revertedWithCustomError(
          auctionHouseContract,
          "AuctionNoLongerActive"
        );
      });
    });

    describe("> FOURTH AUCTION", function () {
      it("Should allow buyNow", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).buyNow(FOURTH_AUCTION_ID)
        )
          .to.emit(auctionHouseContract, "BuyNowCompleted")
          .withArgs(
            FOURTH_AUCTION_ID,
            FOURTH_AUCTION_BUY_NOW_PRICE,
            bidder1.address
          );
      });

      it("Should not allow any user to call buyNow anymore because the auction has ended", async function () {
        await expect(
          auctionHouseContract.connect(bidder2).buyNow(FOURTH_AUCTION_ID)
        ).to.revertedWithCustomError(
          auctionHouseContract,
          "AuctionNoLongerActive"
        );
      });
    });

    describe("> FIFTH AUCTION", function () {
      it("Should revert in buyNow because of insufficient tokens", async function () {
        const balance = await tokenContract.balanceOf(bidder1.address);
        await expect(
          auctionHouseContract.connect(bidder1).buyNow(FIFTH_AUCTION_ID)
        )
          .to.be.revertedWithCustomError(
            tokenContract,
            "ERC20InsufficientBalance"
          )
          .withArgs(bidder1.address, balance, FIFTH_AUCTION_BUY_NOW_PRICE);
      });

      it("Should revert if the user places a bid equal to the buy now price because of insufficient tokens", async function () {
        const balance = await tokenContract.balanceOf(bidder2.address);
        await expect(
          auctionHouseContract
            .connect(bidder2)
            .placeBid(FIFTH_AUCTION_ID, FIFTH_AUCTION_BUY_NOW_PRICE)
        )
          .to.be.revertedWithCustomError(
            tokenContract,
            "ERC20InsufficientBalance"
          )
          .withArgs(bidder2.address, balance, FIFTH_AUCTION_BUY_NOW_PRICE);
      });

      it("Should still accept valid bids", async function () {
        const bidAmount = ethers.parseUnits("100", 18);
        await expect(
          auctionHouseContract
            .connect(bidder1)
            .placeBid(FIFTH_AUCTION_ID, bidAmount)
        )
          .to.emit(auctionHouseContract, "BidPlaced")
          .withArgs(FIFTH_AUCTION_ID, bidAmount, bidder1.address);

        const auction = await auctionHouseContract.auctions(FIFTH_AUCTION_ID);
        expect(auction.highestBid).to.equal(bidAmount);
        expect(auction.highestBidder).to.equal(bidder1.address);
      });
    });
  });

  /* RESOLVE AUCTION */
  describe("# RESOLVE AUCTION #", function () {
    describe("> USING THE THIRD AUCTION", function () {
      it("Should revert because the deadline has not passed", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).resolveAuction(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionDeadlineNotReached"
        );
      });

      it("Should revert because it isn't the seller trying to resolve the auction", async function () {
        await ethers.provider.send("evm_increaseTime", [14400]);
        await ethers.provider.send("evm_mine", []);

        await expect(
          auctionHouseContract.connect(bidder2).resolveAuction(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(auctionHouseContract, "NotTheSeller");
      });

      it("Should resolve the auction, take the 2% fee, and transfer the item to the winner", async function () {
        const initialBalance = await tokenContract.balanceOf(bidder1.address);

        await expect(
          auctionHouseContract.connect(bidder1).resolveAuction(THIRD_AUCTION_ID)
        )
          .to.emit(auctionHouseContract, "AuctionResolved")
          .withArgs(
            THIRD_AUCTION_ID,
            ethers.parseUnits("200", 18),
            bidder2.address
          );

        const finalBalance = await tokenContract.balanceOf(bidder1.address);
        expect(finalBalance).to.equal(
          initialBalance + ethers.parseUnits("196", 18)
        );

        const auction = await auctionHouseContract.auctions(THIRD_AUCTION_ID);
        expect(auction.itemDetails).to.equal("");
      });

      it("Should revert because the auction has already been resolved", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).resolveAuction(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionAlreadyResolved"
        );
      });
    });

    describe("> USING THE EMPTY AUCTION", function () {
      it("Should not transfer any funds or the item because the no bids were made", async function () {
        const initialBalance = await tokenContract.balanceOf(bidder2.address);

        await expect(
          auctionHouseContract.connect(bidder2).resolveAuction(EMPTY_AUCTION_ID)
        )
          .to.emit(auctionHouseContract, "AuctionResolved")
          .withArgs(EMPTY_AUCTION_ID, 0, ethers.ZeroAddress);

        const finalBalance = await tokenContract.balanceOf(bidder2.address);
        expect(finalBalance).to.equal(initialBalance);

        const auction = await auctionHouseContract.auctions(EMPTY_AUCTION_ID);
        expect(auction.itemDetails).to.equal(EMPTY_AUCTION_ITEM_DETAILS);
      });
    });

    describe("> USING AN INEXISTENT AUCTION ID", function () {
      it("Should revert because the auction id is invalid", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).resolveAuction(100)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });
    });
  });

  /* RAISE DISPUTE */
  describe("# RAISE DISPUTE #", function () {
    describe("> USING THE SECOND AUCTION ID", function () {
      it("Should raise a dispute", async function () {
        await expect(
          auctionHouseContract.connect(bidder2).raiseDispute(SECOND_AUCTION_ID)
        )
          .to.emit(auctionHouseContract, "DisputeRaised")
          .withArgs(SECOND_AUCTION_ID, bidder2.address);
      });
    });

    describe("> USING THE THIRD AUCTION", function () {
      it("Should revert because the auction has already been resolved", async function () {
        await expect(
          auctionHouseContract.connect(bidder2).raiseDispute(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionAlreadyResolved"
        );
      });
    });

    describe("> USING THE FOURTH AUCTION", function () {
      it("Should revert because the deadline has not passed", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).raiseDispute(FOURTH_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionDeadlineNotReached"
        );
      });

      it("Should revert because the it is not the highest bidder", async function () {
        await ethers.provider.send("evm_increaseTime", [28800]);
        await ethers.provider.send("evm_mine", []);

        await expect(
          auctionHouseContract.connect(bidder2).raiseDispute(FOURTH_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "NotTheHighestBidder"
        );
      });

      it("Should raise a dispute", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).raiseDispute(FOURTH_AUCTION_ID)
        )
          .to.emit(auctionHouseContract, "DisputeRaised")
          .withArgs(FOURTH_AUCTION_ID, bidder1.address);
      });

      it("Should revert because a dispute has already been raised", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).raiseDispute(FOURTH_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "DisputeAlreadyRaised"
        );
      });
    });

    describe("> USING AN INEXISTENT AUCTION ID", function () {
      it("Should revert because the auction id is invalid", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).raiseDispute(100)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });
    });
  });

  /* RESOLVE DISPUTE */
  describe("# RESOLVE DISPUTE #", function () {
    describe("> USING THE SECOND AUCTION", function () {
      it("Should revert because it is not the arbitrator", async function () {
        await expect(
          auctionHouseContract
            .connect(bidder1)
            .resolveDispute(SECOND_AUCTION_ID, true)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "NotTheArbitrator"
        );
      });

      it("Should resolve the dispute in favor of the buyer", async function () {
        const initialBalance = await tokenContract.balanceOf(bidder2.address);
        const userBid = ethers.parseUnits("50", 18);

        await expect(
          auctionHouseContract
            .connect(arbitrator)
            .resolveDispute(SECOND_AUCTION_ID, false)
        )
          .to.emit(auctionHouseContract, "DisputeResolved")
          .withArgs(SECOND_AUCTION_ID, false, owner.address, bidder2.address)
          .to.emit(auctionHouseContract, "AuctionResolved")
          .withArgs(SECOND_AUCTION_ID, userBid, bidder2.address);

        const finalBalance = await tokenContract.balanceOf(bidder2.address);
        expect(finalBalance).to.equal(initialBalance + userBid);
        const auction = await auctionHouseContract.auctions(SECOND_AUCTION_ID);
        expect(auction.itemDetails).to.equal(SECOND_AUCTION_ITEM_DETAILS);
      });

      it("Should not allow a new dispute to be raised", async function () {
        await expect(
          auctionHouseContract.connect(bidder2).raiseDispute(SECOND_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionAlreadyResolved"
        );
      });
    });

    describe("> USING THE FOURTH AUCTION", function () {
      it("Should resolve the dispute in favor of the seller", async function () {
        const initialBalance = await tokenContract.balanceOf(owner.address);

        await expect(
          auctionHouseContract
            .connect(arbitrator)
            .resolveDispute(FOURTH_AUCTION_ID, true)
        )
          .to.emit(auctionHouseContract, "DisputeResolved")
          .withArgs(FOURTH_AUCTION_ID, true, owner.address, bidder1.address)
          .to.emit(auctionHouseContract, "AuctionResolved")
          .withArgs(
            FOURTH_AUCTION_ID,
            FOURTH_AUCTION_BUY_NOW_PRICE,
            bidder1.address
          );

        const finalBalance = await tokenContract.balanceOf(owner.address);
        expect(finalBalance).to.equal(
          initialBalance + ethers.parseUnits("196", 18)
        );
        const auction = await auctionHouseContract.auctions(FOURTH_AUCTION_ID);
        expect(auction.itemDetails).to.equal("");
      });

      it("Should not allow a new dispute to be raised", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).raiseDispute(FOURTH_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionAlreadyResolved"
        );
      });
    });

    describe("> USING THE FIFTH AUCTION", function () {
      it("Should revert because there is no dispute raised", async function () {
        await expect(
          auctionHouseContract
            .connect(arbitrator)
            .resolveDispute(FIFTH_AUCTION_ID, true)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "NoDisputeRaised"
        );
      });
    });

    describe("> USING AN INEXISTENT AUCTION ID", function () {
      it("Should revert because the auction id is invalid", async function () {
        await expect(
          auctionHouseContract.connect(arbitrator).resolveDispute(100, true)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });
    });
  });

  /* REFUND */
  describe("# REFUND #", function () {
    describe("> USING THE THIRD AUCTION", function () {
      it("Should revert because the user made no bid", async function () {
        await expect(
          auctionHouseContract.connect(arbitrator).refund(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "NoBidOrFundsClaimedAlready"
        );
      });

      it("Should revert because the user is the winner", async function () {
        await expect(
          auctionHouseContract.connect(bidder2).refund(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "AuctionWinnerCannotClaimFunds"
        );
      });

      it("Should refund the user", async function () {
        const initialBalance = await tokenContract.balanceOf(bidder1.address);

        const userBid = ethers.parseUnits("50", 18);
        await expect(
          auctionHouseContract.connect(bidder1).refund(THIRD_AUCTION_ID)
        )
          .to.emit(auctionHouseContract, "RefundProcessed")
          .withArgs(THIRD_AUCTION_ID, userBid, bidder1.address);

        const finalBalance = await tokenContract.balanceOf(bidder1.address);
        expect(finalBalance).to.equal(initialBalance + userBid);
      });

      it("Should not allow user to be refunded again", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).refund(THIRD_AUCTION_ID)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "NoBidOrFundsClaimedAlready"
        );
      });
    });

    describe("> USING AN INEXISTENT AUCTION ID", function () {
      it("Should revert because the auction id is invalid", async function () {
        await expect(
          auctionHouseContract.connect(bidder1).refund(100)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });
    });
  });

  /* GET AUCTION DETAILS */
  describe("# GET AUCTION DETAILS #", function () {
    describe("> USING THE FIRST AUCTION", function () {
      it("Should return the correct auction details", async function () {
        const auction = await auctionHouseContract.getAuctionDetails(
          FIRST_AUCTION_ID
        );

        expect(auction.itemDetails).to.equal(FIRST_AUCTION_ITEM_DETAILS);
        expect(auction.minBid).to.equal(FIRST_AUCTION_MIN_BID);
        expect(auction.deadline).to.equal(firstAuctionDeadline + 300);
        expect(auction.buyNowPrice).to.equal(FIRST_AUCTION_BUY_NOW_PRICE);
        expect(auction.highestBid).to.equal(ethers.parseUnits("16", 18));
        expect(auction.seller).to.equal(owner.address);
        expect(auction.highestBidder).to.equal(bidder1.address);
        expect(auction.status).to.equal(0);
        expect(auction.disputeStatus).to.equal(0);
      });
    });

    describe("> USING THE SECOND AUCTION", function () {
      it("Should return the correct auction details", async function () {
        const auction = await auctionHouseContract.getAuctionDetails(
          SECOND_AUCTION_ID
        );

        expect(auction.itemDetails).to.equal(SECOND_AUCTION_ITEM_DETAILS);
        expect(auction.minBid).to.equal(SECOND_AUCTION_MIN_BID);
        expect(auction.deadline).to.equal(secondAuctionDeadline);
        expect(auction.buyNowPrice).to.equal(0);
        expect(auction.highestBid).to.equal(ethers.parseUnits("50", 18));
        expect(auction.seller).to.equal(owner.address);
        expect(auction.highestBidder).to.equal(bidder2.address);
        expect(auction.status).to.equal(2);
        expect(auction.disputeStatus).to.equal(2);
      });
    });

    describe("> USING THE THIRD AUCTION", function () {
      it("Should return the correct auction details", async function () {
        const auction = await auctionHouseContract.getAuctionDetails(
          THIRD_AUCTION_ID
        );

        expect(auction.itemDetails).to.equal("");
        expect(auction.minBid).to.equal(THIRD_AUCTION_MIN_BID);
        expect(auction.deadline).to.equal(thirdAuctionDeadline);
        expect(auction.buyNowPrice).to.equal(THIRD_AUCTION_BUY_NOW_PRICE);
        expect(auction.highestBid).to.equal(THIRD_AUCTION_BUY_NOW_PRICE);
        expect(auction.seller).to.equal(bidder1.address);
        expect(auction.highestBidder).to.equal(bidder2.address);
        expect(auction.status).to.equal(2);
        expect(auction.disputeStatus).to.equal(0);
      });
    });

    describe("> USING THE FOURTH AUCTION", function () {
      it("Should return the correct auction details", async function () {
        const auction = await auctionHouseContract.getAuctionDetails(
          FOURTH_AUCTION_ID
        );

        expect(auction.itemDetails).to.equal("");
        expect(auction.minBid).to.equal(FOURTH_AUCTION_MIN_BID);
        expect(auction.deadline).to.equal(fourthAuctionDeadline);
        expect(auction.buyNowPrice).to.equal(FOURTH_AUCTION_BUY_NOW_PRICE);
        expect(auction.highestBid).to.equal(FOURTH_AUCTION_BUY_NOW_PRICE);
        expect(auction.seller).to.equal(owner.address);
        expect(auction.highestBidder).to.equal(bidder1.address);
        expect(auction.status).to.equal(2);
        expect(auction.disputeStatus).to.equal(2);
      });
    });

    describe("> USING THE FIFTH AUCTION", function () {
      it("Should return the correct auction details", async function () {
        const auction = await auctionHouseContract.getAuctionDetails(
          FIFTH_AUCTION_ID
        );

        expect(auction.itemDetails).to.equal(FIFTH_AUCTION_ITEM_DETAILS);
        expect(auction.minBid).to.equal(FIFTH_AUCTION_MIN_BID);
        expect(auction.deadline).to.equal(fifthAuctionDeadline);
        expect(auction.buyNowPrice).to.equal(FIFTH_AUCTION_BUY_NOW_PRICE);
        expect(auction.highestBid).to.equal(ethers.parseUnits("100", 18));
        expect(auction.seller).to.equal(owner.address);
        expect(auction.highestBidder).to.equal(bidder1.address);
        expect(auction.status).to.equal(0);
        expect(auction.disputeStatus).to.equal(0);
      });
    });

    describe("> USING THE EMPTY AUCTION", function () {
      it("Should return the correct auction details", async function () {
        const auction = await auctionHouseContract.getAuctionDetails(
          EMPTY_AUCTION_ID
        );

        expect(auction.itemDetails).to.equal(EMPTY_AUCTION_ITEM_DETAILS);
        expect(auction.minBid).to.equal(EMPTY_AUCTION_MIN_BID);
        expect(auction.deadline).to.equal(emptyAuctionDeadline);
        expect(auction.buyNowPrice).to.equal(EMPTY_AUCTION_BUY_NOW_PRICE);
        expect(auction.highestBid).to.equal(0);
        expect(auction.seller).to.equal(bidder2.address);
        expect(auction.highestBidder).to.equal(ethers.ZeroAddress);
        expect(auction.status).to.equal(2);
        expect(auction.disputeStatus).to.equal(0);
      });
    });

    describe("> USING AN INEXISTENT AUCTION ID", function () {
      it("Should revert because the auction id is invalid", async function () {
        await expect(
          auctionHouseContract.getAuctionDetails(100)
        ).to.be.revertedWithCustomError(
          auctionHouseContract,
          "InvalidAuctionId"
        );
      });
    });
  });
});
