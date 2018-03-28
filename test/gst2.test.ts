import { assert } from 'chai';
import { GST2 } from 'gas-reducer';
import { ContractContextDefinition } from 'truffle';
import * as Web3 from 'web3';
import { deployGST2, GST2_MAGIC_ACCOUNT, GST2_MAGIC_NONCE } from './helpers/gst2.helpers';

declare const web3: Web3;
declare const contract: ContractContextDefinition;

contract('GST2', accounts => {
  let gst2: GST2;

  before(async () => {
    gst2 = await deployGST2(GST2_MAGIC_ACCOUNT, GST2_MAGIC_NONCE);
  });

  describe('init', () => {
    it('Should deploy GST2', async () => {
      assert.isOk(gst2);
    });

    it('Should create magic account', () => {
      assert.isOk(accounts.find(item => item.toUpperCase() === GST2_MAGIC_ACCOUNT.toUpperCase()));
    });
  });
});
