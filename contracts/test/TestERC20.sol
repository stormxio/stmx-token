// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
  constructor() ERC20("TestToken", "TT") {
    _mint(msg.sender, 100 ether);
  }

  function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
    // simulate failed transfer for amount == 0
    if (amount == 0) {
      return false;
    }
    // use regular transferFrom for all the other amounts
    return super.transferFrom(sender, recipient, amount);
  }
}
