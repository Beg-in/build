'use strict';

let HtmlWebpackPlugin = require('html-webpack-plugin');
let ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
let assignDeep = require('begin-util/assign-deep');
let path = require('path');
let webpack = require('webpack');

module.exports = ({
  context = process.cwd(),
  stage = 'production',
  port,
  isCordova = false,
} = {}) => {
  let isLocal = stage === 'local';
  /* eslint-disable import/no-dynamic-require */
  let props = require(`${context}/properties`);
  /* eslint-enable import/no-dynamic-require */
  const DOMAIN = props.domain;
  props = assignDeep(props.base || {}, props[stage] || {}).client || {};
  props.cdn = isLocal ? '/' : `https://cdn.${DOMAIN}/`;
  props.api = `https://api.${DOMAIN}/v1/`;
  if (isLocal) {
    props.api = `http://${process.env.API_URL || 'localhost'}:${~~port + 1}/v1/`;
  }
  props.stage = stage;

  let config = {
    devtool: `cheap-module${isLocal ? '-eval' : ''}-source-map`,
    entry: path.join(context, 'src/client/index.js'),
    // context,
    output: {
      path: path.join(context, 'www'),
      publicPath: props.cdn,
      filename: '[hash].min.js',
    },
    module: {
      rules: [
        {
          test: /\.pug$/,
          loader: 'pug-loader',
        },
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!begin-)/,
          loader: 'babel-loader',
        },
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
        {
          test: /\.(jpe?g|png|gif)$/,
          use: [
            'file-loader',
            'image-webpack-loader?bypassOnDebug',
          ],
        },
        {
          test: /\.ttf$/,
          loader: 'file-loader',
        },
        {
          test: /\.md$/,
          loader: 'vue-markdown-loader',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: `"${stage}"`,
          PROPS: `${JSON.stringify(props)}`,
        },
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new HtmlWebpackPlugin({
        template: path.join(context, 'src/client/index.pug'),
        favicon: path.join(context, 'src/client/images/favicon.ico'),
        inject: 'body',
        filename: 'index.html',
        isCordova,
        preload: ['*.js', '*.css'],
      }),
      new ResourceHintWebpackPlugin(),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    resolve: {
      // mainFields: ['jsnext:main', 'main'],
      modules: [
        'node_modules',
        path.join(context, 'node_modules'),
      ],
      alias: {
        vue: 'vue/dist/vue.js',
      },
    },
  };

  let vueLoader = {
    test: /\.vue$/,
    loader: 'vue-loader',
    options: {
      loaders: {
        js: 'babel-loader',
        sass: `${isLocal ? 'style-loader!' : ''}css-loader?sourceMap!postcss-loader?sourceMap!sass-loader?sourceMap`,
      },
    },
  };

  if (isLocal) {
    config.module.rules.unshift(vueLoader);
    config.plugins.push(new webpack.HotModuleReplacementPlugin());
    config.plugins.push(new webpack.NoEmitOnErrorsPlugin());
    config.performance = false;
    config.devServer = {
      hot: true,
      overlay: true,
      historyApiFallback: true,
      stats: 'minimal',
    };
  } else {
    let ExtractTextPlugin = require('extract-text-webpack-plugin');
    let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

    config.plugins.push(new ExtractTextPlugin('[hash].min.css'));
    vueLoader.options.loaders.sass = ExtractTextPlugin.extract({
      loader: vueLoader.options.loaders.sass,
    });
    config.module.rules.unshift(vueLoader);
    config.plugins.push(new OptimizeCssAssetsPlugin({
      cssProcessorOptions: {
        discardComments: {
          removeAll: true,
        },
      },
    }));
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      },
      sourceMap: true,
    }));
  }

  return config;
};
