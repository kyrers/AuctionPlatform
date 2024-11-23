import { expect } from "chai";
import { ethers } from "hardhat";

describe("### AuctionHouseToken Contract ###", function () {
  let token: any;
  let owner: any;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("AuctionHouseToken");
    token = await TokenFactory.deploy("AuctionHouseToken", "AHT");
  });

  it("should deploy the token contract with correct parameters", async function () {
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.name()).to.equal("AuctionHouseToken");
    expect(await token.symbol()).to.equal("AHT");
  });
});
