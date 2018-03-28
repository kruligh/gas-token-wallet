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

    free(
      count: AnyNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;
  }

  export interface GasConsumer extends ContractBase {

    doNothing(options?: TransactionOptions): Promise<TransactionResult>;

    saveStorage(
      count: AnyNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;
  }

  interface MultiSigWallet extends ContractBase {
    owners(num: AnyNumber): Promise<Address[]>;

    required(): Promise<BigNumber>;

    addOwner(
      owner: Address,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    removeOwner(
      owner: Address,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    replaceOwner(
      owner: Address,
      newOwner: Address,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    changeRequirement(
      required: AnyNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    submitTransaction(
      destination: Address,
      value: AnyNumber,
      data: string,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    confirmTransaction(
      transactionId: AnyNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    revokeConfirmation(
      transactionId: AnyNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    executeTransaction(
      transactionId: AnyNumber,
      options?: TransactionOptions
    ): Promise<TransactionResult>;

    getConfirmationCount(transactionId: AnyNumber): Promise<BigNumber>;

    getTransactionCount(
      pending: boolean,
      executed: boolean
    ): Promise<BigNumber>;

    getOwners(): Promise<Address[]>;

    getConfirmations(transactionId: AnyNumber): Promise<Address[]>;

    getTransactionIds(
      from: AnyNumber,
      to: AnyNumber,
      pending: boolean,
      executed: boolean
    ): Promise<AnyNumber[]>;
  }

  interface ConfirmationEvent {
    sender: Address;
    transactionId: BigNumber;
  }

  interface RevocationEvent {
    sender: Address;
    transactionId: BigNumber;
  }

  interface ExecutionEvent {
    transactionId: BigNumber;
  }

  interface ExecutionFailureEvent {
    transactionId: BigNumber;
  }

  interface SubmissionEvent {
    transactionId: BigNumber;
  }

  interface OwnerAdditionEvent {
    owner: Address;
  }

  interface OwnerRemovalEvent {
    owner: Address;
  }

  interface RequirementChangeEvent {
    required: BigNumber;
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

  interface MultiSigWalletContract extends Contract<MultiSigWallet> {
    'new'(
      owners: Address[],
      required: AnyNumber,
      options?: TransactionOptions
    ): Promise<MultiSigWallet>;
  }

  export interface GasReducerArtifacts extends TruffleArtifacts {
    require(name: string): AnyContract;

    require(name: './Migrations.sol'): MigrationsContract;

    require(name: './GasToken2.sol'): GST2Contract;

    require(name: './GasConsumer.sol'): GasConsumerContract;

    require(name: './MultiSigWallet.sol'): MultiSigWalletContract;
  }

}
