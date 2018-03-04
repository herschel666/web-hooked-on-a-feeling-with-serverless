module.exports = {
  mode: 'production',
  devtool: false,
  target: 'node',
  entry: './lambda/index.js',
  output: {
    filename: 'bot.js',
    path: __dirname,
    libraryTarget: 'commonjs2',
  },
};
