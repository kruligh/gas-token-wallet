const gas = 5200000;
const host = 'localhost';
const port = 8545;

export = {
    networks: {
        testrpc: {
            gas,
            gasPrice: 0,
            host,
            network_id: '*',
            port
        }
    }
};
