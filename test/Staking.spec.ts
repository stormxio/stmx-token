import { ethers, upgrades } from 'hardhat'

import { expect, getBlockTimestamp, getSigners, increaseEvmTime, toDays, INITIAL_SUPPLY, NAME, SYMBOL, ZERO_ADDRESS } from './shared'
import type { Signers } from './types'
import type { ERC20Upgradeable, Staking, STMX } from '../typechain-types'

describe('Staking', async () => {
  let signers: Signers
  let staking: Staking
  let token: ERC20Upgradeable

  before(async () => {
    signers = await getSigners()
  })

  beforeEach(async () => {
    // deploy the token
    const STMXContract = await ethers.getContractFactory('STMX')
    const args = [NAME, SYMBOL, INITIAL_SUPPLY, signers.owner.address]
    token = await upgrades.deployProxy(STMXContract, args, {
      initializer: 'initialize',
    }) as STMX
    expect(await token.balanceOf(signers.owner.address)).to.equal(INITIAL_SUPPLY)

    const StakingContract = await ethers.getContractFactory('Staking')
    staking = await StakingContract.deploy(token.address, signers.user2.address)

    // transfer 1000 tokens to user1
    await token.connect(signers.owner.signer).transfer(signers.user1.address, 1000)
  })

  describe('Deploying', () => {
    it('reverts if deployment is using zero-address token', async () => {
      const StakingContract = await ethers.getContractFactory('Staking')
      await expect(StakingContract.deploy(ZERO_ADDRESS, signers.user1.address))
        .to.be.revertedWithCustomError(staking, 'ZeroAddress')
    })

    it('reverts if deployment is using zero-address treasury', async () => {
      const StakingContract = await ethers.getContractFactory('Staking')
      await expect(StakingContract.deploy(token.address, ZERO_ADDRESS))
        .to.be.revertedWithCustomError(staking, 'ZeroAddress')
    })
  })

  describe('Staking', () => {
    it('has correct owner assigned', async () => {
      expect(await staking.owner()).to.eq(signers.owner.address)
    })

    it('allows to stake the tokens', async () => {
      // balances before the staking
      expect(await token.balanceOf(signers.user1.address)).to.equal(1000)
      expect(await token.balanceOf(staking.address)).to.equal(0)

      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 200)
      await staking.connect(signers.user1.signer).stake(200)
      expect(await staking.staked(signers.user1.address)).to.equal(200)

      // balances after the staking
      expect(await token.balanceOf(signers.user1.address)).to.equal(800)
      expect(await token.balanceOf(staking.address)).to.equal(200)
    })

    it('allows to unstake the tokens and transfer the tokens before the cooldown period', async () => {
      // balances before the staking
      expect(await token.balanceOf(signers.user1.address)).to.equal(1000)
      expect(await token.balanceOf(signers.user2.address)).to.equal(0)
      expect(await token.balanceOf(staking.address)).to.equal(0)

      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 600)
      await staking.connect(signers.user1.signer).stake(600)
      expect(await staking.staked(signers.user1.address)).to.equal(600)

      // balances after staking
      expect(await token.balanceOf(signers.user1.address)).to.equal(400)
      expect(await token.balanceOf(signers.user2.address)).to.equal(0) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(600)

      // set the cooldown timer
      await staking.connect(signers.user1.signer).setCooldownTimer(600)
      expect(await staking.amounts(signers.user1.address)).to.equal(600)

      // unstaking
      await staking.connect(signers.user1.signer).unstake(600)
      expect(await staking.staked(signers.user1.address)).to.equal(0)

      // amount in the cooldown period should be cleared
      expect(await staking.amounts(signers.user1.address)).to.equal(0)

      // balances after unstaking
      expect(await token.balanceOf(signers.user1.address)).to.equal(940) // unstaker wallet
      expect(await token.balanceOf(signers.user2.address)).to.equal(60) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(0)
    })

    it('allows to unstake the tokens and transfer the tokens without the cooldown period', async () => {
      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      await staking.connect(signers.user1.signer).stake(500)

      // unstaking without setting the cooldown period
      await staking.connect(signers.user1.signer).unstake(200)
      expect(await staking.staked(signers.user1.address)).to.equal(300)
      expect(await staking.timers(signers.user1.address)).to.equal(0)
      expect(await staking.amounts(signers.user1.address)).to.equal(0)
      expect(await staking.penalties(signers.user1.address)).to.equal(0)

      // balances after unstaking
      expect(await token.balanceOf(signers.user1.address)).to.equal(680) // unstaker wallet
      expect(await token.balanceOf(signers.user2.address)).to.equal(20) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(300) // remaining staking amount

      // unstaking the remaining amount without setting the cooldown period
      await staking.connect(signers.user1.signer).unstake(300)
      expect(await staking.staked(signers.user1.address)).to.equal(0)

      // balances after unstaking the remaining amount
      expect(await token.balanceOf(signers.user1.address)).to.equal(950) // unstaker wallet
      expect(await token.balanceOf(signers.user2.address)).to.equal(50) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(0) // remaining staking amount
    })

    it('allows to unstake the tokens and transfer the tokens after the cooldown period', async () => {
      // balances before the staking
      expect(await token.balanceOf(signers.user1.address)).to.equal(1000)
      expect(await token.balanceOf(signers.user2.address)).to.equal(0)
      expect(await token.balanceOf(staking.address)).to.equal(0)

      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 600)
      await staking.connect(signers.user1.signer).stake(600)
      expect(await staking.staked(signers.user1.address)).to.equal(600)

      // balances after staking
      expect(await token.balanceOf(signers.user1.address)).to.equal(400)
      expect(await token.balanceOf(signers.user2.address)).to.equal(0) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(600)

      // set the cooldown timer
      await staking.connect(signers.user1.signer).setCooldownTimer(500)
      expect(await staking.amounts(signers.user1.address)).to.equal(500)

      // pass the cooldown period
      increaseEvmTime(toDays(15).toNumber())

      // unstaking
      await staking.connect(signers.user1.signer).unstake(500)
      expect(await staking.staked(signers.user1.address)).to.equal(100)

      // amount in the cooldown period should be cleared
      expect(await staking.amounts(signers.user1.address)).to.equal(0)

      // balances after unstaking
      expect(await token.balanceOf(signers.user1.address)).to.equal(900) // unstaker wallet
      expect(await token.balanceOf(signers.user2.address)).to.equal(0) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(100)
    })

    it('emits "Staked" event when staking', async () => {
      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      const txReceiptUnresolved = await staking.connect(signers.user1.signer).stake(500)
      await expect(txReceiptUnresolved).to.emit(staking, 'Staked').withArgs(signers.user1.address, 500)
      expect(await staking.staked(signers.user1.address)).to.equal(500)
    })

    it('emits "Unstaked" event when unstaking', async () => {
      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      await staking.connect(signers.user1.signer).stake(500)
      expect(await staking.staked(signers.user1.address)).to.equal(500)

      // set the cooldown timer
      await staking.connect(signers.user1.signer).setCooldownTimer(500)

      // unstaking
      const txReceiptUnresolved = await staking.connect(signers.user1.signer).unstake(500)
      await expect(txReceiptUnresolved).to.emit(staking, 'Unstaked').withArgs(signers.user1.address, 500)
    })

    it('prevents from unstaking different amount than from the timer', async () => {
      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      await staking.connect(signers.user1.signer).stake(500)
      expect(await staking.staked(signers.user1.address)).to.equal(500)

      // set the cooldown timer
      await staking.connect(signers.user1.signer).setCooldownTimer(400)

      // unstaking
      await expect(staking.connect(signers.user1.signer).unstake(450))
        .to.be.revertedWithCustomError(staking, 'UnstakingDifferentAmount')
    })

    it('prevents from staking more tokens than the balance', async () => {
      await expect(staking.connect(signers.user1.signer).stake(1100))
        .to.be.revertedWithCustomError(staking, 'NotEnoughBalance')
    })

    it('prevents from staking zero tokens', async () => {
      await expect(staking.connect(signers.user1.signer).stake(0))
        .to.be.revertedWithCustomError(staking, 'ZeroAmount')
    })

    it('prevents from unstaking more tokens than already staked', async () => {
      // staking
      await token.connect(signers.user1.signer).approve(staking.address, 600)
      await staking.connect(signers.user1.signer).stake(600)
      expect(await staking.staked(signers.user1.address)).to.equal(600)

      // unstaking
      await expect(staking.connect(signers.user1.signer).unstake(700))
        .to.be.revertedWithCustomError(staking, 'NotEnoughStakedBalance')
    })

    it('prevents from unstaking zero tokens', async () => {
      await expect(staking.connect(signers.user1.signer).unstake(0))
        .to.be.revertedWithCustomError(staking, 'ZeroAmount')
    })
  })

  describe('Cooldown', () => {
    it('allows the owner to set the cooldown and emits "CooldownChanged" event', async () => {
      expect(await staking.cooldown()).to.equal(toDays(14))
      const txReceiptUnresolved = await staking.connect(signers.owner.signer).setCooldown(toDays(7))
      await expect(txReceiptUnresolved).to.emit(staking, 'CooldownChanged').withArgs(toDays(7))
      expect(await staking.cooldown()).to.equal(toDays(7))
    })

    it('prevents non-owner from setting the cooldown', async () => {
      await expect(staking.connect(signers.user1.signer).setCooldown(100))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('prevents from setting cooldown period over the maximum 365 days', async () => {
      const FOUR_HUNDRED_DAYS_IN_SECONDS = 34_560_000
      await expect(staking.connect(signers.owner.signer).setCooldown(FOUR_HUNDRED_DAYS_IN_SECONDS))
        .to.be.revertedWithCustomError(staking, 'CooldownOverflow')
    })
  })

  describe('Penalty', () => {
    it('allows to calculate the penalty before actually unstaking', async () => {
      // stake
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      await staking.connect(signers.user1.signer).stake(500)
      expect(await staking.connect(signers.user1.address).calculatePenalty(500)).to.equal(50)

      // set the cooldown timer
      await staking.connect(signers.user1.signer).setCooldownTimer(500)

      // wait some time and change penalty amount
      increaseEvmTime(toDays(8).toNumber())
      await expect(staking.connect(signers.owner.signer).setPenalty(2000))
      // penalty should remain the same for that address since it was snapshotted
      expect(await staking.connect(signers.user1.address).calculatePenalty(500)).to.equal(50)

      // pass the cooldown period
      increaseEvmTime(toDays(8).toNumber())
      expect(await staking.connect(signers.user1.address).calculatePenalty(500)).to.equal(0)
    })

    it('allows the owner to set the penalty and emits "PenaltyChanged" event', async () => {
      expect(await staking.penalty()).to.equal(1000)
      const txReceiptUnresolved = await staking.connect(signers.owner.signer).setPenalty(100)
      await expect(txReceiptUnresolved).to.emit(staking, 'PenaltyChanged').withArgs(100)
      expect(await staking.penalty()).to.equal(100)
    })

    it('allows to set the cooldown timer and emits "SetCooldownTimer" event', async () => {
      // need to stake before setting the cooldown period
      await token.connect(signers.user1.signer).approve(staking.address, 100)
      await staking.connect(signers.user1.signer).stake(100)

      // then set the cooldown period
      const txReceiptUnresolved = await staking.connect(signers.user1.signer).setCooldownTimer(100)
      await expect(txReceiptUnresolved).to.emit(staking, 'SetCooldownTimer').withArgs(signers.user1.address, 100)

      const penalty = await staking.penalty()
      const cooldown = await staking.cooldown()
      const blockTimestamp = await getBlockTimestamp()

      expect(await staking.timers(signers.user1.address)).to.equal(cooldown.add(blockTimestamp))
      expect(await staking.amounts(signers.user1.address)).to.equal(100)
      expect(await staking.penalties(signers.user1.address)).to.equal(penalty)
    })

    it('allows to clear the cooldown timer and emits "SetCooldownTimer" event', async () => {
      const txReceiptUnresolved = await staking.connect(signers.user1.signer).setCooldownTimer(0)
      await expect(txReceiptUnresolved).to.emit(staking, 'SetCooldownTimer').withArgs(signers.user1.address, 0)

      expect(await staking.timers(signers.user1.address)).to.equal(0)
      expect(await staking.amounts(signers.user1.address)).to.equal(0)
      expect(await staking.penalties(signers.user1.address)).to.equal(0)
    })

    it('prevents from setting the timer for more tokens than wallet staked', async () => {
      // stake
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      await staking.connect(signers.user1.signer).stake(500)
      expect(await staking.connect(signers.user1.address).calculatePenalty(500)).to.equal(50)

      // try to set the timer with more tokens than the wallet staked
      await expect(staking.connect(signers.user1.signer).setCooldownTimer(600))
        .to.be.revertedWithCustomError(staking, 'NotEnoughStakedBalance')
    })

    it('prevents non-owner from setting the penalty', async () => {
      await expect(staking.connect(signers.user1.signer).setPenalty(100))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('prevents the owner from overflowing the penalty', async () => {
      await expect(staking.connect(signers.owner.signer).setPenalty(10001))
        .to.be.revertedWithCustomError(staking, 'PenaltyOverflow')
    })

    it('resets the timers and sends out the correct amounts', async () => {
      // stake
      await token.connect(signers.user1.signer).approve(staking.address, 200)
      await staking.connect(signers.user1.signer).stake(200)
      expect(await staking.connect(signers.user1.address).calculatePenalty(200)).to.equal(20)

      // set the cooldown timer
      await staking.connect(signers.user1.signer).setCooldownTimer(100)

      // wait some time and change global penalty amount
      const timerBeforeIncreasingEvmTime = await staking.timers(signers.user1.address)
      increaseEvmTime(toDays(8).toNumber())
      await expect(staking.connect(signers.owner.signer).setPenalty(2000))
      // penalty should remain the same for that address since it was snapshotted
      expect(await staking.connect(signers.user1.address).calculatePenalty(200)).to.equal(20)
      // timer should also stay the same
      expect(await staking.timers(signers.user1.address)).to.equal(timerBeforeIncreasingEvmTime)
      // same for timer amount
      expect(await staking.amounts(signers.user1.address)).to.equal(100)

      // stake some more tokens
      await token.connect(signers.user1.signer).approve(staking.address, 200)
      await staking.connect(signers.user1.signer).stake(200)
      // but the penalty should be now increased because of the amount change
      expect(await staking.connect(signers.user1.address).calculatePenalty(400)).to.equal(80)
      // wait some more time and pass the cooldown period
      increaseEvmTime(toDays(8).toNumber())
      expect(await staking.connect(signers.user1.address).calculatePenalty(400)).to.equal(0)

      // unstake the tokens from the initial timer without a penalty clearing the timer
      await staking.connect(signers.user1.signer).unstake(100)
      expect(await staking.timers(signers.user1.address)).to.equal(0)
      expect(await staking.amounts(signers.user1.address)).to.equal(0)
      expect(await staking.penalties(signers.user1.address)).to.equal(0)
      // the amount of staked tokens should be reduced
      expect(await staking.staked(signers.user1.address)).to.equal(300)
    })
  })

  describe('Treasury', () => {
    it('allows the owner to set the treasury and emits "TreasuryChanged" event', async () => {
      expect(await staking.treasury()).to.equal(signers.user2.address)
      const txReceiptUnresolved = await staking.connect(signers.owner.signer).setTreasury(signers.user3.address)
      await expect(txReceiptUnresolved).to.emit(staking, 'TreasuryChanged').withArgs(signers.user3.address)
      expect(await staking.treasury()).to.equal(signers.user3.address)
    })

    it('prevents non-owner from setting the treasury', async () => {
      await expect(staking.connect(signers.user1.signer).setTreasury(signers.user3.address))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('reverts when setting zero-address treasury', async () => {
      await expect(staking.connect(signers.owner.signer).setTreasury(ZERO_ADDRESS))
        .to.be.revertedWithCustomError(staking, 'ZeroAddress')
    })
  })
})
