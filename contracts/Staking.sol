// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract Staking is Ownable {
    // token used for staking
    IERC20Upgradeable public immutable token;

    // amounts staked, address to value staked mapping
    mapping(address => uint256) public staked;

    // timestamps timers until which the penalty is applied
    mapping(address => uint256) public timers;

    // snapshotted penalties, address to penalty mapping
    mapping(address => uint16) public penalties;

    // cooldown period
    uint256 public cooldown = 14 days;

    // penalty for unstaking, divided by 100 to get the total percentages
    uint16 public penalty = 1000;

    // wallet to which the tokens go for penalties
    address public treasury;

    error NotEnoughBalance();
    error NotEnoughStakedBalance();
    error PenaltyOverflow();
    error ZeroAmount();

    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);
    event CooldownChanged(uint256 newCooldown);
    event PenaltyChanged(uint16 newPenalty);
    event TreasuryChanged(address newTreasury);

    /**
     * @param token_ staking token address
     * @param treasury_ address for the treasury wallet
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
        timers[msg.sender] = block.timestamp + cooldown;
        penalties[msg.sender] = penalty;
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Allows any wallet to unstake staked tokens.
     *         There is a penalty for unstaking before the cooldown period.
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
        uint256 penaltyAmount = calculatePenalty(amount);
        if (penaltyAmount > 0) {
            require(token.transfer(treasury, penaltyAmount), "penalty transfer failed");
        }
        if (amount != penaltyAmount) {
            require(token.transfer(msg.sender, amount - penaltyAmount), "transfer failed");
        }
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
     * @notice Allows the owner to set the penalty (maximum of 10000 = 100%).
     * @param newPenalty new penalty
     */
    function setPenalty(uint16 newPenalty) external onlyOwner {
        if (newPenalty > 10000) {
            revert PenaltyOverflow();
        }
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
     * @notice Calculates a penalty based on the given sender and amount.
     *         Can be used to return the penalty amount without actually unstaking.
     * @param amount amount on which the penalty is calculated
     * @return amount amount of penalty
     */
    function calculatePenalty(uint256 amount) public view returns (uint256) {
        if (timers[msg.sender] > block.timestamp) {
            return (amount * penalties[msg.sender] / 100) / 100;
        } else {
            return 0;
        }
    }
}
