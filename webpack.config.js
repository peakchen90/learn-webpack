const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.name$/,
        use: [
          {
            loader: path.join(__dirname, './lib/loader/name-loader.js'),
            options: {
              language: 'jp'
            }
          }
        ]
      }
    ]
  },
  optimization: {
    minimize: false,
  }
};
