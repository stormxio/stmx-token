// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract STMX is Initializable, OwnableUpgradeable, ERC20Upgradeable {
    error InputLengthsDoNotMatch();

    /**
     * @dev initialize function is used instead of constructors because
     *      no constructors can be used in upgradable contracts
     * @param name_ name of the token
     * @param symbol_ symbol of the token
     * @param initialSupply_ amount of tokens to be minted and transfered to {owner}
     * @param owner_ contract owner, must be non-zero
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address owner_
    ) public virtual initializer {
        __Ownable_init_unchained();
        __ERC20_init_unchained(name_, symbol_);
        _mint(owner_, initialSupply_);
    }

    /**
     * @dev Transfers tokens in batch
     *      Arrays with a very large number of elements could cause this function
     *      to revert due to exceeding the block size during execution.
     * @param recipients an array of recipient addresses
     * @param values an array of specified amount of tokens to be transferred
     * @return success status of the batch transferring
     */
    function transfers(
        address[] memory recipients,
        uint256[] memory values
    ) public returns (bool) {
        if (recipients.length != values.length) {
            revert InputLengthsDoNotMatch();
        }
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], values[i]);
        }
        return true;
    }
    // https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
    uint256[50] private __gap;
}
