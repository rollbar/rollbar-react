import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const cmd = process.argv.slice(2).join(' ');
const root = path.join(__dirname, '..');
const examples = path.join(root, 'examples');

const dirs = fs
  .readdirSync(examples)
  .filter((p) => fs.statSync(path.join(examples, p)).isDirectory())
  .map((dir) => path.join('examples', dir));

for (const dir of dirs) {
  console.log(`\x1b[97m> \x1b[37m${cmd} \x1b[90m<== \x1b[36m${dir}\x1b[0m`);
  execSync(cmd, {
    stdio: 'inherit',
    cwd: path.join(root, dir),
  });
}
