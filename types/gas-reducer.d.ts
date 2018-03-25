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

  namespace gas-reducer {
    interface Migrations extends ContractBase {
      setCompleted(
        completed: number,
        options?: TransactionOptions
      ): Promise<TransactionResult>;

      upgrade(
        address: Address,
        options?: TransactionOptions
      ): Promise<TransactionResult>;
    }
    
    interface GasReducer extends ContractBase {
      
    }
    
    

    interface MigrationsContract extends Contract<Migrations> {
      'new'(options?: TransactionOptions): Promise<Migrations>;
    }
    
    interface GasReducerContract extends Contract<GasReducer> {
      'new'(options?: TransactionOptions): Promise<GasReducer>;
    }
    
    interface Gas-reducerArtifacts extends TruffleArtifacts {
      require(name: string): AnyContract;
      require(name: './Migrations.sol'): MigrationsContract;
      require(name: './GasReducer.sol'): GasReducerContract;
    }
  }

  export = gas-reducer;
}
