// tslint:disable:no-console
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';

const ganache = spawn(
  'ganache-cli',
  [
    '--account', '0xa7d79a51ff835c80c1f5c2c3b350b15f95550e41e379e50a10ef2ff3f6a215aa,1000000000',
    '--account', '0x796d00956f21441791bac0aa77b3b0f392519ea6f9f4c1f42155ddf332d6833a,1000000000',
    '--account', '0x331655297b96f087513ed65303f9cc431a245e11eeb33dda21b2b0a04126d5f6,1000000000',
    '--account', '0xf6362506b73ff28c50447ac2cf3fdde71bb15414d43ba4494b9262f95813da1a,1000000000',
    '--account', '0xa8baa49c7e1dde3d71eb4079db7f4ffff715fe0addfb7536f4e2060bc53c13c4,1000000000',
    '--account', '0x41454aa21a3a9b3b3d8a3f8f77e9775133fa44323d46a0177ee52a3e52b6391a,1000000000',
    '--account', '0xf8544d02cad43b7d363b57db0a7633548c86dbe414cda397fe4f7fc84453b03f,1000000000',
    '--account', '0xe6f0e2c193aec1faab81291789e244fe045459d652e128664f577e33db53d1c3,1000000000',
    '--account', '0xdd87437123c9f682bcb05297e3a24e1dc0c697e93581e400924bc53296bace3e,1000000000',
    '--account', '0x7bb37a15cfbb6f5ac6ff698c491f9f893aeaf3f37c865572f55ec32c124999d7,1000000000'
  ],
  {
    stdio: ['ignore', fs.openSync('ganache.log', 'w'), fs.openSync('ganache.log', 'a')]
  }
);

try {
  execSync(
    'truffle test --network=testrpc',
    {
      stdio: [1, 2, 3]
    }
  );
} catch (e) {
  throw e;
} finally {
  ganache.kill('SIGKILL');
}
