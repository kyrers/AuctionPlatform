import hre from "hardhat";
import AuctionHouseTokenModule from "../ignition/modules/AuctionHouseToken";
import AuctionHouseModule from "../ignition/modules/AuctionHouse";

async function main() {
  const { token } = await hre.ignition.deploy(AuctionHouseTokenModule, {
    parameters: {
      AuctionHouseTokenModule: { name: "AuctionHouseToken", symbol: "AHT" },
    },
  });

  // Arbitrator address (replace with a the address you actually want)
  const arbitratorAddress: string =
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const { auctionHouse } = await hre.ignition.deploy(AuctionHouseModule, {
    parameters: {
      AuctionHouseModule: {
        tokenAddress: token.target.toString(),
        arbitrator: arbitratorAddress,
      },
    },
  });

  console.log("AuctionHouseToken deployed to:", token.target);
  console.log("AuctionHouse deployed to:", auctionHouse.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
