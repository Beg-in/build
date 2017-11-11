'use strict';

let HtmlWebpackPlugin = require('html-webpack-plugin');
let ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
let assignDeep = require('begin-util/assign-deep');
let path = require('path');
let webpack = require('webpack');

const MAIN = './index.js';

module.exports = ({
  context = process.cwd(),
  stage = 'production',
  port,
  isCordova = false,
} = {}) => {
  let isLocal = stage === 'local';
  /* eslint-disable import/no-dynamic-require */
  let base = require.resolve(MAIN, { paths: [
    path.join(context, 'src/client'),
    path.join(context, 'src/'),
    context,
  ] });
  base = base.substring(0, base.lastIndexOf('/'));
  let props;
  try {
    props = require(`${context}/properties`);
  } catch (e) {
    props = { domain: require(`${context}/package`).domain };
  }
  /* eslint-enable import/no-dynamic-require */
  const DOMAIN = props.domain;
  const devRoot = `http://${process.env.API_URL || 'localhost'}`;
  props = assignDeep(props.base || {}, props[stage] || {}).client || {};
  props = Object.assign({
    isCordova,
    cdn: `https://cdn.${DOMAIN}/`,
    api: `https://api.${DOMAIN}/v1/`,
    root: `https://${DOMAIN}/`,
  }, props, !isLocal ? {} : {
    cdn: '/',
    api: `${devRoot}:${~~port + 1}/v1/`,
    root: `${devRoot}:${~~port}/`,
  });
  props.stage = stage;

  let modules = [
    path.join(context, 'node_modules'),
    path.join(__dirname, 'node_modules'),
    'node_modules',
  ];

  let config = {
    devtool: `cheap-module${isLocal ? '-eval' : ''}-source-map`,
    entry: path.join(base, MAIN),
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
          options: {
            presets: [['env', { targets: { browsers: ['last 2 versions'] }, useBuiltIns: true }]],
          },
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
        template: path.join(base, './index.pug'),
        favicon: path.join(base, './favicon.png'),
        inject: 'body',
        filename: 'index.html',
        preload: ['*.js', '*.css'],
        props,
      }),
      new ResourceHintWebpackPlugin(),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    resolve: {
      // mainFields: ['jsnext:main', 'main'],
      modules,
      alias: {
        vue: 'vue/dist/vue.js',
      },
    },
  };

  // CSS Modules
  // https://github.com/vuejs/vue-loader/issues/454
  // https://github.com/css-modules/css-modules/issues/70
  // https://github.com/css-modules/css-modules
  // https://github.com/css-modules/postcss-modules
  let vueLoader = {
    test: /\.vue$/,
    loader: 'vue-loader',
    options: {
      loaders: {
        sass: [{
          loader: 'css-loader',
          options: { sourceMap: true },
        }, {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
            config: {
              ctx: {
                autoprefixer: { browsers: ['last 2 versions'] },
              },
            },
          },
        }, {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            includePaths: modules,
          },
        }],
        // `${isLocal ? 'style-loader!' : ''}css-loader?sourceMap!postcss-loader?sourceMap!sass-loader?sourceMap`,
      },
    },
  };

  if (isLocal) {
    vueLoader.options.loaders.sass.unshift({
      loader: 'style-loader',
      options: { sourceMap: true },
    });
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
    // let ExtractTextPlugin = require('extract-text-webpack-plugin');
    let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

    // config.plugins.push(new ExtractTextPlugin('[hash].min.css'));
    // vueLoader.options.loaders.sass = ExtractTextPlugin.extract({
    //   loader: vueLoader.options.loaders.sass,
    // });
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
