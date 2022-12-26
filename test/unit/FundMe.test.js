
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => { 
  
  let fundMe, deployer, mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1") // 1 ETH to Wei
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]); // run through all deploy scripts
    fundMe = await ethers.getContract("FundMe", deployer); 
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  })

  describe("constructor", async () => { 
    
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.s_priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    })
  })

  describe("fund", async () => {

    it("should fail if you don't send enough ETH", async () =>  {
      await expect(fundMe.fund()).to.be.reverted;
    })

    it("should update the amount funded data structure", async () => {
      await fundMe.fund({value:sendValue});
      const response = await fundMe.s_addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    })

    it("should add funder to funders array", async () => {
      await fundMe.fund({value: sendValue});
      const response = await fundMe.s_funders(0);
      assert.equal(response, deployer);
    })
  })

  describe("withdraw", async () => {

    // fund the contract first
    beforeEach(async () => {
      await fundMe.fund({value: sendValue});
    })

    it("should withdraw ETH from a single founder", async () => {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      //gasCost
      const {gasUsed, effectiveGasPrice} = transactionReceipt;
      const gasCost = (gasUsed.mul(effectiveGasPrice)).toString();

      const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      
      //Assert
      assert.equal(endingFundMeBalance, 0); 
      assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());
    })

    it("should revert if the withdraw isn't made by owner", async () => {
      const [, unauthoriziedAddress] = await ethers.getSigners();
      await expect(fundMe.connect(unauthoriziedAddress).withdraw()).to.be.reverted;
    })

    it("should withdraw with multiple funders", async () => {

      const accounts = await ethers.getSigners();

      for (let i = 1; i < 6; i++) {
        const fundMeConnectedAccount = fundMe.connect(accounts[i]);
        await fundMeConnectedAccount.fund({value: sendValue});
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = (gasUsed.mul(effectiveGasPrice)).toString();

      const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0); 
      assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());

      // Make sure funders array is reset properly
      await expect(fundMe.s_funders(0)).to.be.reverted;
      
      for (let i = 0; i < 6; i++) {
        assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0);
      }

    })
  })

  describe("cheaper_withdraw", async () => {

    // fund the contract first
    beforeEach(async () => {
      await fundMe.fund({value: sendValue});
    })

    it("should withdraw (cheaper) ETH from a single founder", async () => {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //Act
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);

      //gasCost
      const {gasUsed, effectiveGasPrice} = transactionReceipt;
      const gasCost = (gasUsed.mul(effectiveGasPrice)).toString();

      const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      
      //Assert
      assert.equal(endingFundMeBalance, 0); 
      assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());
    })

    it("should revert if the withdraw (cheaper) isn't made by owner", async () => {
      const [, unauthoriziedAddress] = await ethers.getSigners();
      await expect(fundMe.connect(unauthoriziedAddress).cheaperWithdraw()).to.be.reverted;
    })

    it("should withdraw (cheaper) with multiple funders", async () => {

      const accounts = await ethers.getSigners();

      for (let i = 1; i < 6; i++) {
        const fundMeConnectedAccount = fundMe.connect(accounts[i]);
        await fundMeConnectedAccount.fund({value: sendValue});
      }

      const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Act
      const transactionResponse = await fundMe.cheaperWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = (gasUsed.mul(effectiveGasPrice)).toString();

      const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0); 
      assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString());

      // Make sure funders array is reset properly
      await expect(fundMe.s_funders(0)).to.be.reverted;
      
      for (let i = 0; i < 6; i++) {
        assert.equal(await fundMe.s_addressToAmountFunded(accounts[i].address), 0);
      }

    })
  })

})
 