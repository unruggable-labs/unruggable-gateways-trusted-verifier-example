import { serve } from '@resolverworks/ezccip/serve';
import { Foundry } from '@adraffy/blocksmith';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { describe, afterAll, expect, test } from 'bun:test';
import { EthProver, EthSelfRollup, Gateway, LATEST_BLOCK_TAG } from '@unruggable/gateways';

describe('trusted verifier', async () => {

  const foundry = await Foundry.launch({
    //fork: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    infoLog: false,
  });

  // Use user configured signing key or a default
  let signingKey = process.env.SIGNING_KEY || '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

  const signerWallet = new Wallet(signingKey);

  const rollup = new EthSelfRollup(foundry.provider);
  rollup.latestBlockTag = LATEST_BLOCK_TAG;
  const gateway = new Gateway(rollup);
  const ccip = await serve(gateway, { protocol: 'raw', log: false });
  
  afterAll(foundry.shutdown);
  
  const IntegerPointer = await foundry.deploy({
    file: 'IntegerPointer',
    args: [1],
  });

  const AddressPointer = await foundry.deploy({
    file: 'AddressPointer',
    args: [IntegerPointer.target],
  });

  // setup verifier
  const GatewayVM = await foundry.deploy({ file: 'GatewayVM' });
  const hooks = await foundry.deploy({ file: 'EthVerifierHooks' });
  
  const verifier = await foundry.deploy({
    file: 'SelfVerifier',
    args: [[ccip.endpoint], rollup.defaultWindow, hooks],
    libs: { GatewayVM },
  });

  //console.log(ccip.endpoint);

  const ReaderContract = await foundry.deploy({
    file: 'ReaderContract',
    args: [verifier.target, ccip.endpoint],
  });

  // Also demos setSlot()
  test('setTarget()', async () => {
    expect(await ReaderContract.setTargetExample(IntegerPointer.target, { enableCcipRead: true })).toEqual(1n);
  });

  test('target() dynamically sourced address', async () => {
    expect(await ReaderContract.targetDynamicallyFoundAddressExample(AddressPointer.target, { enableCcipRead: true })).toEqual(1n);
  });
});
