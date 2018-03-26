declare type Callback<T> = (err: Error | null, value: T) => void;

declare type Address = string;

declare module 'web3' {
  import { BigNumber } from 'bignumber.js';

  class Web3 {
    public eth: {
      accounts: Address[];
      defaultAccount: Address;

      getBlockNumber(callback: Callback<number>): void;
      sendTransaction(txData: Web3.TxData, callback: Callback<string>): void;
      getBalance(account: Address, callback: Callback<BigNumber>): void;
      getTransactionCount(account: Address): Promise<number>;
      sign(account: Address, text: string): string;
    };

    public personal: {
      importRawKey(rawKey: string, password: string): string;
      newAccount(password?: string): string;
      unlockAccount(address: string, password?: string, duration?: number): boolean;
      lockAccount(address: string): boolean;
      sign(message: string, account: string, password: string): string;
      sign(hexMessage: string, account: string, callback: (error: Error, signature: string) => void): void;
    };

    public version: {
      getNetwork(cb: Callback<string>): void;
    };

    public constructor(provider?: Web3.Provider);

    public sha3(str: string, options?: { encoding: 'hex' }): string;

    public toDecimal(hex: string): number;

    public toHex(num: number): string;
  }

  namespace Web3 {
    type AnyNumber = number | string | BigNumber;

    interface RequestPayload {
      params: any[];
      method: string;
      id: number;
      jsonrpc: string;
    }

    interface ResponsePayload {
      result: any;
      id: number;
      jsonrpc: string;
    }

    interface Provider {
      sendAsync(
        payload: RequestPayload,
        callback: (err: Error | null, result: ResponsePayload) => void
      ): void;
    }

    interface TxData {
      from?: Address;
      to: Address;
      value?: AnyNumber;
      gas?: AnyNumber;
      gasPrice?: AnyNumber;
      data?: string;
      nonce?: AnyNumber;
    }
  }

  export = Web3;
}
