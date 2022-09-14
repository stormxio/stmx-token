import { ethers, upgrades } from 'hardhat'

import { expect, getSigners, INITIAL_SUPPLY, NAME, SYMBOL } from './shared'
import { Signers } from './types'

import { STMX } from '../typechain-types'

describe('STMX', async () => {
  let signers: Signers
  let token: STMX

  before(async () => {
    signers = await getSigners()
  })

  beforeEach(async () => {
    const STMXContract = await ethers.getContractFactory('STMX')
    const args = [NAME, SYMBOL, INITIAL_SUPPLY, signers.owner.address]
    token = await upgrades.deployProxy(STMXContract, args, {
      initializer: 'initialize',
    }) as STMX
    expect(await token.balanceOf(signers.owner.address)).to.equal(INITIAL_SUPPLY)

    // transfer 1000 tokens to {user1}
    await token.connect(signers.owner.signer).transfer(signers.user1.address, 1000)
  })

  describe('ERC20', () => {
    it('has correct name', async () => {
      expect(await token.name()).to.equal(NAME)
    })

    it('has correct symbol', async () => {
      expect(await token.symbol()).to.equal(SYMBOL)
    })

    it('has correct number of decimals', async () => {
      expect(await token.decimals()).to.equal(18)
    })

    it('has correct total supply', async () => {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY)
    })
  })

  describe('Transfers', () => {
    it('sends transfer successfully', async () => {
      await token.connect(signers.user1.signer).transfer(signers.user2.address, 100)

      // assert proper total balance
      expect(await token.balanceOf(signers.user1.address)).to.equal(900)
      expect(await token.balanceOf(signers.user2.address)).to.equal(100)
    })

    it('uses transferFrom successfully', async () => {
      await token.connect(signers.user1.signer).approve(signers.user1.address, 500)
      await token.connect(signers.user1.signer)
        .transferFrom(signers.user1.address, signers.user2.address, 250)

      // assert that transferFrom only succeeds if sender is spender
      await expect(token.connect(signers.user2.signer)
        .transferFrom(signers.user1.address, signers.user2.address, 250))
        .to.be.revertedWith('ERC20: insufficient allowance')

      // assert proper total balance
      expect(await token.balanceOf(signers.user1.address)).to.equal(750)
      expect(await token.balanceOf(signers.user2.address)).to.equal(250)
    })

    it('reverts if input lengths do not match in transfers', async () => {
      const recipients = [signers.user1.address, signers.user2.address]
      const values = [100]

      await expect(token.connect(signers.user1.signer).transfers(recipients, values))
        .to.be.revertedWithCustomError(token, 'InputLengthsDoNotMatch')
    })

    it('reverts if any transfer fails', async () => {
      const recipients = [signers.user2.address, signers.user2.address]
      const values = [1000, 1]

      await expect(token.connect(signers.user1.signer).transfers(recipients, values))
        .to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('uses transfers successfully', async () => {
      const recipients = [signers.user1.address, signers.user2.address, signers.owner.address]
      const values = [100, 100, 100]

      await token.connect(signers.user1.signer).transfers(recipients, values)
      expect(await token.balanceOf(signers.user1.address)).to.equal(800)
      expect(await token.balanceOf(signers.user2.address)).to.equal(100)
      expect(await token.balanceOf(signers.owner.address)).to.equal(INITIAL_SUPPLY - 1000 + 100)
    })
  })

  describe('Upgradability', () => {
    it('reverts if initialize() called more than once', async () => {
      // expect to revert another initialization
      await expect(token.initialize(NAME, SYMBOL, INITIAL_SUPPLY, signers.owner.address))
        .to.be.revertedWith('Initializable: contract is already initialized')
    })
  })
})
