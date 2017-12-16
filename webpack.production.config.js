const path = require('path');
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const buildPath = path.resolve(__dirname, 'public', 'build');
const mainPath = path.resolve(__dirname, 'app', 'js', 'main.js');
const cssMainPath = path.resolve(__dirname, 'app', 'scss', 'main.scss');

const ExtractTextPlugin = require('extract-text-webpack-plugin');

const extractSass = new ExtractTextPlugin({
  filename: '[name].bundle.css',
  disable: process.env.NODE_ENV === 'development'
});

const config = {
  // We change to normal source mapping
  devtool: 'source-map',
  entry: [mainPath, cssMainPath],
  output: {
    path: buildPath,
    filename: '[name].bundle.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: [nodeModulesPath]
    }, {
      //   test: /\.css$/,
      //   loader: 'style!css'
      test: /\.scss$/,
      use: extractSass.extract({
        use: [{
          loader: 'css-loader'
        }, {
          loader: 'sass-loader'
        }]
      })
    }, {
      test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000'
    }]
  },
  plugins: [
    extractSass
  ]
};

module.exports = config;
