import * as Web3 from 'web3';

import { BigNumber } from 'bignumber.js';
import { assert } from 'chai';
import { findLast, propEq } from 'ramda';
import { Method, TransactionLog, TransactionOptions, TransactionResult } from 'truffle';

import { ETH_DECIMALS } from '../utils';
import { MultiSigWallet, SubmissionEvent } from 'gas-reducer';
import { AnyNumber } from 'web3';

declare const web3: Web3;

export const ZERO_ADDRESS = '0x' + '0'.repeat(40);

export async function assertReverts(func: () => void) {
  try {
    await func();
  } catch (error) {
    assertRevertError(error);
    return;
  }
  assert.fail({}, {}, 'Should have reverted');
}

export function assertRevertError(error: { message: string }) {
  if (error && error.message) {
    if (error.message.search('revert') === -1) {
      assert.fail(
        error,
        {},
        'Expected revert error, instead got: ' + error.message
      );
    }
  } else {
    assert.fail(error, {}, 'Expected revert error');
  }
}

export function assertNumberEqual(
  actual: Web3.AnyNumber,
  expect: Web3.AnyNumber,
  decimals: number = 0
) {
  const actualNum = new BigNumber(actual);
  const expectNum = new BigNumber(expect);

  if (!actualNum.eq(expectNum)) {
    const div = decimals ? Math.pow(10, decimals) : 1;
    assert.fail(
      actualNum.toFixed(),
      expectNum.toFixed(),
      `${actualNum.div(div).toFixed()} == ${expectNum.div(div).toFixed()}`,
      '=='
    );
  }
}

export function assertNumberAlmostEqual(
  actual: Web3.AnyNumber,
  expect: Web3.AnyNumber,
  epsilon: Web3.AnyNumber,
  decimals: number = 0
) {
  const actualNum = new BigNumber(actual);
  const expectNum = new BigNumber(expect);
  const epsilonNum = new BigNumber(epsilon);

  if (
    actualNum.lessThan(expectNum.sub(epsilonNum)) ||
    actualNum.greaterThan(expectNum.add(epsilonNum))
  ) {
    const div = decimals ? Math.pow(10, decimals) : 1;
    assert.fail(
      actualNum.toFixed(),
      expectNum.toFixed(),
      `${actualNum.div(div).toFixed()} == ${expectNum
        .div(div)
        .toFixed()} (precision ${epsilonNum.div(div).toFixed()})`,
      '=='
    );
  }
}

export function assertEtherEqual(
  actual: Web3.AnyNumber,
  expect: Web3.AnyNumber
) {
  return assertNumberEqual(actual, expect, ETH_DECIMALS);
}

export function findLastLog(
  trans: TransactionResult,
  event: string
): TransactionLog {
  return findLast(propEq('event', event))(trans.logs);
}

export async function getData(func: any, ...args: any[]): Promise<string> {
  const method = func as Method;
  const request = await method.request(...args);
  const [param] = request.params;
  return param.data;
}

export function findLastTransactionId(tx: TransactionResult) {
  const log = findLastLog(tx, 'Submission');
  assert.isOk(log);

  const event = log.args as SubmissionEvent;
  return event.transactionId;
}

export interface ExecutionResult {
  transactionId: BigNumber;
  lastTransaction: TransactionResult;
}

export async function executeFunction(
  wallet: MultiSigWallet,
  to: Address,
  value: AnyNumber,
  data: string,
  options: TransactionOptions
): Promise<ExecutionResult> {
  const owners = await wallet.getOwners();
  let tx: TransactionResult;

  tx = await wallet.submitTransaction(to, value, data, options);

  const transactionId = findLastTransactionId(tx);

  for (let i = 1; i < owners.length; i++) {
    tx = await wallet.confirmTransaction(transactionId, { from: owners[i] });
  }

  // return last transaction, because it contains Execution events
  return { transactionId, lastTransaction: tx } as ExecutionResult;
}

export async function executeWalletFunction(
  wallet: MultiSigWallet,
  func: any,
  from: Address,
  ...args: any[]
): Promise<ExecutionResult> {
  const method = func as Method;
  const options = { from };

  const functionData = await getData(method, ...args);

  return executeFunction(wallet, wallet.address, 0, functionData, options);
}
