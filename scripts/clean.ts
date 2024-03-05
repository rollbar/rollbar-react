import { globSync } from 'glob';
import { rimrafSync } from 'rimraf';

const patterns = [
  '**/node_modules',
  '**/.next',
  '**/.yalc',
  '**/build',
  '**/yalc.lock',
  'bundles/',
  'dist/',
  'lib/',
];

for (const pattern of patterns) {
  const matches = globSync(pattern).filter(
    (match) => !match.includes('node_modules/'),
  );

  for (const match of matches) {
    console.log(`\x1b[97mdeleting \x1b[1m${match}\x1b[0m`);
    rimrafSync(match);
  }
}
