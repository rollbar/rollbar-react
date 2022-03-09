/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: [
    'src/tests'
  ],
  setupFilesAfterEnv: [
    './src/tests/jest-setup.ts'
  ],
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        jsx: 'react-jsx',
        module: 'commonjs',
        strict: true,
        target: 'esnext',
      }
    }
  }
};
