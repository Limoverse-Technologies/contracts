const { expect } = require("chai");
const { ethers } = require("hardhat");

let lemoToken, stakingInstance, MultiInstance, owner, addr1, addr2, addr3

before(async () => {
  [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const Limoverse = await ethers.getContractFactory("Limoverse");
  lemoToken = await Limoverse.deploy();
  const Multisig = await ethers.getContractFactory("MultiSigWallet");
  MultiInstance = await Multisig.deploy([owner.address, addr1.address, addr2.address], 2);
  const Staking = await ethers.getContractFactory("Staking");
  stakingInstance = await Staking.deploy(lemoToken.address,MultiInstance.address);
  await lemoToken.approve(stakingInstance.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
})


const mintToken = async () => {
  const [owner] = await ethers.getSigners();
  await lemoToken.deployed();
  expect(await lemoToken.balanceOf(owner.address)).to.equal('10000000000000000000000000000');
}

const stakeFor = async () => {
  const [owner, addr1] = await ethers.getSigners();
  await stakingInstance.stakeFor(addr1.address,ethers.utils.parseEther('1000'), Math.round(new Date().getTime() / 1000))
  expect(await stakingInstance.stakeBalanceOf(addr1.address)).to.equal(ethers.utils.parseEther('1000'))
}

const stake = async () => {
  const [owner, addr1,addr2,addr3] = await ethers.getSigners();
  await lemoToken.transfer(addr1.address, ethers.utils.parseEther('100'));
  await lemoToken.connect(addr1).approve(stakingInstance.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
  await lemoToken.connect(addr2).approve(stakingInstance.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
  await stakingInstance.connect(addr1).stake(ethers.utils.parseEther('100'))
  await stakingInstance.stake(ethers.utils.parseEther('1000'))
  await lemoToken.transfer(addr2.address, ethers.utils.parseEther('10'));
  await stakingInstance.connect(addr2).stake(ethers.utils.parseEther('10'))
  expect(await stakingInstance.stakeBalanceOf(addr1.address)).to.equal(ethers.utils.parseEther('1100'))
}

const pushStakingRewards = async () => {
  const [owner, addr1] = await ethers.getSigners();
  await stakingInstance.pushStakingRewards(ethers.utils.parseEther('1000'));
  expect(await stakingInstance.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther('520'));
}

const claimReward = async () => {
  const [owner,addr1] = await ethers.getSigners();
  await stakingInstance.connect(addr1).claimReward();
  expect(await lemoToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther('520'));
}

const unStake = async () => {
  const [owner,addr1,addr2] = await ethers.getSigners();
  await stakingInstance.connect(addr2).unStake(ethers.utils.parseEther('10'));
  expect(await lemoToken.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther('10'));
}

// const createTwoXReward = async () => {
//   const [owner,addr1] = await ethers.getSigners();
//   await MultiInstance.createTwoXReward(addr1.address, ethers.utils.parseEther('10'));
//   expect(await stakingInstance.twoXBalanceOf(addr1.address)).to.equal(ethers.utils.parseEther('10'));
// }

const createTwoXReward = async () => {
  const [owner,addr1] = await ethers.getSigners();
  const transferEncoded = stakingInstance.interface.encodeFunctionData("createTwoXReward",[addr1.address, ethers.utils.parseEther('10')])
  await MultiInstance.submitTransaction(stakingInstance.address, 0, transferEncoded);
  await MultiInstance.connect(addr1).confirmTransaction(0)
  await MultiInstance.connect(addr2).confirmTransaction(0)
  await MultiInstance.connect(addr1).executeTransaction(0)
  expect(await stakingInstance.twoXBalanceOf(addr1.address)).to.equal(ethers.utils.parseEther('10'));
}

const createTwoXRewardError = async () => {
  const [owner,addr1] = await ethers.getSigners();
  const transferEncoded = stakingInstance.interface.encodeFunctionData("createTwoXReward",[addr1.address, ethers.utils.parseEther('1100')])
  await MultiInstance.submitTransaction(stakingInstance.address, 0, transferEncoded);
  await MultiInstance.connect(addr1).confirmTransaction(1)
  await MultiInstance.connect(addr2).confirmTransaction(1)
  
  await expect(
      MultiInstance.connect(addr1).executeTransaction(1)
  ).to.be.revertedWith("tx failed")
}

const twoXExe = async () => {
  const [owner,addr1,addr2, addr3] = await ethers.getSigners();
  await stakingInstance.connect(addr1).addReferral(addr3.address);
  await stakingInstance.pushStakingRewards(ethers.utils.parseEther('1000'));
  await stakingInstance.connect(addr1).claimReward();
  expect(await lemoToken.balanceOf(addr3.address)).to.equal(ethers.utils.parseEther('52'));
  expect(await lemoToken.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther('988'));
}

const testCases = async () => {
  it("Should mint initial token", mintToken)
  it("Should stake by admin", stakeFor)
  it("Should stake by user", stake)
  it("Should push the reward", pushStakingRewards)
  it("Should claim the reward", claimReward)
  it("Should unstake the token", unStake)
  it("Should create rewards",createTwoXReward)
  it("Should revert create rewards",createTwoXRewardError)
  it("Should execute referrals",twoXExe)
}

describe("Staking", testCases);