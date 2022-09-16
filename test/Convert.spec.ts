import { ethers, upgrades } from 'hardhat'

import { expect, getSigners, INITIAL_SUPPLY, NAME, SYMBOL } from './shared'
import type { Signers } from './types'
import type { Convert, ERC20, ERC20Upgradeable, STMX } from '../typechain-types'

describe('Convert', async () => {
  let signers: Signers
  let convert: Convert
  let oldToken: ERC20
  let newToken: ERC20Upgradeable

  before(async () => {
    signers = await getSigners()
  })

  beforeEach(async () => {
    // deploy old token
    const TestERC20Contract = await ethers.getContractFactory('TestERC20')
    oldToken = await TestERC20Contract.deploy()

    // transfer 1000 old tokens to {user1}
    await oldToken.connect(signers.owner.signer).transfer(signers.user1.address, 1000)

    // deploy new upgradable token
    const STMXContract = await ethers.getContractFactory('STMX')
    const args = [NAME, SYMBOL, INITIAL_SUPPLY, signers.owner.address]
    newToken = await upgrades.deployProxy(STMXContract, args, {
      initializer: 'initialize',
    }) as STMX
    expect(await newToken.balanceOf(signers.owner.address)).to.equal(INITIAL_SUPPLY)

    const ConvertContract = await ethers.getContractFactory('Convert')
    convert = await ConvertContract.deploy(oldToken.address, newToken.address)

    // transfer 1000 new tokens to {convert}
    await newToken.connect(signers.owner.signer).transfer(convert.address, 1000)
  })

  describe('Convert', () => {
    it('converts the tokens and emits Converted events', async () => {
      // check balances before the conversion
      expect(await oldToken.balanceOf(signers.user1.address)).to.equal(1000)
      expect(await newToken.balanceOf(signers.user1.address)).to.equal(0)
      
      // then convert
      await oldToken.connect(signers.user1.signer).approve(convert.address, 250)
      const txReceiptUnresolved1 = await convert.connect(signers.user1.signer).convert(100)
      await expect(txReceiptUnresolved1).to.emit(convert, 'Converted').withArgs(signers.user1.address, 100)
      const txReceiptUnresolved2 = await convert.connect(signers.user1.signer).convert(150)
      await expect(txReceiptUnresolved2).to.emit(convert, 'Converted').withArgs(signers.user1.address, 150)

      // and check whether it worked
      expect(await oldToken.balanceOf(signers.user1.address)).to.equal(750)
      expect(await newToken.balanceOf(signers.user1.address)).to.equal(250)
    })

    it('reverts in case of not enought old token balance', async () => {
      await oldToken.connect(signers.user1.signer).approve(convert.address, 2000)
      await expect(convert.connect(signers.user1.signer).convert(2000))
        .to.be.revertedWithCustomError(convert, 'NotEnoughOldTokenBalance')
    })

    it('reverts in case of failed transfer from the old token', async () => {
      await oldToken.connect(signers.user1.signer).approve(convert.address, 1)
      await expect(convert.connect(signers.user1.signer).convert(1))
        .to.be.revertedWithCustomError(convert, 'OldTokenTransferFailed')
    })
  })
})
