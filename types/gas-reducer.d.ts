declare module 'gas-reducer' {
  import { BigNumber } from 'bignumber.js';
  import {
    AnyContract,
    Contract,
    ContractBase,
    TransactionOptions,
    TransactionResult,
    TruffleArtifacts
  } from 'truffle';
  import { AnyNumber } from 'web3';

  export interface Migrations extends ContractBase {
    setCompleted(
      completed: number,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    upgrade(
      address: Address,
      options?: TransactionOptions
    ): Promise<TransactionResult>;
  }

  interface ERC20 extends ContractBase {
    // todo complete erc20 typing
    totalSupply(): Promise<BigNumber>;

    balanceOf(who: Address): Promise<BigNumber>;

    transfer(
      to: Address,
      amount: BigNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;
  }

  export interface GST2 extends ERC20 {
    mint(
      count: AnyNumber,
      options?: TransactionOptions
    ): Promise<void>;
  }

  export interface GasConsumer extends ContractBase {
    saveStorage(count: AnyNumber): Promise<TransactionResult>;
  }

  export interface GasReducer extends ContractBase {
    gst2(): Promise<Address>;
  }

  export interface MigrationsContract extends Contract<Migrations> {
    'new'(options?: TransactionOptions): Promise<Migrations>;
  }

  export interface GST2Contract extends Contract<GST2> {
    'new'(options?: TransactionOptions): Promise<GST2>;
  }

  export interface GasConsumerContract extends Contract<GasConsumer> {
    'new'(options?: TransactionOptions): Promise<GasConsumer>;
  }

  export interface GasReducerContract extends Contract<GasReducer> {
    'new'(
      gst2: Address,
      options?: TransactionOptions
    ): Promise<GasReducer>;
  }

  export interface GasReducerArtifacts extends TruffleArtifacts {
    require(name: string): AnyContract;

    require(name: './Migrations.sol'): MigrationsContract;

    require(name: './GasToken2.sol'): GST2Contract;

    require(name: './GasConsumer.sol'): GasConsumerContract;

    require(name: './GasReducer.sol'): GasReducerContract;
  }

}
