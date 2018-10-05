'use strict';

/* eslint-disable security/detect-non-literal-fs-filename */
let path = require('path');
let webpack = require('webpack');

module.exports = ({ mode, main, properties, dir, context, toContext, development }) => ({
  mode,
  devtool: development ? 'eval-source-map' : 'source-map',
  entry: {
    main,
  },
  output: {
    path: toContext(properties.dist),
    publicPath: properties.cdn,
    filename: development ? '[id].js' : '[contenthash].js',
  },
  plugins: {
    $build: Array,
    define: {
      $build: options => new webpack.DefinePlugin(options),
      options: {
        'process.env': {
          NODE_ENV: development ? '"development"' : '"production"',
          PROPERTIES: {
            $build: options => `${JSON.stringify(options)}`,
            options: properties.public,
          },
        },
      },
    },
    ignore: {
      $build: (...args) => new webpack.IgnorePlugin(...args),
      locale: /^\.\/locale$/,
      moment: /moment$/,
    },
    hot: {
      $when: development,
      $build: (...args) => new webpack.HotModuleReplacementPlugin(...args),
    },
  },
  resolve: {
    modules: {
      $build: Array,
      context: toContext('node_modules'),
      build: path.join(dir, 'node_modules'),
    },
    alias: {
      '^@': context,
    },
  },
  resolveLoader: {
    modules: {
      $build: Array,
      build: 'node_modules',
      context: toContext('node_modules'),
    },
  },
  performance: {
    $when: development,
    $build: () => false,
  },
  devServer: {
    $when: development,
    hot: true,
    overlay: true,
    historyApiFallback: true,
    stats: 'minimal',
  },
});
