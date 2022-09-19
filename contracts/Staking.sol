// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract Staking is Ownable {
    // token used for staking
    IERC20Upgradeable public immutable token;

    // amounts staked, address to value raised mapping
    mapping(address => uint256) public staked;

    // timers at which the wallets staked last time
    mapping(address => uint256) public timers;

    // cooldown period before which the penalty is applied
    uint256 public cooldown = 14 days;

    // penalty for unstaking, divide by 100 to get full percents
    uint16 public penalty = 1000;

    // wallet to which the tokens go to for penalties
    address public treasury;

    error NotEnoughBalance();
    error NotEnoughStakedBalance();
    error ZeroAmount();

    event CooldownChanged(uint256 newCooldown);
    event PenaltyChanged(uint16 newPenalty);
    event TreasuryChanged(address newTreasury);
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);

    /**
     * @param token_ staking token address
     * @param treasury_ address to the treasury wallet
     */
    constructor(IERC20Upgradeable token_, address treasury_) {
        token = token_;
        treasury = treasury_;
    }

    /**
     * @notice Allows any wallet to stake available tokens.
     * @param amount amount of tokens to stake
     */
    function stake(uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }
        if (amount > token.balanceOf(msg.sender)) {
            revert NotEnoughBalance();
        }
        staked[msg.sender] += amount;
        timers[msg.sender] = block.timestamp;
        token.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Allows any wallet to unstake staked tokens.
     *         There is a penalty of unstaking before the cooldown period.
     * @param amount amount of tokens to unstake
     */
    function unstake(uint256 amount) external {
        if (amount == 0) {
            revert ZeroAmount();
        }
        if (amount > staked[msg.sender]) {
            revert NotEnoughStakedBalance();
        }
        staked[msg.sender] -= amount;
        uint256 penaltyAmount = _calculatePenalty(amount);
        if (penaltyAmount > 0) {
            token.transfer(treasury, penaltyAmount);
        }
        token.transfer(msg.sender, amount - penaltyAmount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Allows the owner to set the cooldown period.
     * @param newCooldown new cooldown period
     */
    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldown = newCooldown;
        emit CooldownChanged(newCooldown);
    }

    /**
     * @notice Allows the owner to set the penalty.
     * @param newPenalty new penalty
     */
    function setPenalty(uint16 newPenalty) external onlyOwner {
        penalty = newPenalty;
        emit PenaltyChanged(newPenalty);
    }

    /**
     * @notice Allows the owner to set the treasury address.
     * @param newTreasury new treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
        emit TreasuryChanged(newTreasury);
    }

    /**
     * @notice Calculates a penalty based on given sender and amount.
     * @param amount amount on which the penalty is calculated
     * @return amount amount of penalty
     */
    function _calculatePenalty(uint256 amount) private view returns (uint256) {
        if (timers[msg.sender] > block.timestamp - cooldown) {
            return (amount * penalty / 100) / 100;
        } else {
            return 0;
        }
    }
}
