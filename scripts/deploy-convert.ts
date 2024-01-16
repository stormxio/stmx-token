import { ethers } from 'hardhat'

import verifyEnvVars from './helpers/env-vars'
import getEtherscanUri from './helpers/etherscan'
import type { Convert } from '../typechain-types'

async function main() {
  const values = verifyEnvVars(['OLD_TOKEN', 'NEW_TOKEN'], 'CONVERT')

  const [owner] = await ethers.getSigners()

  console.info(
    `Deploying Convert with old token "${values.OLD_TOKEN}", new token "${values.NEW_TOKEN}" ` +
    `and owner ${owner.address}...`
  )

  const ConvertContract = await ethers.getContractFactory('Convert', owner)
  const convert: Convert = await ConvertContract.deploy(values.OLD_TOKEN, values.NEW_TOKEN)

  await convert.waitForDeployment()

  console.info(`Convert deployed to: ${convert.target}`)
  console.info(`Verify here: ${getEtherscanUri('address', convert.target)}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
