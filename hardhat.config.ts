import { HardhatUserConfig, } from "hardhat/config";
import { SolcUserConfig } from 'hardhat/types'
import '@typechain/hardhat';
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import '@openzeppelin/hardhat-upgrades';
import dotenv from 'dotenv-extended';

dotenv.load()

const { COIN_MARKETCAP_API_KEY, ETHERSCAN_API_KEY } = process.env;

const getAccounts = (network: string): string[] | undefined => {
  let accounts
  const privateKey = process.env[`${network}_PRIVATE_KEY`]

  if (privateKey) {
    accounts = [privateKey]
  }
  return accounts
}

const DEFAULT_COMPILER_SETTINGS: SolcUserConfig = {
  version: '0.8.19',
  settings: {
    optimizer: {
      enabled: true,
      runs: 1_000_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}

interface EtherscanConfig {
  apiKey: {
    sepolia: string
    arbitrumSepolia: string
    arbitrumOne: string
  },
  customChains: any
}
const EtherscanConfig: EtherscanConfig = {
  apiKey: {
    sepolia: ETHERSCAN_API_KEY || "",
    arbitrumSepolia: ETHERSCAN_API_KEY || "",
    arbitrumOne: ETHERSCAN_API_KEY || "",
  },
  customChains: [
    {
      network: "arbitrumSepolia",
      chainId: 421614,
      urls: {
        apiURL: "https://api-sepolia.arbiscan.io/api",
        browserURL: "https://sepolia.arbiscan.io/",
      },
    },
  ],
};
interface ExtendedHardhatUserConfig extends HardhatUserConfig {
  etherscan: EtherscanConfig;
}

const config: ExtendedHardhatUserConfig = {
  plugins: ["hardhat-gas-reporter", "@typechain/hardhat", "solidity-coverage", "hardhat-verify"],
  networks: {
    hardhat: {
      // @ts-ignore workaround for Hardhat < 2.8.3
      gasReporter: {
        outputFile: "gas-report.txt",
        enabled: true,
        currency: "USD",
        coinmarketcap: COIN_MARKETCAP_API_KEY || "",
        token: "ETH"
      },
      allowUnlimitedContractSize: false,
      accounts: {
        count: 52,
      }
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.MAINNET_INFURA_API_KEY}`,
      accounts: getAccounts('MAINNET'),
      gasPrice: 55_000_000_000,
      timeout: 0,
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: getAccounts('ARBITRUMONE'),
      gasMultiplier: 1.2,
      timeout: 0,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.SEPOLIA_INFURA_API_KEY}`,
      accounts: getAccounts('SEPOLIA'),
      gasPrice: 40_000_000_000,
      timeout: 0,
    },
    arbitrumSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      chainId: 421614,
      accounts: getAccounts('ARBITRUMSEPOLIA'),
      gasMultiplier: 1.2,
      timeout: 0,
    },
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
  },
  etherscan: EtherscanConfig,
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  }

}

export default config
