// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../Staking.sol";
import "../STMX.sol";

contract StakingTest {
    address deployer = address(msg.sender);
    Staking staking;
    STMX token;

    constructor() {
        token = new STMX();
        token.initialize('StormX', 'STMX', 100 ether, deployer);
        staking = new Staking(token, deployer);
    }

    function echidna_cannotChangeToken() public view returns (bool) {
        return staking.token() == token;
    }

    // TODO: add more properties
}
