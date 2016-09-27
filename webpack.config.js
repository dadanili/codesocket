var path = require('path');
var webpack = require('webpack');
var APP_DIR = path.resolve(__dirname, 'Source/client/app');

console.log('=============', APP_DIR)
module.exports = {
  devtool: 'eval',
  entry: [
    // 'webpack-dev-server/client?http://localhost:3000',
    'webpack-hot-middleware/client', 'webpack/hot/dev-server',
    APP_DIR + '/index.jsx'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    loaders: [
    {
      test: /\.jsx?/,
      loaders: ['react-hot', 'babel'],
      include: [
              APP_DIR,
              path.join(__dirname, 'Spec'),
              path.join(__dirname, 'utils')
          ]
      // exclude: path.join(__dirname, 'node_modules')
    }]
  }
};
