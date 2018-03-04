const { resolve } = require('path');

module.exports = {
  mode: 'production',
  devtool: false,
  target: 'node',
  entry: './lambda/index.js',
  output: {
    filename: 'handler.js',
    path: __dirname,
    libraryTarget: 'commonjs2',
  },
};
