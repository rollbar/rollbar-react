import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import babel from '@rollup/plugin-babel';
import pkg from './package.json';

const COMMON_PLUGINS = [
  resolve(),
  peerDepsExternal(),
  // jsx({ factory: 'React.createElement' }),
  babel({ babelHelpers: 'bundled', exclude: ['node_modules/**'] }),
]

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'Rollbar.react',
      file: pkg.bundles.browser,
      format: 'umd',
      sourcemap: true,
      exports: 'named',
      globals: {
        react: 'React',
        'prop-types': 'PropTypes',
        rollbar: 'Rollbar',
      }
    },
    plugins: [
      ...COMMON_PLUGINS,
      commonjs(),
    ],
  },

  {
    input: {
      index: 'src/index.js',
      constant: 'src/constants.js',
      Provider: 'src/provider.js',
      ErrorBoundary: 'src/error-boundary.js',
      RollbarContext: 'src/rollbar-context.js',
      historyContext: 'src/history-context.js',
      useRollbar: 'src/hooks/use-rollbar.js',
      useRollbarConfiguration: 'src/hooks/use-rollbar-config.js',
      useRollbarContext: 'src/hooks/use-rollbar-context.js',
      useRollbarPerson: 'src/hooks/use-rollbar-person.js',
      useRollbarCaptureEvent: 'src/hooks/use-rollbar-capture-event.js',
    },
    output: [
      {
        dir: pkg.module,
        format: 'es',
        sourcemap: true,
        entryFileNames: '[name].js',
      },
      {
        dir: pkg.main,
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        exports: 'named',
      },
    ],
    plugins: [
      ...COMMON_PLUGINS,
    ],
  },
];

