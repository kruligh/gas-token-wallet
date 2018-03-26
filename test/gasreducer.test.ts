import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  GasConsumer,
  GasReducer,
  GasReducerArtifacts, GST2
} from 'gas-reducer';

import { ContractContextDefinition } from 'truffle';
import { assertNumberAlmostEqual, assertNumberEqual } from './helpers';

declare const web3: Web3;
declare const artifacts: GasReducerArtifacts;
declare const contract: ContractContextDefinition;

const GST2Contract = artifacts.require('./GasToken2.sol');
const GasConsumerContract = artifacts.require('./GasConsumer.sol');
const GasReducerContract = artifacts.require('./GasReducer.sol');

const magicAccount: Address = '0x470F1C3217A2F408769bca5AB8a5c67A9040664A';
const magicNonce = 125;

contract('GST2', accounts => {
  let gasConsumer: GasConsumer;
  let gst2: GST2;

  before(async () => {
    gasConsumer = await GasConsumerContract.new();
    const actualNonce = await web3.eth.getTransactionCount(magicAccount);
    if (actualNonce >= magicNonce) {
      throw new Error(`Nonce too high. Actual: ${actualNonce} the highest possible: ${magicNonce - 1}`);
    }
    for (let i = actualNonce; i < magicNonce; i++) {
      await gasConsumer.doNothing({ from: magicAccount });
      process.stdout.write('.');
    }
    process.stdout.write('\n');
    gst2 = await GST2Contract.new({ from: magicAccount, nonce: magicNonce });
  });

  describe('init', () => {
    it('Should deploy GST2', async () => {
      assert.isOk(gst2);
    });

    it('Should create magic account', () => {
      assert.isOk(accounts.find(item => item.toUpperCase() === magicAccount.toUpperCase()));
    });
  });
});

contract('GasReducerConsumer', accounts => {
  const owner = accounts[1];

  describe('init', () => {
    it('Should deploy GasConsumer', async () => {
      const gasConsumer = await GasConsumerContract.new({ from: owner });
      assert.isOk(gasConsumer);
    });
  });

  describe('#saveStorage', () => {
    let gasConsumer: GasConsumer;

    beforeEach(async () => {
      gasConsumer = await GasConsumerContract.new({ from: owner });
    });

    it('Should consume constant gas per save count', async () => {
      const expectedGasAmount = 25800;
      const gasEpsilon = 50;
      const callTx = await gasConsumer.saveStorage(0);
      const callGasUsage = callTx.receipt.gasUsed;

      for (let i = 1; i <= 10; i++) {
        const tx = await gasConsumer.saveStorage(i);
        assertNumberAlmostEqual(
          '' + (tx.receipt.gasUsed - callGasUsage) / i,
          expectedGasAmount,
          gasEpsilon
        );
      }
    });
  });
});

contract('GasReducer', accounts => {
  const owner = accounts[1];

  let gst2: GST2;
  let gasReducer: GasReducer;
  beforeEach(async () => {
    gst2 = await GST2Contract.new({ from: owner });
    gasReducer = await GasReducerContract.new(
      gst2.address,
      { from: owner }
    );
  });

  describe('#init', () => {
    it('Should deploy GasReducer', async () => {
      assert.isOk(gasReducer);
    });

    it('Should deploy GasReducer and set GST2', async () => {
      assert.isOk(gasReducer);
      assert.equal(
        await gasReducer.gst2(),
        gst2.address
      );
    });
  });
});

async function mint(
  gst2: GST2,
  owner: Address,
  mintingTimes: number = 10,
  mintingAmount: number = 100
): Promise<number> {

  for (let i = 0; i < mintingTimes; i++) {
    await gst2.mint(mintingAmount, { from: owner });
  }
  assertNumberEqual(
    await gst2.balanceOf(owner),
    mintingTimes * mintingAmount
  );

  return mintingTimes * mintingAmount;
}
