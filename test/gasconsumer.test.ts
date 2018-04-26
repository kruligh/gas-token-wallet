import { assert } from 'chai';
import { GasConsumer, GasReducerArtifacts } from 'gas-reducer';
import { ContractContextDefinition } from 'truffle';
import * as Web3 from 'web3';
import { assertNumberAlmostEqual } from './helpers/common.helpers';

declare const web3: Web3;
declare const artifacts: GasReducerArtifacts;
declare const contract: ContractContextDefinition;

const GasConsumerContract = artifacts.require('./GasConsumer.sol');

contract('GasConsumer', accounts => {
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
      const expectedGasAmount = 25400;
      const gasEpsilon = 100;
      const callTx = await gasConsumer.saveStorage(0);
      const callGasUsage = callTx.receipt.gasUsed;

      for (let i = 1; i <= 100; i += 10) {
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
