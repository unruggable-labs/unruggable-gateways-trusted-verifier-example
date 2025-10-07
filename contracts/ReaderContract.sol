// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@unruggable/contracts/GatewayFetchTarget.sol";
import "@unruggable/contracts/GatewayFetcher.sol";
import {Ownable} from '@openzeppelin/contracts/access/Ownable.sol';

contract ReaderContract is GatewayFetchTarget, Ownable {

	using GatewayFetcher for GatewayRequest;
	
	IGatewayVerifier immutable _verifier;
	string[] public _gateways;
	
	constructor(IGatewayVerifier verifier, string memory gateway) Ownable(msg.sender) {
		_verifier = verifier;
		_gateways.push(gateway);
	}

	/**
	 * This example demonstrates reading a uint256 from slot 0 of the target contract
	 */
	function setTargetExample(address _target) external view returns (uint256) {

		GatewayRequest memory req = GatewayFetcher.newRequest(1)
            .setTarget(_target) // This indicates that we want to read data from this contract
            .setSlot(0) // Data in the first slot, index 0
            .read() // This command reads the data from specific slot of the target contract
            .setOutput(0); // This specifies that we want to return it at output index 0

		bytes memory carry;

		fetch(_verifier, req, this.uint256Callback.selector, carry, _gateways);
	}

	/**
	 * This example reads an address from slot 0 of the target contract
	 * It then reads a uint256 from slot 0 of the contract found at that address
	 */
	function targetDynamicallyFoundAddressExample(address _pointer) external view returns (uint256) {

		GatewayRequest memory req = GatewayFetcher.newRequest(1)
            .setTarget(_pointer) // This indicates that we want to read data from this contract
            .setSlot(0) // Data in the first slot, index 0
            .read() // This command reads the data from specific slot of the target contract
			.target()
			.read()
            .setOutput(0); // This specifies that we want to return it at output index 0

		fetch(_verifier, req, this.uint256Callback.selector);
	}


	function addSlotExample(address _pointer) external view returns (uint256) {

		GatewayRequest memory req = GatewayFetcher.newRequest(1)
            .setTarget(_pointer) // This indicates that we want to read data from this contract
            .setSlot(0) // Data in the first slot, index 0
            .read() // This command reads the data from specific slot of the target contract
			.target()
			.read()
            .setOutput(0); // This specifies that we want to return it at output index 0

		fetch(_verifier, req, this.uint256Callback.selector);
	}



	function uint256Callback(bytes[] memory values, uint8 /*exitCode*/, bytes memory /*carry*/) external pure returns (uint256) {
        return abi.decode(values[0], (uint256));
	}
}
