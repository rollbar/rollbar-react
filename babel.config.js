/**
 * @type {import('@babel/core').TransformOptions}
 */
module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-react'],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-class-properties',
  ],
  env: {
    test: {
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        'babel-plugin-istanbul',
      ],
    },
  },
};
