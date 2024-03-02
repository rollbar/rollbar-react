/**
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  roots: ['src/tests'],
  setupFilesAfterEnv: ['./src/tests/jest-setup.ts'],
  preset: 'ts-jest/presets/js-with-babel',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
};
