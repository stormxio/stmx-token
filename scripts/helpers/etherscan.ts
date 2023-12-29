import { network } from 'hardhat'

type EtherscaneType = 'address' | 'tx'

export default (type: EtherscaneType, hash: string): string => {
  const networkName = network.name.toLowerCase()
  let url = ""
  switch (networkName) {
    case 'mainnet':
      url = `https://etherscan.io/${type}/${hash}`
      break;
    case 'goerli':
      url = `https://goerli.etherscan.io/${type}/${hash}`
      break;
    case 'arbitrumsepolia':
      url = `https://sepolia.arbiscan.io/${type}/${hash}`
      break;
    case 'arbitrumOne':
      url = `https://arbiscan.io/${type}/${hash}`
      break;
    default:
      url = 'N/A'
      break;
  }
  return url
}
