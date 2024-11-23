# Auction Platform #

A simple auction house that uses a simple ERC20 token called <b>AuctionHouseToken (ATH)</b>. The house locks the funds until an auction is resolved and allows users to:
1. Create auctions;
2. Bid on ongoing auctions;
3. Buy now, if the seller specified a `buyNowPrice` when creating the auction;
4. Resolve auctions;
5. Raise and resolve disputes between the winner of an auction and the seller (arbitrated by a predefined address);
6. Refunds users that lost an auction;
7. Get details about a given auction;

## Design Decisions ##

The assignment was mostly followed, but several important decisions were made:
1. Sellers can participate in their auctions. Users can verify in a block explorer if the seller is bidding or not, and in this way, no one is blocked from participating. Users who regret creating an auction can still fight not to lose their item;
2. The `buyNowPrice` is optional. To handle this situation, `0` was considered the same as having no buy now price;
3. Users can increase their existing bids. If a user has a previous bid of let's say `10 ATH` and then makes another one of `15 ATH`, his new bid will be `15 ATH`, but the house will only transfer an extra `5 ATH`, as it already has `10 ATH` locked;
4. Additionally, if a user attempts to place a bid that equals or surpasses the auction `buyNowPrice` it will be treated as a buy now. The auction won't be resolved, but it won't accept more bids (the same applies if a user calls the `buyNow` function directly;
5. To prevent last-minute sniping, if a bid is placed within 5 minutes of an auction deadline, the deadline is extended by 5 minutes.
6. When resolving an auction that has a winner, the house will take a 2% fee;
7. To simulate sending the item to the winner, the house sets the auction item description to `""`;
8. The highest bidder can only raise a dispute once, regardless of the outcome;
9. If the arbitrator resolves a dispute in favor of the seller, the house will take the 2% fee and transfer the item to the winner. If in favor of the bidder, the bidder will be refunded entirely;
10. Users are fully refunded if they lose an auction. The fee is only charged to the seller;
11. All details of an auction are returned.

## Improvements ##

Aside from the auction house logic, the code itself could be improved. Here are a few examples:

1. Bonus features such as Dynamic Escrow and Upgradeable Contracts were not implemented, so these would be major improvements;
2. Although the test suite is extensive, there are always more tests to make :);
3. Most likely, tests could be better if using hardhat `ignition`;
4. Additionally, the tests could be split between different files (time didn't permit it :) );
5. The above point applies to the contract itself;
6. Gas optimizations;

## How to run the test suite ##

After cloning the repo, just:

1. Install dependencies

```
$ npm install
```

2. Run the hardhat tests;

```
$ npx hardhat test
```

<b>Additionally, this repo includes a script that uses hardhat `ignition modules` to deploy the token and the auction house contracts, allowing for direct interaction with the contracts. It is configured for the hardhat network. To deploy, run: </b>

```
$ npx hardhat run scripts/deploy.ts --network hardhat
```



