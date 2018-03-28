import { GasReducerArtifacts } from 'gas-reducer';
import * as Web3 from 'web3';

declare const web3: Web3;

export const GST2_MAGIC_ACCOUNT: Address = '0x470F1C3217A2F408769bca5AB8a5c67A9040664A';
export const GST2_MAGIC_NONCE = 125;

declare const artifacts: GasReducerArtifacts;
const GST2Contract = artifacts.require('./GasToken2.sol');
const GasConsumerContract = artifacts.require('./GasConsumer.sol');

export async function deployGST2(owner: Address, nonce: number) {
  const gasConsumer = await GasConsumerContract.new();

  const actualNonce = await web3.eth.getTransactionCount(owner);
  if (actualNonce >= nonce) {
    throw new Error(`Nonce too high. Actual: ${actualNonce} the highest possible: ${nonce - 1}`);
  }
  for (let i = actualNonce; i < nonce; i++) {
    await gasConsumer.doNothing({ from: owner });
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return await GST2Contract.new({ from: owner, nonce });
}
