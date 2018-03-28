import BigNumber from 'bignumber.js';
import { assert } from 'chai';
import { MultiSigWallet, SubmissionEvent } from 'gas-reducer';
import { Method, TransactionOptions, TransactionResult } from 'truffle';
import { AnyNumber } from 'web3';
import { findLastLog } from './common.helpers';

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
