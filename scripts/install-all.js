const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cmd = process.argv.includes('ci') ? 'npm ci' : 'npm install';

const root = path.join(__dirname, '..');
const examples = path.join(root, 'examples');

fs.readdirSync(examples)
  .map((p) => path.join(examples, p))
  .concat(root)
  .filter((p) => fs.statSync(p).isDirectory())
  .forEach((p) => {
    console.log(`\n\x1b[32mInstalling (${cmd}) \x1b[1m${p}\x1b[0m`);
    execSync(cmd, {
      stdio: 'inherit',
      cwd: p,
    });
  });
