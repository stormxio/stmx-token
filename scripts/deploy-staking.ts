import { ethers } from 'hardhat'

import verifyEnvVars from './helpers/env-vars'
import getEtherscanUri from './helpers/etherscan'
import type { Staking } from '../typechain-types'

async function main() {
  const values = verifyEnvVars(['NEW_TOKEN', 'TREASURY'], 'STAKING')

  const [owner] = await ethers.getSigners()

  console.info(
    `Deploying Staking with new token "${values.NEW_TOKEN}", treasury "${values.TREASURY}" ` +
    `and owner ${owner.address}...`
  )

  const StakingContract = await ethers.getContractFactory('Staking', owner)
  const staking: Staking = await StakingContract.deploy(values.NEW_TOKEN, values.TREASURY)
  await staking.waitForDeployment()

  console.info(`Verify here: ${getEtherscanUri('address', staking.target)}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
