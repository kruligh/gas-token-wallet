import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';
import {
  ConfirmationEvent,
  ExecutionEvent,
  ExecutionFailureEvent,
  GasConsumer,
  GasReducerArtifacts,
  GasTokenAdditionEvent,
  GST2,
  MultiSigWallet,
  OwnerAdditionEvent,
  OwnerRemovalEvent,
  RequirementChangeEvent,
  RevocationEvent,
  SubmissionEvent
} from 'gas-reducer';
import { propOr } from 'ramda';
import { ContractContextDefinition, TransactionResult } from 'truffle';
import * as Web3 from 'web3';
import { AnyNumber } from 'web3';
import { assertNumberEqual, assertReverts, findLastLog } from './helpers/common.helpers';
import { deployGST2, GST2_MAGIC_ACCOUNT, GST2_MAGIC_NONCE } from './helpers/gst2.helpers';
import { executeWalletFunction, findLastTransactionId, getData } from './helpers/multisigwallet.helpers';

declare const web3: Web3;
declare const artifacts: GasReducerArtifacts;
declare const contract: ContractContextDefinition;

const MultiSigWalletContract = artifacts.require('./MultiSigWallet.sol');
const GasConsumerContract = artifacts.require('./GasConsumer.sol');

contract('MultiSigWallet', accounts => {
  const owners = accounts.slice(0, 3);
  const required = 3;

  let wallet: MultiSigWallet;

  async function submitAddOwner(options?: any) {
    const data = await getData(
      wallet.addOwner,
      propOr(owners[0], 'newOwner', options)
    );
    return await wallet.submitTransaction(
      propOr(wallet.address, 'to', options),
      propOr(0, 'value', options),
      data,
      { from: propOr(owners[0], 'from', options) }
    );
  }

  async function executeChangeRequirements(
    newRequirements: AnyNumber,
    options?: any
  ) {
    return await executeWalletFunction(
      propOr(wallet, 'wallet', options),
      wallet.changeRequirement,
      propOr(owners[0], 'from', options),
      newRequirements
    );
  }

  async function executeReplaceOwner(
    oldOwner: Address,
    newOwner: Address,
    options?: any
  ) {
    return await executeWalletFunction(
      propOr(wallet, 'wallet', options),
      wallet.replaceOwner,
      propOr(owners[0], 'from', options),
      oldOwner,
      newOwner
    );
  }

  async function executeRemoveOwner(owner: Address, options?: any) {
    return await executeWalletFunction(
      propOr(wallet, 'wallet', options),
      wallet.removeOwner,
      propOr(owners[0], 'from', options),
      owner
    );
  }

  async function executeAddOwner(newOwner: Address, options?: any) {
    return await executeWalletFunction(
      propOr(wallet, 'wallet', options),
      wallet.addOwner,
      propOr(owners[0], 'from', options),
      newOwner
    );
  }

  beforeEach(async () => {
    wallet = await MultiSigWalletContract.new(owners, required, {
      from: owners[0]
    });
  });

  describe('#ctor', () => {
    it('should set required', async () => {
      assertNumberEqual(await wallet.required(), required);
    });

    it('should set owners', async () => {
      assert.deepEqual(await wallet.getOwners(), owners);
    });

    it('should not have any transactions', async () => {
      assertNumberEqual(await wallet.getTransactionCount(true, true), 0);
    });

    it('should revert for empty list of owners', async () => {
      await assertReverts(async () => {
        await MultiSigWalletContract.new([], 3);
      });
    });

    it('should revert for zero requirement', async () => {
      await assertReverts(async () => {
        await MultiSigWalletContract.new(owners, 0);
      });
    });
  });

  describe('#submitTransaction', () => {
    it('should emit SubmissionEvent', async () => {
      const tx = await submitAddOwner({ from: accounts[0] });
      const log = findLastLog(tx, 'Submission');
      assert.isOk(log);

      const event = log.args as SubmissionEvent;
      assertNumberEqual(event.transactionId, 0);
    });

    it('should store one pending transaction', async () => {
      const tx = await submitAddOwner({ from: accounts[0] });
      const transactionCount = await wallet.getTransactionCount(true, false);

      assertNumberEqual(transactionCount, 1);

      const transactionId = findLastTransactionId(tx);
      const transactionIds = await wallet.getTransactionIds(0, 1, true, false);
      assert.deepEqual(transactionIds, [transactionId]);
    });

    it('should set one valid confirmation for transaction', async () => {
      const tx = await submitAddOwner({ from: accounts[0] });
      const transactionId = findLastTransactionId(tx);
      const confirmationCount = await wallet.getConfirmationCount(
        transactionId
      );

      assertNumberEqual(confirmationCount, 1);

      const confirmations = await wallet.getConfirmations(transactionId);
      assert.deepEqual(confirmations, [owners[0]]);
    });

    it('should revert for non-owner', async () => {
      await assertReverts(async () => {
        await submitAddOwner({ from: accounts[9] });
      });
    });
  });

  describe('#confirmTransaction', () => {
    let transactionId: BigNumber;

    beforeEach(async () => {
      const tx = await submitAddOwner({ newOwner: accounts[9] });
      transactionId = findLastTransactionId(tx);
    });

    it('should emit ConfirmationEvent', async () => {
      const tx = await wallet.confirmTransaction(transactionId, {
        from: owners[1]
      });

      const log = findLastLog(tx, 'Confirmation');
      assert.isOk(log);

      const event = log.args as ConfirmationEvent;
      assert.equal(event.sender, owners[1]);
      assertNumberEqual(event.transactionId, transactionId);
    });

    it('should set new valid confirmation for transaction', async () => {
      await wallet.confirmTransaction(transactionId, { from: owners[1] });
      const confirmationCount = await wallet.getConfirmationCount(
        transactionId
      );

      assertNumberEqual(confirmationCount, 2);

      const confirmations = await wallet.getConfirmations(transactionId);
      assert.deepEqual(confirmations, [owners[0], owners[1]]);
    });

    it('should revert for non-owner', async () => {
      await assertReverts(async () => {
        await wallet.confirmTransaction(transactionId, { from: accounts[9] });
      });
    });

    it('should revert for non-existing transaction', async () => {
      await assertReverts(async () => {
        await wallet.confirmTransaction(2, { from: owners[0] });
      });
    });

    it('should revert for duplicated confirmation', async () => {
      await assertReverts(async () => {
        await wallet.confirmTransaction(transactionId, { from: owners[0] });
      });
    });
  });

  describe('#revokeConfirmation', () => {
    let transactionId: BigNumber;

    beforeEach(async () => {
      const tx = await submitAddOwner({ newOwner: accounts[9] });
      transactionId = findLastTransactionId(tx);
    });

    it('should emit RevocationEvent', async () => {
      const tx = await wallet.revokeConfirmation(transactionId, {
        from: owners[0]
      });

      const log = findLastLog(tx, 'Revocation');
      assert.isOk(log);

      const event = log.args as RevocationEvent;
      assert.equal(event.sender, owners[0]);
      assertNumberEqual(event.transactionId, transactionId);
    });

    it('should revoke confirmation for transaction', async () => {
      await wallet.revokeConfirmation(transactionId, {
        from: owners[0]
      });

      const confirmationCount = await wallet.getConfirmationCount(
        transactionId
      );

      assertNumberEqual(confirmationCount, 0);
    });

    it('should revert for non-owner', async () => {
      await assertReverts(async () => {
        await wallet.revokeConfirmation(1, { from: accounts[9] });
      });
    });

    it('should revert for non-existing transaction', async () => {
      await assertReverts(async () => {
        await wallet.revokeConfirmation(2, { from: owners[0] });
      });
    });

    it('should revert for not confirmed transaction', async () => {
      await assertReverts(async () => {
        await wallet.revokeConfirmation(2, { from: owners[0] });
      });
    });
  });

  describe('#executeTransaction', () => {
    context('Standard transaction', () => {
      let transactionId: BigNumber;

      beforeEach(async () => {
        const tx = await submitAddOwner({ newOwner: accounts[9] });
        transactionId = findLastTransactionId(tx);
        await wallet.confirmTransaction(transactionId, { from: owners[1] });
      });

      it('should emit ExecutionEvent', async () => {
        const tx = await wallet.confirmTransaction(transactionId, {
          from: owners[2]
        });

        const log = findLastLog(tx, 'Execution');
        assert.isOk(log);

        const event = log.args as ExecutionEvent;
        assertNumberEqual(event.transactionId, transactionId);
      });

      it('should set transaction as executed', async () => {
        await wallet.confirmTransaction(transactionId, {
          from: owners[2]
        });

        const transactionCount = await wallet.getTransactionCount(false, true);
        assertNumberEqual(transactionCount, 1);

        const transactionIds = await wallet.getTransactionIds(0, 1, false, true);
        assert.deepEqual(transactionIds, [transactionId]);
      });

      it('should revert for non-owner', async () => {
        await assertReverts(async () => {
          await wallet.executeTransaction(transactionId, { from: accounts[9] });
        });
      });

      it('should revert for non-existing transaction', async () => {
        await assertReverts(async () => {
          await wallet.executeTransaction(2, { from: owners[0] });
        });
      });

      it('should revert when transaction is not confirmed', async () => {
        await assertReverts(async () => {
          await wallet.executeTransaction(transactionId, { from: owners[2] });
        });
      });
    });
  });

  describe('#changeRequirement', () => {
    const newRequired = 2;

    it('should emit ExecutionFailure for zero requirements', async () => {
      const result = await executeChangeRequirements(0);
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit ExecutionFailure for too high requirement', async () => {
      const result = await executeChangeRequirements(4);
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit RequirementChange', async () => {
      const result = await executeChangeRequirements(newRequired);
      const log = findLastLog(result.lastTransaction, 'RequirementChange');
      assert.isOk(log);

      const event = log.args as RequirementChangeEvent;
      assertNumberEqual(event.required, newRequired);
    });

    it('should change required attribute', async () => {
      await executeChangeRequirements(newRequired);
      assertNumberEqual(await wallet.required(), newRequired);
    });

    it('should revert for non-wallet', async () => {
      await assertReverts(async () => {
        await wallet.changeRequirement(newRequired);
      });
    });
  });

  describe('#replaceOwner', () => {
    const oldOwner = owners[0];
    const newOwner = accounts[4];

    it('should emit ExecutionFailure for non-owner', async () => {
      const result = await executeReplaceOwner(newOwner, newOwner);
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args as ExecutionFailureEvent;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit ExecutionFailure for same new owner', async () => {
      const result = await executeReplaceOwner(oldOwner, oldOwner);
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args as ExecutionFailureEvent;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit OwnerRemovalEvent', async () => {
      const result = await executeReplaceOwner(oldOwner, newOwner);
      const log = findLastLog(result.lastTransaction, 'OwnerRemoval');
      assert.isOk(log);

      const event = log.args as OwnerRemovalEvent;
      assert.equal(event.owner, oldOwner);
    });

    it('should emit OwnerAdditionEvent', async () => {
      const result = await executeReplaceOwner(oldOwner, newOwner);
      const log = findLastLog(result.lastTransaction, 'OwnerAddition');
      assert.isOk(log);

      const event = log.args as OwnerAdditionEvent;
      assert.equal(event.owner, newOwner);
    });

    it('should remove old owner', async () => {
      await executeReplaceOwner(oldOwner, newOwner);

      assert.notInclude(await wallet.getOwners(), oldOwner);
    });

    it('should add new owner', async () => {
      await executeReplaceOwner(oldOwner, newOwner);

      assert.deepEqual(await wallet.getOwners(), [
        newOwner,
        owners[1],
        owners[2]
      ]);
    });

    it('should revert for non-wallet', async () => {
      await assertReverts(async () => {
        await wallet.replaceOwner(oldOwner, newOwner);
      });
    });
  });

  describe('#removeOwner', () => {
    const ownerToRemove = owners[1];

    it('should emit ExecutionFailure for non-owner', async () => {
      const result = await executeRemoveOwner(accounts[4]);
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args as ExecutionFailureEvent;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit OwnerRemovalEvent', async () => {
      const result = await executeRemoveOwner(ownerToRemove);
      const log = findLastLog(result.lastTransaction, 'OwnerRemoval');
      assert.isOk(log);

      const event = log.args as OwnerRemovalEvent;
      assert.equal(event.owner, ownerToRemove);
    });

    it('should remove old owner', async () => {
      await executeRemoveOwner(ownerToRemove);

      assert.notInclude(await wallet.getOwners(), ownerToRemove);
    });

    it('should revert for non-wallet', async () => {
      await assertReverts(async () => {
        await wallet.removeOwner(ownerToRemove);
      });
    });
  });

  describe('#addOwner', () => {
    const newOwner = accounts[4];

    it('should emit ExecutionFailure for invalid address', async () => {
      const result = await executeAddOwner('0x0');
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args as ExecutionFailureEvent;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit ExecutionFailure for existing new owner', async () => {
      const result = await executeAddOwner(owners[0]);
      const log = findLastLog(result.lastTransaction, 'ExecutionFailure');
      assert.isOk(log);

      const event = log.args as ExecutionFailureEvent;
      assertNumberEqual(event.transactionId, result.transactionId);
    });

    it('should emit OwnerAdditionEvent', async () => {
      const result = await executeAddOwner(newOwner);
      const log = findLastLog(result.lastTransaction, 'OwnerAddition');
      assert.isOk(log);

      const event = log.args as OwnerAdditionEvent;
      assert.equal(event.owner, newOwner);
    });

    it('should add new owner', async () => {
      await executeAddOwner(newOwner);

      assert.deepEqual(await wallet.getOwners(), [
        owners[0],
        owners[1],
        owners[2],
        newOwner
      ]);
    });

    it('should revert for non-wallet', async () => {
      await assertReverts(async () => {
        await wallet.addOwner(newOwner);
      });
    });
  });

});

