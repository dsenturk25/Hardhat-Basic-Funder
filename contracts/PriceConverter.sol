
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed) internal view returns(uint256) {
         
        (, int256 price,,,) = priceFeed.latestRoundData();
        // ETH in terms of USD
        // returns 8 decimals: 3000.00000000
        return uint256(price * 1e10); // returns 18 decimals

    }

    function getConversionRate(uint256 ethAmount, AggregatorV3Interface priceFeed) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);

        return (ethAmount * ethPrice) / 1e18;
    } 

    // function getBTC_ETH(uint256 btcAmount) internal view returns (uint256) {

    //     AggregatorV3Interface BTC_ETH = AggregatorV3Interface(0x779877A7B0D9E8603169DdbD7836e478b4624789);

    //     (,int256 price,,,) = BTC_ETH.latestRoundData();

    //     return (uint256(price) * btcAmount) / 1e8;
    // }

}

