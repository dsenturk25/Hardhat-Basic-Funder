// Get funds from users
// Withdraw funds
// Set a minimum funding value in USD

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./PriceConverter.sol";

error FundMe__notOwner();
error FundMe__insufficientFunds();

contract FundMe {

    // msg.sender not available outside the function

    using PriceConverter for uint256;

    //State variables!

    uint256 public constant MINIMUM_USD = 50*1e18; // constant saves gas

    address[] public s_funders;
    mapping(address => uint256) public s_addressToAmountFunded;

    address public immutable i_owner;

    AggregatorV3Interface public s_priceFeed;

    // constructor initializes the owner of the contract
    constructor (address priceFeedAddress) {
        i_owner = msg.sender; // like req.session.user = user authenticaton
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund () public payable fundController {

        //require(msg.value.getConversionRate() >= MINIMUM_USD, "Didn' send enough!");
        // require(getConversionRate(msg.value) >= minimumUSD, "Didn't send enough!");
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
        // 18 decimals in Wei
    }

    function withdraw() public payable onlyOwner {
        // for loop
        for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) { // reads too much from storage causing a lot of gas
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset the array
        s_funders = new address[](0);
        // actually withdraw the funds

        //transfer
        // msg.sender = address
        // payable(msg.sender) = payable address --> you can only send eth with payable addresses
        //payable(msg.sender).transfer(address(this).balance); // this keyword means this contract
        
        //send
        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //require(sendSuccess, "Send failed.");
        
        //call (The most optimal way)
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed.");

    }

    function cheaperWithdraw() public payable onlyOwner {

      address[] memory funders = s_funders; // writing the funders to memory once than reading from memory causing no gas

      for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) { 
        address funder = funders[funderIndex];
        s_addressToAmountFunded[funder] = 0;
      }
      s_funders = new address[](0);

      (bool success, ) = i_owner.call{value: address(this).balance}("");
      require(success, "Transfer failed.");
    }

    modifier onlyOwner {
        //require(msg.sender == i_owner, "Authentication error: Sender is not the owner.");
        if (msg.sender != i_owner) {
            revert FundMe__notOwner();
        }
        _;
    }

    modifier fundController {
        if (msg.value.getConversionRate(s_priceFeed) < MINIMUM_USD) {
            revert FundMe__insufficientFunds();
        }
        _;
    }

    // What happens if someone sends this contract ETH without using fund function

    receive() external payable {
        fund();
    }
    
    fallback() external payable {
        fund();
    }
}
