# stmx-token

[![Coverage](https://github.com/stormxio/stmx-token/actions/workflows/Coverage.yml/badge.svg)](https://github.com/stormxio/stmx-token/actions/workflows/Coverage.yml)

StormX is changing their staking and token contracts to future-proof itself via upgradeability and increase sustainability of the token by adding fees. The new staking contract will add a 10% withdrawal penalty if users remove their tokens without waiting for the 14-day cooldown period. The penalty will be removed from the principal amount that was staked. For example, if a user stakes 100 STMX and unstakes the next day then they will lose 10 STMX tokens. Those tokens will be disbursed to StormX.

The new StormX token will be an upgradeable OpenZeplin based ERC20 contract. This should allow StormX to make changes to the token over time as the ecosystem changes and users need additional features. The new token will have the same ticker as the previous token STMX. There will be no brand changes.

Lastly, StormX requires a swap contract to facilitate 1:1 swap between the old STMX token and the new one. Users will pay for their own gas fees, and the swap will stay open until StormX and the community decide to close it permanently.

## Requirements

This project consists of three contracts. One for a new STMX ERC20 token. The second contract for the conversion from the old STMX token to the new STMX token. The third contract for the staking functionality.

### STMX contract

- Supports the standard ERC20 interface
- The name of the token is "StormX"
- The symbol of the token is "STMX"
- The total supply is [TBA]
- The decimals remain according to the standard
- The token is ownable
- StormX owns the token
- It has a 'transfers' function for batch token sending
- The token is upgradable using OpenZeppelin Upgrades Plugins
- Only the owner can upgrade the token implementation

### Convert contract

- Allows to convert the old non-upgradable ERC20 token to a new upgradable ERC20 token
- Old tokens converted to the new token are forever locked in the Convert contract
- The contract can be closed by the owner (StormX) at anytime
- StormX provides the new tokens to the Convert contract
- StormX can withdraw the remaining new tokens after the contract is closed
- StormX does not have access to the old tokens

### Staking contract

- The contract allows to Stake and Unstake new STMX tokens
- Unstaking the tokens has a penalty fee configurable by StormX
- The default penalty is 10% of the unstaked amount
- The penalty has a cooldown period configured by StormX
- The default cooldown period is 14 days
- There can only be one cooldown period. If a user unstakes multiple times, then it resets the counter.
- The penalty fees go to StormX treasury wallet
- There is no penalty for unstaking after the cooldown period 
- StormX distributes the staking rewards using the current payment system used by our v1 staking program

## Local Development

### Install dependencies

```
npm install
```

### Run tests

```
npx hardhat test
```

### Run coverage

```
npx hardhat coverage
```

### Run Slither via Docker

```
docker run -it -v `pwd`:/src trailofbits/eth-security-toolbox
solc-select install 0.8.16 && solc-select use 0.8.16 && cd /src
slither .
```

## Deployment

Pass environment variables via `.env` file or shell. Use `GOERLI_` prefix for Goerli network values as in the below examples or `MAINNET_` for Mainnet.

```ini
GOERLI_INFURA_API_KEY=infura_api_key
GOERLI_PRIVATE_KEY=ropsten_private_key
```

### STMX contract

Since the STMX token is an upgradable contract and `initialize` function needs to be called after deploying the contract, there is a chance of front-running. StormX will have that in mind and will not continue with the deployments until we know we own the STMX contract.

```ini
GOERLI_TOKEN_NAME=StormX
GOERLI_TOKEN_SYMBOL=STMX
GOERLI_TOKEN_INITIAL_SUPPLY=10000000000
```

```
npx hardhat run ./scripts/deploy-token.ts
```

### Convert contract

```ini
GOERLI_CONVERT_OLD_TOKEN=0x123
GOERLI_CONVERT_NEW_TOKEN=0x123
```

```
npx hardhat run ./scripts/deploy-convert.ts
```

### Staking contract

```ini
GOERLI_STAKING_NEW_TOKEN=0x123
GOERLI_STAKING_TREASURY=0x123
```

```
npx hardhat run ./scripts/deploy-staking.ts
```
