'use strict';

let fs = require('fs');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let assignDeep = require('begin-util/assign-deep');
let path = require('path');
let webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const MAIN = './index.js';

/* eslint-disable global-require, import/no-dynamic-require, security/detect-non-literal-require */
module.exports = (opts = {}) => {
  let {
    context = process.cwd(),
    stage = 'production',
    port,
    isCordova = false,
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
  /* eslint-disable security/detect-object-injection */
  props = assignDeep(props.base || {}, props[stage] || {}).client || {};
  /* eslint-enable security/detect-object-injection */
  const devRoot = `http://${process.env.API_URL || 'localhost'}`;
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

  let targets = { browsers: ['last 2 versions'] };

  let options = {
    presets: [['env', { targets, useBuiltIns: true }]],
  };

  let pug = {
    loader: 'pug-html-loader',
    options: {
      data: { props },
      plugins: {
        resolve(file, source) {
          let settings = { paths: [path.dirname(source)] };
          if (file.indexOf('~') === 0) {
            file = file.substring(1);
            settings.paths = modules;
          }
          return require.resolve(file, settings);
        },
      },
    },
  };

  let python = [{
    loader: 'babel-loader',
    options,
  }, {
    loader: 'javascripthon-loader',
  }];

  let vueLoader = {
    loader: 'vue-loader',
    options: {
      esModule: false,
      loaders: {
        js: {
          loader: 'babel-loader',
          options,
        },
        pug,
        python,
        sass: [{
          loader: 'css-loader',
          options: {
            sourceMap: true,
            importLoaders: 2,
          },
        }, {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
            config: {
              ctx: {
                autoprefixer: targets,
              },
            },
          },
        }, {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            includePaths: modules.reverse(),
          },
        }],
      },
    },
  };

  let config = {
    entry,
    output: {
      path: toContext(dist),
      publicPath: props.cdn,
      filename,
    },
    module: {
      rules: [{
        test: /\.pug$/,
        exclude: /vue\.pug$/,
        use: ['html-loader', pug],
      }, {
        test: /\.js$/,
        exclude: /node_modules\/(?!begin-)/,
        loader: 'babel-loader',
        options,
      }, {
        test: /\.py$/,
        use: python,
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
        test: /\.md$/,
        loader: 'vue-markdown-loader',
      }, {
        test: /\.vue$/,
        loader: vueLoader,
      }, {
        test: /vue\.pug$/,
        use: [vueLoader, pug],
      }],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: `"${props.env}"`,
          PROPS: `${JSON.stringify(props)}`,
        },
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    resolve: {
      modules,
      alias: {
        '^@': context,
        // HACK: Vue packages export ES6 modules
        vue$: 'vue/dist/vue.runtime.common.js',
        'vue-router$': 'vue-router/dist/vue-router.common.js',
        vuex$: 'vuex/dist/vuex.common.js',
      },
    },
  };

  let base = entry.substring(0, entry.lastIndexOf('/'));
  let template = path.join(base, './index.pug');
  /* eslint-disable security/detect-non-literal-fs-filename */
  if (fs.existsSync(template)) {
    /* eslint-enable security/detect-non-literal-fs-filename */
    config.plugins.push(new HtmlWebpackPlugin({
      template,
      favicon: path.join(base, './favicon.png'),
      inject: 'body',
      filename: 'index.html',
      props,
    }));
  }

  let fallback = {
    loader: 'style-loader',
  };

  if (isLocal) {
    vueLoader.options.loaders.sass.unshift(fallback);
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
    config.devtool = 'source-map';
    config.plugins.push(new ExtractTextPlugin('[hash].min.css'));
    vueLoader.options.loaders.sass = ExtractTextPlugin.extract({
      use: vueLoader.options.loaders.sass,
      fallback,
    });
    config.plugins = config.plugins.concat([
      new OptimizeCssAssetsPlugin({
        cssProcessorOptions: {
          discardComments: {
            removeAll: true,
          },
        },
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
        },
        output: {
          comments: false,
        },
      }),
    ]);
  }

  try {
    let contextConfig = require(toContext('webpack.config'));
    config = contextConfig(Object.assign(opts, { context, port, config, toContext, props }));
  } catch (e) {
    console.warn('No webpack config found in project');
  }

  return config;
};
