import { network } from 'hardhat'

type EtherscaneType = 'address' | 'tx'

export default (type: EtherscaneType, hash: string): string => {
  const networkName = network.name.toLowerCase()
  if (networkName === 'mainnet') {
    return `https://etherscan.io/${type}/${hash}`
  } else if (networkName === 'ropsten') {
    return `https://ropsten.etherscan.io/${type}/${hash}`
  } else if (networkName === 'goerli') {
    return `https://goerli.etherscan.io/${type}/${hash}`
  } else {
    return 'N/A'
  }
}
