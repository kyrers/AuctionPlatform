import { expect } from "chai";
import { ethers } from "hardhat";

const ITEM_DETAILS = "Item 1"; // You can define other constants here
const VALID_MIN_BID = ethers.parseEther("1");
const VALID_BUY_NOW_PRICE = ethers.parseEther("2");

describe("AuctionHouse Contract", function () {
  let auctionHouseContract: any;
  let owner: any;
  let latestBlockTimestamp: number;
  let validAuctionDeadline: number;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("AuctionHouse");
    auctionHouseContract = await factory.deploy();

    const latestBlock = await ethers.provider.getBlock("latest");
    if (!latestBlock) {
      throw new Error("Failed to fetch the latest block");
    }
    latestBlockTimestamp = latestBlock.timestamp;
    validAuctionDeadline = latestBlockTimestamp + 1000;
  });

  describe("### DEPLOYMENT ###", function () {
    it("Should set owner to msg.sender", async function () {
      const contractOwner = await auctionHouseContract.owner();
      expect(owner.address).to.equal(contractOwner);
    });
  });

  describe("### CREATE AUCTION ## ", function () {
    it("Should create an auction with valid parameters", async function () {
      await expect(
        auctionHouseContract.createAuction(
          ITEM_DETAILS,
          VALID_MIN_BID,
          validAuctionDeadline,
          VALID_BUY_NOW_PRICE
        )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          1,
          owner.address,
          ITEM_DETAILS,
          VALID_MIN_BID,
          validAuctionDeadline,
          VALID_BUY_NOW_PRICE
        );
    });

    it("Should create an auction with no Buy Now price", async function () {
      const optionalBuyNowPrice = ethers.parseEther("0"); // No Buy Now price

      await expect(
        auctionHouseContract.createAuction(
          ITEM_DETAILS,
          VALID_MIN_BID,
          validAuctionDeadline,
          optionalBuyNowPrice
        )
      )
        .to.emit(auctionHouseContract, "AuctionCreated")
        .withArgs(
          1,
          owner.address,
          ITEM_DETAILS,
          VALID_MIN_BID,
          validAuctionDeadline,
          optionalBuyNowPrice
        );
    });

    it("Should revert because the item details is an empty string", async function () {
      const invalidItemDetails = "";

      await expect(
        auctionHouseContract.createAuction(
          invalidItemDetails,
          VALID_MIN_BID,
          validAuctionDeadline,
          VALID_BUY_NOW_PRICE
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidItemDetails"
      );
    });

    it("Should revert because the minimum bid is 0", async function () {
      const invalidMinBid = ethers.parseEther("0");

      await expect(
        auctionHouseContract.createAuction(
          ITEM_DETAILS,
          invalidMinBid,
          validAuctionDeadline,
          VALID_BUY_NOW_PRICE
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
          ITEM_DETAILS,
          VALID_MIN_BID,
          invalidAuctionDeadline,
          VALID_BUY_NOW_PRICE
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
          ITEM_DETAILS,
          VALID_MIN_BID,
          invalidAuctionDeadline,
          VALID_BUY_NOW_PRICE
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidAuctionDeadline"
      );
    });

    it("Should revert because the buyNowPrice is less than the minBid", async function () {
      const invalidBuyNowPrice = ethers.parseEther("0.5");

      await expect(
        auctionHouseContract.createAuction(
          ITEM_DETAILS,
          VALID_MIN_BID,
          validAuctionDeadline,
          invalidBuyNowPrice
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidBuyNowPrice"
      );
    });

    it("Should revert because the buyNowPrice is equal to the minBid", async function () {
      const invalidBuyNowPrice = ethers.parseEther("1");

      await expect(
        auctionHouseContract.createAuction(
          ITEM_DETAILS,
          VALID_MIN_BID,
          validAuctionDeadline,
          invalidBuyNowPrice
        )
      ).to.be.revertedWithCustomError(
        auctionHouseContract,
        "InvalidBuyNowPrice"
      );
    });
  });
});
