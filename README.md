# stmx-token

[![Coverage](https://github.com/stormxio/stmx-token/actions/workflows/Coverage.yml/badge.svg)](https://github.com/stormxio/stmx-token/actions/workflows/Coverage.yml)

StormX (STMX) token is deployed on [mainnet](https://etherscan.io/token/0xa62cc35625b0c8dc1faea39d33625bb4c15bd71c): `0xa62cc35625b0c8dc1faea39d33625bb4c15bd71c`

Convert contract is deployed on [mainnet](https://etherscan.io/address/0x2c993b24978c49ac284e9cdab4afa926ffe13860): `0x2c993b24978c49ac284e9cdab4afa926ffe13860`

Staking contract is deployed on [mainnet](https://etherscan.io/address/0x8650714D080905FC457C73e6Af8A492Be86A600c): `0x8650714D080905FC457C73e6Af8A492Be86A600c`

StormX is changing their staking and token contracts to future-proof itself via upgradeability and increase sustainability of the token by adding fees. The new staking contract will add a 10% withdrawal penalty if users remove their tokens without waiting for the 14-day cooldown period. The penalty will be removed from the total principal amount that was staked. For example, if a user stakes 100 STMX and unstakes the next day then they will lose 10 STMX tokens. Those tokens will be disbursed to a StormX treasury wallet.

The new StormX token will be an upgradeable OpenZeplin based ERC20 contract. This should allow StormX to make changes to the token over time as the ecosystem changes and users need additional features. The new token will have the same ticker as the previous token STMX. There will be no brand changes.

Lastly, StormX requires a swap contract to facilitate 1:1 swap between the old STMX token and the new one. Users will pay for their own gas fees, and the swap will stay open until the StormX governance community votes on when to close the swap.

## Requirements

This project consists of three contracts. One for a new STMX ERC20 token. The second contract is the conversion from the old STMX token to the new STMX token. The third contract for the staking functionality.

### STMX contract

- Supports the standard ERC20 interface
- The name of the token is "StormX"
- The symbol of the token is "STMX"
- The total supply is 12.500.000.000
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
- Unstaking the tokens immediately has a penalty fee configurable by StormX
- The default penalty is 10% of the total amount being unstaked
- The penalty has a cooldown period configured by StormX
- The default cooldown period is 14 days
- There can only be one cooldown period at a time
- The penalty fees go to StormX treasury wallet
- There is no penalty for unstaking after the cooldown period
- During the cooldown period the user can change their mind and cancel the cooldown timer so they can continue earning rewards.
- After the cooldown period the user can change their mind and clear the cooldown timer so they can begin earning staking rewards on those tokens again.
- StormX distributes the staking rewards using the current payment system off-chain used by our v1 staking program

## Technical Executions

StormX developed the contract according to the requirements using Solidity, Hardhat and TypeScript. This section outlines the technical solution.

### STMX contract

STMX token is in compliance with ERC20 as described in ​[eip-20.md](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md)​. This token contract is upgreadable and ownable. [OpenZeppelin ERC20Upgradeable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/contracts/token/ERC20/ERC20Upgradeable.sol) implementation is used to inherit the ERC20 standard interface.

#### Allowance Double-Spend Exploit

The allowance double-spend exploit is mitigated in this contract with functions `increaseAllowance()` and `decreaseAllowance()`.

However, community agreement on an ERC standard that would protect against this exploit is still pending. Users should be aware of this exploit when interacting with this contract. Developers who use `approve()`/`transferFrom()` should keep in mind that they have to set the allowance to 0 first and verify if it was used before setting the new value.

#### Ownable

The contract `STMX.sol` uses ownable pattern and has a function `owner()` to report the address with special privileges. Currently, the owner only receives all the initial supply tokens, and there are no additional functionalities associated with the ownable pattern. That may change in future versions of the contract.

#### Transferring in batch

Anyone can call the method `transfers()` to perform multiple transfers in a single function call. Homever, this is mainly used by the owner/company to distribute the tokens in batches. Normal users are discouraged from executing this function because arrays with a very large number of elements could cause this function to revert due to exceeding the block size during execution.

```solidity
function transfers(
    address[] memory recipients, 
    uint256[] memory values
  ) public returns (bool)
```

#### Upgradability

The new STMX token uses OpenZeppelin Upgrades Plugins Upgradability. Writing upgradable smart contracts requires some restrictions to be worked around. Please see https://docs.openzeppelin.com/upgrades-plugins/1.x/ for more detailed information about mentioned upgradability system.

When upgrading the smart contract to a new version, a Solidity developer should be fully aware of what that entails.

 1. https://docs.openzeppelin.com/learn/upgrading-smart-contracts

 2. https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable

### Convert contract

Convert contract allows to convert old non-upgradable STMX token with the new upgradable STMX token. The owner of the new tokens should send enough of the new tokens to the Convert contract, so conversions are possible until the contract is closed.

#### Convert

Anyone who owns the old STMX token can call the method `convert()` to swap the old token with the new one. Before converting the tokens, the users should set the allowance for enough old tokens to be transferred to the Convert contract. It is encouraged by dApp developers to use `increaseAllowance()` method and not `approve()` to mitigate Allowance Double-Spend Exploit. The event `Converted(address account, uint256 amount)` is emitted.

```solidity
function convert(uint256 amount) external
```

#### Closing the contract

It is possible for the owner of the contract to close the contract. The contract will not allow more conversions, and the owner can withdraw all the remaining token reserves after closing the contract. The event `Closed()` is emitted.

Anyone can call read method to check whether the contract is closed. `closed()` returns whether the contract is closed.

### Staking contract

Staking feature allows StormX to reward the users for any staked tokens. Any rewards accumulated are calculated off-chain and sent to the StormX account holder.

#### Staking

By invoking the function `stake()`, users can stake any amount of STMX tokens. Staked tokens can not be manipulable by any means until they are unstaked. Once the specified amount of tokens are staked successfully, interest starts to be accumulated and calculated off-chain by StormX. The event `Staked(address account, uint256 amount)` is emitted.

```solidity
function stake(uint256 amount) external
```

The amount of staked tokens of an address can be read via `staked(address account)`.

#### Unstaking

By invoking the function `unstake()`, users are able to unstake any amount of staked STMX tokens they have and are able to perform any operations on their unstaked tokens as desired. Once the specified amount of tokens becomes unstaked, those tokens will no longer accumulate interest. The event `Unstaked(address account, uint256 amount)` is emitted.

```solidity
function unstake(uint256 amount) external
```

#### Cooldown period and Penalty

There is a penalty for unstaking the tokens immediately as opposed to setting a cooldown period and waiting. The penalty is 10% by default and is configurable by the owner of the contract. The cooldown period is 14 days by default and is also configurable (with an upper limit of 365 days) by the owner. Any applied penalty is transferred to the treasury address configured at the time of the deployment and can be changed by the owner.

Users have two options when unstaking their tokens. A user can unstake immediately, which incurs a penalty, or they can wait for a cooldown timer to complete and unstake their tokens with no penalty. The penalty is 10% by default and configurable by the contract's owner. The cooldown period is 14 days by default and is also configurable (with an upper limit of 365 days) by the owner. Any applied penalty is transferred to the treasury address configured at the time of the deployment and can be changed by the owner.

To unstake the tokens without penalty, the users must first set the cooldown timer with the amount they want to unstake by invoking `setCooldownTimer(amount)` and wait until the timer runs out. The cooldown and the penalty are snapshotted at the time of staking. Every time the user stakes or restakes tokens, the latest penalty percentage will be used since these variables may have been changed by the owner. The event `SetCooldownTimer(address account, uint256 amount)` is emitted. 

```solidity
function setCooldownTimer(uint256 amount) public
```

If the user completes the cooldown period but changes their mind and no longer wants to unstake their tokens, the user can clear the cooldown period and continue earning the rewards. The user has to invoke `setCooldownTimer` with `0` as an amount, so `setCooldownTimer(0)`.

Anyone can call read methods to retrieve the different cooldown and penalty values.

 1. `staked(address account)` returns the amount of staked tokens the account holds

 2. `timers(address account)` returns the end timestamp after which the account does not have to pay the penalty any more

 3. `amounts(address account)` returns the amount of tokens the account can unstake without paying the penalty

 4. `penalties(address account)` returns snapshotted penalty, which the account can pay during the cooldown period

 5. `cooldown()` returns current cooldown in seconds

 6. `penalty()` returns the current penalty, divided by 100 to get the total percentages

 7. `calculatePenalty(uint256 amount)` returns amount of tokens for the penalty

### Staking Flow Examples

![Staking Flow Diagram](https://user-images.githubusercontent.com/8746962/195395196-b366a74c-d3a3-4190-acca-23107ddad3f4.jpg)

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
GOERLI_TOKEN_INITIAL_SUPPLY=12500000000
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
