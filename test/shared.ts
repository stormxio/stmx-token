import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'

import { Signer, Signers } from './types'

export { expect }

export const INITIAL_SUPPLY = 10_000_000_000
export const NAME = 'StormX'
export const SYMBOL = 'STMX'
export const ZERO_ADDRESS = ethers.constants.AddressZero

export const getSigners = async (): Promise<Signers> => {
  const signers = await ethers.getSigners()

  const users: Record<string, Signer> = {}
  for (let i = 1; i < 10; i++) {
    users[`user${i}`] = {
      address: signers[i].address,
      signer: signers[i],
    }
  }

  return {
    owner: {
      address: signers[0].address,
      signer: signers[0]
    },
    ...users
  } as Signers
}

export const increaseEvmTime = async (seconds: number): Promise<void> => {
  await ethers.provider.send('evm_increaseTime', [seconds])
  await ethers.provider.send('evm_mine', [])
}

export const toDays = (days: number) => BigNumber.from(days * 24 * 60 * 60)
