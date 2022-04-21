// contracts/Limoverse.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Limoverse is ERC20 {
    constructor() ERC20("LIMOVERSE", "LIMO") {
        _mint(msg.sender, 10000000000 * 10 ** decimals());
    }
}
