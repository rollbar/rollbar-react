import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
// import jsx from 'rollup-plugin-jsx';
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
    input: 'src/index.js',
    output: [
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        entryFileNames: '[name].js',
      },
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
      },
    ],
    plugins: [
      ...COMMON_PLUGINS,
    ],
  },
];

