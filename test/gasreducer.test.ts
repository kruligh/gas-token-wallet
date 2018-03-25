import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  GasReducer,
  GasReducerArtifacts
} from 'gas-reducer';

import { ContractContextDefinition } from 'truffle';
import {
  assertNumberEqual,
  assertReverts,
  findLastLog,
  ZERO_ADDRESS
} from './helpers';

declare const web3: Web3;
declare const artifacts: GasReducerArtifacts;
declare const contract: ContractContextDefinition;

const GasReducerContract = artifacts.require('./GasReducer.sol');
const GST2Contract = artifacts.require('./GasToken2.sol');

contract('GasReducer', accounts => {

  const owner = accounts[9];

  describe('Init', () => {
    it('Should deploy GST2', async () => {
      const gst2 = await GST2Contract.new({ from: owner });
      console.log(gst2);
      assert.isOk(gst2);
    });
  });
});
