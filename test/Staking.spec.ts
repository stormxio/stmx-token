import { ethers, upgrades } from 'hardhat'

import { expect, getSigners, increaseEvmTime, toDays, INITIAL_SUPPLY, NAME, SYMBOL } from './shared'
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

    // transfer 1000 tokens to {user1}
    await token.connect(signers.owner.signer).transfer(signers.user1.address, 1000)
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

      // unstaking
      await staking.connect(signers.user1.signer).unstake(500)
      expect(await staking.staked(signers.user1.address)).to.equal(100)

      // balances after unstaking
      expect(await token.balanceOf(signers.user1.address)).to.equal(850) // unstaker wallet
      expect(await token.balanceOf(signers.user2.address)).to.equal(50) // treasury wallet
      expect(await token.balanceOf(staking.address)).to.equal(100)
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

      // pass the cooldown period
      increaseEvmTime(toDays(15).toNumber())

      // unstaking
      await staking.connect(signers.user1.signer).unstake(500)
      expect(await staking.staked(signers.user1.address)).to.equal(100)

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

      // unstaking
      const txReceiptUnresolved = await staking.connect(signers.user1.signer).unstake(500)
      await expect(txReceiptUnresolved).to.emit(staking, 'Unstaked').withArgs(signers.user1.address, 500)
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
  })

  describe('Penalty', () => {
    it('allows to calculate the penalty before actually unstaking', async () => {
      // stake
      await token.connect(signers.user1.signer).approve(staking.address, 500)
      await staking.connect(signers.user1.signer).stake(500)
      expect(await staking.connect(signers.user1.address).calculatePenalty(500)).to.equal(50)

      // wait some time and change penalty amount
      increaseEvmTime(toDays(8).toNumber())
      await expect(staking.connect(signers.owner.signer).setPenalty(2000))
      expect(await staking.connect(signers.user1.address).calculatePenalty(500)).to.equal(100)

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

    it('prevents non-owner from setting the penalty', async () => {
      await expect(staking.connect(signers.user1.signer).setPenalty(100))
        .to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('prevents the owner from overflowing the penalty', async () => {
      await expect(staking.connect(signers.owner.signer).setPenalty(10001))
        .to.be.revertedWithCustomError(staking, 'PenaltyOverflow')
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
  })
})
