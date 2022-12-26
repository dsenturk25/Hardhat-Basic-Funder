
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {developmentChains} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");
 
developmentChains.includes(network.name)
? describe.skip
: describe("FundMe", () => { 
  
  let fundMe, deployer;
  const sendValue = ethers.utils.parseEther("0.1") // 1 ETH to Wei
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    fundMe = await ethers.getContract("FundMe", deployer); // get contracts after our deploy scripts deploy
  })

  it("should fund the contract and owner should withdraw", async () => {
    await fundMe.fund({value: sendValue});
    await fundMe.withdraw();

    const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);

    assert.equal(endingFundMeBalance.toString(), "0");
  })
})
