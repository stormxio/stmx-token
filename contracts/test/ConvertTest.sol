// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./TestERC20.sol";
import "../Convert.sol";
import "../STMX.sol";

contract ConvertTest {
    ERC20 oldToken;
    STMX newToken;
    Convert convert;

    constructor() {
        oldToken = new TestERC20();
        newToken = new STMX();
        convert = new Convert(oldToken, newToken);
        newToken.initialize('StormX', 'STMX', 100 ether, address(convert));
    }

    function echidna_shouldHaveFixedTokenSupplies() public view returns (bool) {
        return oldToken.totalSupply() + newToken.totalSupply() == 200 ether;
    }
}