contract('MultiSigWallet gas token usage', (accounts) => {
  const owner = accounts[1];
  const ownerSecond = accounts[2];

  let gst2: GST2;
  let gasConsumer: GasConsumer;

  before(async () => {
    gst2 = await deployGST2(GST2_MAGIC_ACCOUNT, GST2_MAGIC_NONCE);
    gasConsumer = await GasConsumerContract.new({ from: owner });
  });

  context('gas token maintain', () => {
    const required = 1;

    let wallet: MultiSigWallet;
    let addGasTokenTx: TransactionResult;

    beforeEach(async () => {
      wallet = await MultiSigWalletContract.new(
        [owner, ownerSecond],
        required,
        { from: owner }
      );
      addGasTokenTx = await submitAddGasToken(wallet, gst2.address, owner);
    });

    it('should reserve zero gas token', async () => {
      assertNumberEqual(
        await wallet.getReservedGasToken(),
        new BigNumber(0)
      );
    });

    it('should add gasToken', async () => {
      assert.equal(
        await wallet.getGasToken(),
        gst2.address
      );
    });

    it('should emit GasTokenAddition', async () => {
      const log = findLastLog(addGasTokenTx, 'GasTokenAddition');
      assert.isOk(log);

      const event = log.args as GasTokenAdditionEvent;
      assert.equal(event.gasTokenAddress, gst2.address);
    });
  });

  describe('transaction submitting', () => {
    const required = 2;

    let wallet: MultiSigWallet;

    before(async () => {
      wallet = await MultiSigWalletContract.new(
        [owner, ownerSecond],
        required,
        { from: owner }
      );
    });

    it('should revert if gas token not added', async () => {
      await assertReverts(async () => {
        await submitSaveStorage(wallet, gasConsumer, owner, 0);
      });
    });

    context('gas token added', async () => {
      const gasTokenAmount = 10;

      before(async () => {
        const submitAddGasTokenTx = await submitAddGasToken(
          wallet,
          gst2.address,
          owner
        );
        const txId = findLastTransactionId(submitAddGasTokenTx);
        await wallet.confirmTransaction(txId, { from: ownerSecond });
      });

      it('should revert if not has gas token amount', async () => {
        await assertReverts(async () => {
          await submitSaveStorage(wallet, gasConsumer, owner, gasTokenAmount);
        });
      });

      context('token transfered to wallet', async () => {
        before(async () => {
          const mintedAmount = await mint(gst2, owner, 1, 100);
          await gst2.transfer(wallet.address, mintedAmount, { from: owner });
          assertNumberEqual(
            await gst2.balanceOf(wallet.address),
            new BigNumber(mintedAmount)
          );
        });

        it('should reserve gas tokens for transaction', async () => {
          const gasTokenReservedBefore = await wallet.getReservedGasToken();
          await submitSaveStorage(wallet, gasConsumer, owner, gasTokenAmount);

          assertNumberEqual(
            await wallet.getReservedGasToken(),
            gasTokenReservedBefore.add(gasTokenAmount)
          );
        });
      });
    });
  });

  describe('transaction executing', () => {
    it.skip('should consume less gas with tokens', async () => {
      assert.fail();
    });

    it.skip('should decrease locked tokens amount', async () => {
      assert.fail();
    });

    it.skip('should revert if not own gas tokens', async () => {
      assert.fail();
    });
  });
});

async function submitAddGasToken(
  wallet: MultiSigWallet,
  gst: Address,
  from: Address
): Promise<TransactionResult> {
  const data = await getData(wallet.addGasToken, gst);
  return await wallet.submitTransaction(wallet.address, 0, data, { from });
}

async function submitSaveStorage(
  wallet: MultiSigWallet,
  gasConsumer: GasConsumer,
  from: Address,
  gasTokenAmount: number,
  saveCount: number = 1
) {
  const data = await getData(
    gasConsumer.saveStorage,
    saveCount
  );
  return await wallet.submitTransactionWithGasToken(
    gasConsumer.address,
    0,
    data,
    gasTokenAmount,
    { from }
  );
}

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
