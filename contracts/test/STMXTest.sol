// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "../STMX.sol";

contract STMXTest {
    address deployer = address(msg.sender);
    STMX token;

    constructor() {
        token = new STMX();
        token.initialize('StormX', 'STMX', 100 ether, deployer);
    }

    function echidna_revert_anotherInitialization() public returns (bool) {
        token.initialize('StormX', 'STMX', 100 ether, deployer);
        return true;
    }

    // TODO: add more properties
}
