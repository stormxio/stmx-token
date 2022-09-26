import { ethers } from 'hardhat'

import verifyEnvVars from './helpers/env-vars'
import getEtherscanUri from './helpers/etherscan'

async function main() {
  const values = verifyEnvVars(['OLD_TOKEN', 'NEW_TOKEN'], 'CONVERT')

  const [owner] = await ethers.getSigners()

  console.info(
    `Deploying Convert with old token "${values.OLD_TOKEN}", new token "${values.NEW_TOKEN}" ` +
    `and owner ${owner.address}...`
  )

  const Convert = await ethers.getContractFactory('Convert', owner)
  const convert = await Convert.deploy(values.OLD_TOKEN, values.NEW_TOKEN)

  console.info(`Check tx here: ${getEtherscanUri('tx', convert.deployTransaction.hash)}`)

  await convert.deployed()

  console.info(`Convert deployed to: ${convert.address}`)
  console.info(`Verify here: ${getEtherscanUri('address', convert.address)}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
