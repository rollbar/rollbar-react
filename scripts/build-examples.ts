import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const examples = path.join(__dirname, '..', 'examples');

fs.readdirSync(examples)
  .map((p) => path.join(examples, p))
  .filter((p) => fs.statSync(p).isDirectory())
  .forEach((p) => {
    console.log(`\n\x1b[32mBuilding \x1b[1m${p}\x1b[0m`);
    execSync('npm run build', {
      stdio: 'inherit',
      cwd: p,
    });
  });
