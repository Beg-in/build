'use strict';

/* eslint-disable global-require, import/no-dynamic-require, security/detect-non-literal-require, security/detect-non-literal-fs-filename */
let fs = require('fs');
let path = require('path');
let webpack = require('webpack');
let autoprefixer = require('autoprefixer');
let cssnano = require('cssnano');
let { VueLoaderPlugin } = require('vue-loader');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
let MiniCssExtractPlugin = require('mini-css-extract-plugin');
let assignDeep = require('begin-util/assign-deep');

const MAIN = 'index.js';
const BROWSERS = 'last 2 versions';

module.exports = (opts = {}) => {
  let {
    context = process.cwd(),
    stage = 'production',
    port,
    isCordova = false,
    url,
  } = opts;

  let toContext = (...args) => path.join(context, ...args);
  let isLocal = stage === 'local';

  let props;
  try {
    props = require(path.join(context, 'properties'));
  } catch (e) {
    props = { domain: require(path.join(context, 'package')).domain };
  }
  const DOMAIN = props.domain;
  props = assignDeep(props.base || {}, props[stage] || {}).client || {};
  const devRoot = url || 'http://localhost';
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
  props.env = props.env || props.stage;

  let entry;
  if (props.entry) {
    entry = toContext(props.entry);
  } else {
    entry = require.resolve(MAIN, { paths: [
      toContext('src/client'),
      toContext('client'),
      toContext('src'),
      context,
    ] });
  }
  let dist = props.dist || 'dist';
  let filename = props.filename || '[hash].min.js';
  delete props.entry;
  delete props.dist;
  delete props.filename;

  let modules = [
    toContext('node_modules'),
    path.join(__dirname, 'node_modules'),
  ];

  let pug = {
    loader: 'pug-plain-loader',
    options: {
      data: { props },
      plugins: [{
        resolve(file, source) {
          let settings = { paths: [path.dirname(source)] };
          if (file.indexOf('~') === 0) {
            file = file.substring(1);
            settings.paths = modules;
          }
          return require.resolve(file, settings);
        },
      }],
    },
  };

  let sass = [{
    loader: 'css-loader',
    options: {
      sourceMap: true,
      importLoaders: 2,
    },
  }, {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
      ident: 'postcss',
      plugins() {
        return [
          autoprefixer(BROWSERS),
          cssnano(),
        ];
      },
    },
  }, {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
      includePaths: modules.reverse(),
    },
  }];

  let config = {
    entry,
    output: {
      path: toContext(dist),
      publicPath: props.cdn,
      filename,
    },
    module: {
      rules: [{
        test: /\.vue$/,
        loader: 'vue-loader',
      }, {
        test: /vue\.pug$/,
        use: ['vue-loader', pug],
      }, {
        test: /\.pug$/,
        exclude: /vue\.pug$/,
        oneOf: [{
          resourceQuery: /^\?vue/,
          loader: pug,
        }, {
          use: ['html-loader', pug],
        }],
      }, {
        test: /\.js$/,
        // exclude: /node_modules\/(?!begin-)/,
        loader: 'babel-loader',
        options: {
          presets: [['env', { targets: { browsers: [BROWSERS] }, useBuiltIns: true }]],
        },
      }, {
        test: /\.svg$/,
        loader: 'vue-svg-loader',
        options: {
          svgo: {
            plugins: [
              { removeComments: true },
              { removeDimensions: true },
              { removeXMLNS: true },
            ],
          },
        },
      }, {
        test: /\.(jpe?g|png|gif)$/,
        use: ['file-loader', 'image-webpack-loader?bypassOnDebug'],
      }, {
        test: /\.ttf$/,
        loader: 'file-loader',
      }, {
        test: /\.sass$/,
        use: sass,
      }],
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: `"${props.env}"`,
          PROPS: `${JSON.stringify(props)}`,
        },
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    resolve: {
      modules,
      alias: {
        '^@': context,
        vue$: 'vue/dist/vue.runtime.common.js',
        'vue-router$': 'vue-router/dist/vue-router.common.js',
        vuex$: 'vuex/dist/vuex.common.js',
      },
    },
    resolveLoader: {
      modules: ['node_modules', toContext('node_modules')],
    },
  };

  let base = entry.substring(0, entry.lastIndexOf('/'));
  let template = path.join(base, './index.pug');
  if (fs.existsSync(template)) {
    let options = { template, props };
    let favicon = path.join(base, './favicon.png');
    if (fs.existsSync(favicon)) {
      options.favicon = favicon;
    }
    config.plugins.push(new HtmlWebpackPlugin(options));
  }

  if (isLocal) {
    config.mode = 'development';
    sass.unshift('vue-style-loader');
    config.plugins = config.plugins.concat([
      new webpack.HotModuleReplacementPlugin(),
    ]);
    Object.assign(config, {
      performance: false,
      devServer: {
        hot: true,
        overlay: true,
        historyApiFallback: true,
        stats: 'minimal',
      },
    });
  } else {
    config.mode = 'production';
    sass.unshift(MiniCssExtractPlugin.loader);
    config.plugins = config.plugins.concat([
      new MiniCssExtractPlugin({ filename: '[hash].min.css' }),
      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: {
          discardComments: {
            removeAll: true,
          },
        },
      }),
    ]);
  }

  try {
    let contextConfig = require(toContext('webpack.config'));
    config = contextConfig(Object.assign(opts, { context, port, config, toContext, props, pug }));
  } catch (e) {
    console.warn('No webpack config found in project');
  }

  return config;
};
