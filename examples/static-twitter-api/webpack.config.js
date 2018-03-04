module.exports = {
  mode: 'production',
  target: 'node',
  entry: './lambda/index.js',
  output: {
    filename: 'handler.js',
    path: __dirname,
    libraryTarget: 'commonjs2',
  },
};
