// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AddressPointer {
    address public pointer;

    constructor(address a) {
        pointer = a;
    }
}
