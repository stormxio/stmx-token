import { BigNumber } from 'ethers'
import { ethers, upgrades } from 'hardhat'

import verifyEnvVars from './helpers/env-vars'
import getEtherscanUri from './helpers/etherscan'
import type { STMX } from '../typechain-types'

async function main() {
  const values = verifyEnvVars(['NAME', 'SYMBOL', 'INITIAL_SUPPLY'], 'TOKEN')

  const [owner] = await ethers.getSigners()

  console.info(
    `Deploying "${values.NAME}" [${values.SYMBOL}] with initial supply of ` +
    `${values.INITIAL_SUPPLY} and owner ${owner.address}...`
  )

  const STMXContract = await ethers.getContractFactory('STMX', owner)

  // 18 decimal places, convert to full units
  // const initialSupply = BigNumber.from(values.INITIAL_SUPPLY).mul(BigNumber.from(10).pow(18))
  const args = [values.NAME, values.SYMBOL, values.INITIAL_SUPPLY, owner.address]
  const token = await upgrades.deployProxy(STMXContract, args) as unknown as STMX
  await token.deployed()
  console.info(`Verify here: ${getEtherscanUri('address', token.address)}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
