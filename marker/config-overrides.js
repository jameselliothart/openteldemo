const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    path: require.resolve('path-browserify'),
    fs: false,
    url: false,
    process: false,
    tls: false,
    util: false,
    zlib: false,
    stream: false,
    os: false,
    buffer: false,
    crypto: false,
    http: false,
    https: false,
    net: false,
    dns: false,
    assert: false,
    events: false,
    querystring: false
  };

  return config;
};