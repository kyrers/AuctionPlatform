import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuctionHouseModule = buildModule("AuctionHouseModule", (m) => {
  const tokenAddress = m.getParameter("tokenAddress");
  const arbitrator = m.getParameter("arbitrator");

  const auctionHouse = m.contract("AuctionHouse", [tokenAddress, arbitrator]);

  return { auctionHouse };
});

export default AuctionHouseModule;
