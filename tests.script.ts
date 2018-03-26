// tslint:disable:no-console
import { execSync, spawn } from 'child_process';
import * as fs from 'fs';

const ganache = spawn(
  'ganache-cli',
  [
    '--account', '0xa7d79a51ff835c80c1f5c2c3b350b15f95550e41e379e50a10ef2ff3f6a215aa,1000000000',
    '--account', '0x796d00956f21441791bac0aa77b3b0f392519ea6f9f4c1f42155ddf332d6833a,1000000000'
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
