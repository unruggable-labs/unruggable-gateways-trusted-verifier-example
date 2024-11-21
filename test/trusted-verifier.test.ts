import { serve } from '@resolverworks/ezccip/serve';
import { Foundry } from '@adraffy/blocksmith';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { describe, afterAll, expect, test } from 'bun:test';
import { EthProver, TrustedRollup, Gateway } from '@unruggable/gateways';

describe('trusted verifier', async () => {

  const foundry = await Foundry.launch({
    fork: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    infoLog: false,
  });
  afterAll(foundry.shutdown);

  // Use user configured signing key or a default
  let signingKey = process.env.SIGNING_KEY || '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

  const signerWallet = new Wallet(signingKey);
  const SIGNER_ADDRESS = signerWallet.address;

  const rollup = new TrustedRollup(
    new JsonRpcProvider(`https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`),
    EthProver,
    signerWallet.signingKey
  );

  rollup.latestBlockTag = 'latest';
  afterAll(foundry.shutdown);

  // Run a TrustedRollup gateway
  const gateway = new Gateway(rollup);
  const ccip = await serve(gateway, { protocol: 'raw', log: true });

  const GATEWAY_URL = ccip.endpoint; 
  
  // Uncomment the following line if running a gateway locally for debugging purposes
  // 'http://localhost:8000';

  afterAll(ccip.shutdown);

  // Data contract address on Optimism Sepolia
  // https://optimistic.etherscan.io/address/0xf9d79d8c09d24e0C47E32778c830C545e78512CF
  const DATA_CONTRACT_ADDRESS = '0xf9d79d8c09d24e0C47E32778c830C545e78512CF';

  // EthVerifierHooks contract address on Sepolia
  const ETH_HOOKS_ADDRESS = "0x74fc89809D6A09DCA6aee6AbD1f2d78420a9351F";

  // This is the address of the TrustedVerifier contract deployed on Sepolia
  const VERIFIER_ADDRESS = '0xa4a2d86b30896fe5c4f2a7f2ee0bde3dbff26924';

  const adminWallet = await foundry.ensureWallet('admin');
  const TRUSTED_VERIFIER_ABI = [
    "function setConfig(address fetcher,string[] memory urls,uint256 expSec,address hooks)",
    "function setSigner(address fetcher,address signer,bool allow)"
  ];

  // Instatiate an instance of the deployed TrustedVerifier contract
  const TrustedVerifier = new Contract(VERIFIER_ADDRESS, TRUSTED_VERIFIER_ABI, adminWallet);

  const ReaderContract = await foundry.deploy({
    file: 'ReaderContract',
    args: [VERIFIER_ADDRESS, DATA_CONTRACT_ADDRESS],
  });

  //Configure the verifier for your deployed contract
  await foundry.confirm(TrustedVerifier.setConfig(ReaderContract, [GATEWAY_URL], 6 * 3600, ETH_HOOKS_ADDRESS));
  //Configure the signer for your deployed contract
  await foundry.confirm(TrustedVerifier.setSigner(ReaderContract, SIGNER_ADDRESS, true));

  test('signed data return', async () => {
    expect(await ReaderContract.read({ enableCcipRead: true })).toEqual(49n);
  });
});
