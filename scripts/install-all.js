const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const npmInstall = process.argv.includes('ci') ? 'npm ci' : 'npm install';
const root = path.join(__dirname, '..');
const examples = path.join(root, 'examples');

console.log(`\x1b[32mInstall (${npmInstall}) \x1b[1m@rollbar/react\x1b[0m`);
execSync(npmInstall, { stdio: 'inherit', cwd: root });

console.log(`\x1b[32mBuild \x1b[1m@rollbar/react\x1b[0m`);
execSync('npm run build', { stdio: 'inherit', cwd: root });

console.log(`\x1b[32mLocally publish \x1b[1m@rollbar/react\x1b[0m`);
execSync('npx yalc publish --sig', { stdio: 'inherit', cwd: root });

const dirs = fs
  .readdirSync(examples)
  .map((p) => path.join(examples, p))
  .filter((p) => fs.statSync(p).isDirectory());

for (const dir of dirs) {
  console.log(`\x1b[32m\n---\nInstall (${npmInstall}) \x1b[1m${dir}\x1b[0m`);
  execSync('npx yalc add @rollbar/react', { stdio: 'inherit', cwd: dir });
  execSync(npmInstall, { stdio: 'inherit', cwd: dir });
}
