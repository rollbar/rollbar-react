import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Next 16 removed `next lint`, so ESLint runs directly against this flat
// config. `eslint-config-next/core-web-vitals` already brings the TypeScript
// setup and the `.next`/`out`/`build` ignores with it.
/** @type {import('eslint').Linter.Config[]} */
const config = [...nextCoreWebVitals];

export default config;
