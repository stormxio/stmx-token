import { ethers } from 'hardhat'

import verifyEnvVars from './helpers/env-vars'
import getEtherscanUri from './helpers/etherscan'

async function main() {
  const values = verifyEnvVars(['NEW_TOKEN', 'TREASURY'], 'STAKING')

  const [owner] = await ethers.getSigners()

  console.info(
    `Deploying Staking with new token "${values.NEW_TOKEN}", treasury "${values.TREASURY}" ` +
    `and owner ${owner.address}...`
  )

  const Staking = await ethers.getContractFactory('Staking', owner)
  const staking = await Staking.deploy(values.NEW_TOKEN, values.TREASURY)

  console.info(`Check tx here: ${getEtherscanUri('tx', staking.deployTransaction.hash)}`)

  await staking.deployed()

  console.info(`Staking deployed to: ${staking.address}`)
  console.info(`Verify here: ${getEtherscanUri('address', staking.address)}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
