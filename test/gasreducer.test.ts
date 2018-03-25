import { assert } from 'chai';

import * as Web3 from 'web3';

import {
  GasReducer,
  Gas-reducerArtifacts,
} from 'gas-reducer';

import { ContractContextDefinition } from 'truffle';
import {
  assertNumberEqual,
  assertReverts,
  findLastLog,
  ZERO_ADDRESS
} from './helpers';

declare const web3: Web3;
declare const artifacts: Gas-reducerArtifacts;
declare const contract: ContractContextDefinition;

const GasReducerContract = artifacts.require('./GasReducer.sol');

contract('GasReducer', accounts => {
  
});
