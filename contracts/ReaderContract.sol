// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@unruggable/gateways/GatewayFetchTarget.sol";
import "@unruggable/gateways/GatewayFetcher.sol";
import {Ownable} from '@openzeppelin/access/Ownable.sol';


contract ReaderContract is GatewayFetchTarget, Ownable {

	using GatewayFetcher for GatewayRequest;
	
	IGatewayVerifier immutable _verifier;
	address immutable _target;
	
	constructor(IGatewayVerifier verifier, address target) Ownable(msg.sender) {
		_verifier = verifier;
		_target = target;
	}

	function read() external view returns (uint256) {

		GatewayRequest memory req = GatewayFetcher.newRequest(1)
            .setTarget(_target)
            .setSlot(0)
            .read()
            .setOutput(0);

		fetch(_verifier, req, this.readCallback.selector);
	}

	function readCallback(bytes[] memory values, uint8 /*exitCode*/, bytes memory /*carry*/) external pure returns (uint256) {
        return abi.decode(values[0], (uint256));
	}

}
