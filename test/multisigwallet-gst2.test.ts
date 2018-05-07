import {BigNumber} from 'bignumber.js';
import {assert} from 'chai';
import {
    GasConsumer,
    GasReducerArtifacts,
    GasTokenAdditionEvent,
    GST2,
    MultiSigWallet,
    SubmissionEvent
} from 'gas-reducer';
import {ContractContextDefinition, TransactionResult} from 'truffle';
import {assertNumberEqual, assertReverts, findLastLog} from './helpers/common.helpers';
import {deployGST2, GST2_MAGIC_ACCOUNT, GST2_MAGIC_NONCE} from './helpers/gst2.helpers';
import {findLastTransactionId, getData} from './helpers/multisigwallet.helpers';

declare const artifacts: GasReducerArtifacts;
declare const contract: ContractContextDefinition;

const MultiSigWalletContract = artifacts.require('./MultiSigWallet.sol');
const GasConsumerContract = artifacts.require('./GasConsumer.sol');

contract('MultiSigWallet gas token usage,', (accounts) => {
    const owner = accounts[1];
    const ownerSecond = accounts[2];

    let gst2: GST2;
    let gasConsumer: GasConsumer;

    before(async () => {
        gst2 = await deployGST2(GST2_MAGIC_ACCOUNT, GST2_MAGIC_NONCE);
        gasConsumer = await GasConsumerContract.new({from: owner});
    });

    context('one required,', () => {
        const required = 1;

        let wallet: MultiSigWallet;

        beforeEach(async () => {
            wallet = await MultiSigWalletContract.new(
                [owner, ownerSecond],
                required,
                {from: owner}
            );
        });

        describe('gas token maintain.', () => {
            let addGasTokenTx: TransactionResult;

            beforeEach(async () => {
                addGasTokenTx = await submitAddGasToken(wallet, gst2.address, owner);
            });

            it('Should reserve zero gas token', async () => {
                assertNumberEqual(
                    await wallet.getReservedGasToken(),
                    new BigNumber(0)
                );
            });

            it('Should add gasToken', async () => {
                assert.equal(
                    await wallet.getGasToken(),
                    gst2.address
                );
            });

            it('Should emit GasTokenAddition', async () => {
                const log = findLastLog(addGasTokenTx, 'GasTokenAddition');
                assert.isOk(log);

                const event = log.args as GasTokenAdditionEvent;
                assert.equal(event.gasTokenAddress, gst2.address);
            });
        });

        describe('transaction executing', () => {
            const saveCount = 100;

            context('gas token added, owned by wallet', () => {
                beforeEach(async () => {
                    await submitAddGasToken(wallet, gst2.address, owner);
                    await mintAndTransferTokens(wallet);
                });

                it('Should consume less gas with tokens', async () => {
                    const withoutGstTx = await submitSaveStorage(wallet, gasConsumer, owner, 0, saveCount);
                    const withoutGstGasUsed = withoutGstTx.receipt.gasUsed;

                    const withGstTx = await submitSaveStorage(wallet, gasConsumer, owner, 100, saveCount);
                    const withGstGasUsed = withGstTx.receipt.gasUsed;

                    assert.isTrue(
                        withoutGstGasUsed > withGstGasUsed,
                        `Gas used with gst ${withGstGasUsed} is bigger than without ${withoutGstGasUsed}`
                    );
                });

                it.skip('Should decrease locked tokens amount', async () => {
                    assert.fail();
                });
            });
        });
    });

    context('Two required', () => {
        const required = 2;

        let wallet: MultiSigWallet;

        beforeEach(async () => {
            wallet = await MultiSigWalletContract.new(
                [owner, ownerSecond],
                required,
                {from: owner}
            );
        });

        describe('Transaction submitting', () => {
            it('Should revert if gas token not added', async () => {
                await assertReverts(async () => {
                    await submitSaveStorage(wallet, gasConsumer, owner, 1);
                });
            });

            context('Gas token added', async () => {
                const gasTokenAmount = 10;

                beforeEach(async () => {
                    const sumbitTx = await submitAddGasToken(
                        wallet,
                        gst2.address,
                        owner
                    );
                    const txId = extractTxId(sumbitTx);

                    await wallet.confirmTransaction(txId, {from: ownerSecond});
                });

                it('Should revert if not own gas token amount', async () => {
                    await assertReverts(async () => {
                        await submitSaveStorage(wallet, gasConsumer, owner, gasTokenAmount);
                    });
                });

                context('Token transferred', async () => {
                    beforeEach(async () => {
                        const mintedAmount = await mintAndTransferTokens(wallet);
                        assertNumberEqual(
                            await gst2.balanceOf(wallet.address),
                            new BigNumber(mintedAmount)
                        );
                    });

                    it('Should reserve tokens for transaction', async () => {
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
    });

    async function addGasToken(wallet: MultiSigWallet) {
        const submitAddGasTokenTx = await submitAddGasToken(
            wallet,
            gst2.address,
            owner
        );
        const txId = findLastTransactionId(submitAddGasTokenTx);
        await wallet.confirmTransaction(txId, {from: ownerSecond});
    }

    async function mintAndTransferTokens(wallet: MultiSigWallet) {
        const mintedAmount = await mint(gst2, owner, 1, 100);
        await gst2.transfer(wallet.address, mintedAmount, {from: owner});
        return mintedAmount;
    }
});

async function submitAddGasToken(
    wallet: MultiSigWallet,
    gst: Address,
    from: Address
): Promise<TransactionResult> {
    const data = await getData(wallet.addGasToken, gst);
    return await wallet.submitTransaction(wallet.address, 0, data, {from});
}

async function submitSaveStorage(
    wallet: MultiSigWallet,
    gasConsumer: GasConsumer,
    from: Address,
    gasTokenAmount: number,
    saveCount: number = 1
): Promise<TransactionResult> {
    const data = await getData(
        gasConsumer.saveStorage,
        saveCount
    );
    if (!gasTokenAmount) {
        return await wallet.submitTransaction(
            gasConsumer.address,
            0,
            data,
            {from}
        );
    } else {
        return await wallet.submitTransactionWithGasToken(
            gasConsumer.address,
            0,
            data,
            gasTokenAmount,
            {from}
        );
    }
}

async function mint(
    gst2: GST2,
    owner: Address,
    mintingTimes: number = 10,
    mintingAmount: number = 100
): Promise<number> {

    for (let i = 0; i < mintingTimes; i++) {
        await gst2.mint(mintingAmount, {from: owner});
    }
    assertNumberEqual(
        await gst2.balanceOf(owner),
        mintingTimes * mintingAmount
    );

    return mintingTimes * mintingAmount;
}

function extractTxId(sumbitTx: TransactionResult): BigNumber {
    return (findLastLog(sumbitTx, 'Submission').args as SubmissionEvent).transactionId;
}
