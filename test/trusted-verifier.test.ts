import { serve } from '@resolverworks/ezccip/serve';
import { Foundry } from '@adraffy/blocksmith';
import { Contract, Wallet } from 'ethers';
import { describe, afterAll, expect, test } from 'bun:test';
import { EthProver, TrustedRollup, Gateway } from '@unruggable/gateways';

describe('trusted verifier', async () => {

  const foundry = await Foundry.launch({
    infoLog: false,
  });

  // 0xd00d726b2aD6C81E894DC6B87BE6Ce9c5572D2cd
  let signingKey = '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

  const signerWallet = new Wallet(signingKey);
  //const SIGNER_ADDRESS = signerWallet.address;

  // Create the rollup instance specifying the signers signing key
  const rollup = new TrustedRollup(
    foundry.provider,
    EthProver,
    signerWallet.signingKey 
  );

  rollup.latestBlockTag = 'latest';
  afterAll(foundry.shutdown);

  // Run a TrustedRollup gateway
  const gateway = new Gateway(rollup);
  const ccip = await serve(gateway, { protocol: 'raw', log: true });  

  afterAll(ccip.shutdown);


   // setup verifier
   const GatewayVM = await foundry.deploy({ file: 'GatewayVM' });
   const hooks = await foundry.deploy({ file: 'EthVerifierHooks' });

   // Deploy the TrustedVerifier contract
   // Pass the signer address that we will verify messages are signed by
  const verifier = await foundry.deploy({
    file: 'TrustedVerifier',
    args: [hooks, [ccip.endpoint], [rollup.signerAddress], 6 * 3600],
    libs: { GatewayVM },
  });

  // Deploy the IntegerPointer contract
  const IntegerPointer = await foundry.deploy({
    file: 'IntegerPointer',
    args: [1],
  });

  // Deploy the AddressPointer contract
  const AddressPointer = await foundry.deploy({
    file: 'AddressPointer',
    args: [IntegerPointer.target],
  });

  // Deploy the ReaderContract contract
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
