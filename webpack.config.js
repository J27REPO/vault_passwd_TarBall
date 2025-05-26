const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  // Asegúrate de que esta línea es EXACTAMENTE así:
  entry: './src/renderer/index.js', 
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist_react'),
    filename: 'renderer.bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist_react'),
    },
    compress: true,
    port: 9000,
    hot: true,
  },
};