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
// En webpack.config.js
// ...
module: {
  rules: [
    // ... (tu regla para babel-loader no cambia)
    {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
      },
    },
    // REGLA MODIFICADA PARA CSS:
    {
      test: /\.css$/,
      use: [
        'style-loader', // 3. Inyecta los estilos en el DOM
        'css-loader',   // 2. Interpreta @import y url() como import/require() y los resolverá
        {               // 1. Procesa CSS con PostCSS (Tailwind y Autoprefixer)
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              // No necesitas especificar los plugins aquí si ya tienes postcss.config.js
              // Webpack usará postcss.config.js por defecto.
              // Si quisieras definirlos explícitamente aquí, sería:
              // ident: 'postcss',
              // plugins: [
              //   require('tailwindcss'), // O 'tailwindcss' si lo importas arriba
              //   require('autoprefixer'),  // O 'autoprefixer' si lo importas arriba
              // ],
            },
          },
        },
      ],
    },
  ],
},
// ...
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