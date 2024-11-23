import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AuctionHouseTokenModule = buildModule("AuctionHouseTokenModule", (m) => {
  const name = m.getParameter("name");
  const symbol = m.getParameter("symbol");

  const token = m.contract("AuctionHouseToken", [name, symbol]);

  return { token };
});

export default AuctionHouseTokenModule;
