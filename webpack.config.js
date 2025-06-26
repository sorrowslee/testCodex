const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource' // ✅ Webpack 5 內建，處理 binary 圖片檔案
      },
      {
        test: /\.json$/,
        type: 'javascript/auto' // ✅ 確保 .json 不被當成 ES 模組解析
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    static: {
      // Serve the project root so index.html is available without a build step
      directory: __dirname
    },
    port: 8080
  }
};
