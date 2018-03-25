import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  GasReducer,
  GasReducerArtifacts
} from 'gas-reducer';

import { ContractContextDefinition } from 'truffle';

declare const web3: Web3;
declare const artifacts: GasReducerArtifacts;
declare const contract: ContractContextDefinition;

const GST2Contract = artifacts.require('./GasToken2.sol');
const GasConsumerContract = artifacts.require('./GasConsumer.sol');
const GasReducerContract = artifacts.require('./GasReducer.sol');

contract('GST2', accounts => {
  const owner = accounts[9];

  describe('#init', () => {
    it('Should deploy GST2', async () => {
      const gst2 = await GST2Contract.new({ from: owner });
      assert.isOk(gst2);
    });
  });
});

contract('GasReducerConsumer', accounts => {
  const owner = accounts[9];

  describe('#init', () => {
    it('Should deploy GasConsumer', async () => {
      const gasConsumer = await GasConsumerContract.new({ from: owner });
      assert.isOk(gasConsumer);
    });
  });
});

contract('GasReducer', accounts => {
  const owner = accounts[9];

  describe('#init', () => {
    it('Should deploy GasReducer', async () => {
      const gasReducer = await GasReducerContract.new({ from: owner });
      assert.isOk(gasReducer);
    });
  });
});
