// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract Convert {
    // the old non-upgradable token used for the conversion
    IERC20 public oldToken;

    // the new upgradable token used for the conversion
    IERC20Upgradeable public newToken;

    error NotEnoughOldTokenBalance();
    error OldTokenTransferFailed();

    event Converted(address indexed account, uint256 amount);

    /**
     * @param oldToken_ old token address
     * @param newToken_ new token address
     */
    constructor(IERC20 oldToken_, IERC20Upgradeable newToken_) {
        oldToken = oldToken_;
        newToken = newToken_;
    }

    /**
     * @notice Converts the old tokens to the new ones by transfering the old tokens
     *         to the contract and then the contract will send the new tokens back.
     * @param amount amount of tokens to convert
     */
    function convert(uint256 amount) external returns(bool) {
        if (oldToken.balanceOf(msg.sender) < amount) {
            revert NotEnoughOldTokenBalance();
        }
        if (!oldToken.transferFrom(msg.sender, address(this), amount)) {
            revert OldTokenTransferFailed();
        }
        newToken.transfer(msg.sender, amount);
        emit Converted(msg.sender, amount);
        return true;
    }
}
