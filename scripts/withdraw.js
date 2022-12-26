const { getNamedAccounts, ethers, network, deployments } = require("hardhat");

async function main() {

  const {deployer} = await getNamedAccounts();
  const fundMe = await ethers.getContract("FundMe", deployer);

  console.log("Withdrawing");
  const initialFundMeBalance = fundMe.provider.getBalance(fundMe.address);

  const txResponse = await fundMe.withdraw();
  await txResponse.wait(1);

  console.log(`Withdrawn: ${ethers.utils.formatEther((await initialFundMeBalance).toString())} ETH`);
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
})

