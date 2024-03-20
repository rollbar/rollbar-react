import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';

function nodeReq(dir: string): string | undefined {
  return (
    JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
      engines?: { node?: string };
    }
  ).engines?.node;
}

const cmd = process.argv.slice(2).join(' ');
const root = path.join(__dirname, '..');
const examples = path.join(root, 'examples');

const dirs = fs
  .readdirSync(examples)
  .filter((p) => fs.statSync(path.join(examples, p)).isDirectory())
  .map((dir) => path.join('examples', dir))
  .filter((dir) => semver.satisfies(process.version, nodeReq(dir) || '>=16'));

for (const dir of dirs) {
  console.log(`\x1b[97m> \x1b[37m${cmd} \x1b[90m<== \x1b[36m${dir}\x1b[0m`);
  execSync(cmd, {
    stdio: 'inherit',
    cwd: path.join(root, dir),
  });
}
