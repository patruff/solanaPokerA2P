const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    'process/browser': require.resolve('process/browser.js'),
    vm: false,
    util: false,
    assert: false,
    http: false,
    https: false,
    os: false,
    url: false,
    zlib: false,
  });
  config.resolve.fallback = fallback;

  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': path.resolve(__dirname, 'node_modules/process/browser.js'),
    'process/browser.js': path.resolve(__dirname, 'node_modules/process/browser.js'),
  };

  config.resolve.extensions = [...(config.resolve.extensions || []), '.js', '.jsx', '.ts', '.tsx'];
  config.resolve.fullySpecified = false;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);

  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules = config.module.rules.map(rule => {
    if (rule.oneOf instanceof Array) {
      rule.oneOf[rule.oneOf.length - 1].exclude = [
        /\.(js|mjs|jsx|cjs|ts|tsx)$/,
        /\.html$/,
        /\.json$/
      ];
    }
    return rule;
  });

  return config;
};
