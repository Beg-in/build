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
let { InjectManifest } = require('workbox-webpack-plugin');
let WebpackPwaManifest = require('webpack-pwa-manifest');

const MAIN = './index.js';
const BROWSERS = 'last 2 versions';
const WORKER = 'sw.js';

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
  let pkg = require(path.join(context, 'package'));

  let props;
  try {
    props = require(path.join(context, 'properties'));
  } catch (e) {
    props = { domain: pkg.domain };
  }
  const DOMAIN = props.domain;
  props = assignDeep(props.base || {}, props[stage] || {}).client || {};
  const devRoot = url || 'http://localhost';
  props = Object.assign({
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
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
    // BUG: resolve does't work properly when from another directory, see: https://github.com/nodejs/node/issues/18686
    let locate = dir => path.join(toContext(dir), MAIN);
    let entrySrcClient = locate('src/client');
    let entryClient = locate('src/client');
    let entrySrc = locate('src/client');
    if (fs.existsSync(entrySrcClient)) {
      entry = entrySrcClient;
    } else if (fs.existsSync(entryClient)) {
      entry = entryClient;
    } else if (fs.existsSync(entrySrc)) {
      entry = entrySrc;
    } else {
      entry = locate(context);
    }
    // entry = require.resolve(MAIN, { paths: [
    //   toContext('src/client'),
    //   toContext('client'),
    //   toContext('src'),
    //   context,
    // ] });
  }
  let dist = props.dist || 'dist';
  let filename = props.filename || '[hash].min.js';
  let base = entry.substring(0, entry.lastIndexOf('/'));
  let worker = Object.assign({
    swSrc: WORKER,
    swDest: WORKER,
  }, props.worker || {});
  worker.swSrc = path.join(base, worker.swSrc);
  props.worker = worker.swDest;
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
      ident: 'pug-loader',
      data: { props },
      plugins: [{
        resolve(file, source) {
          if (file.indexOf('~') === 0) {
            return require.resolve(file.substring(1), { paths: modules });
          }
          return path.join(path.dirname(source), file);
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
    // FIXME: sass-loader options seem broken
    // options: {
    //   sourceMap: true,
    //   includePaths: modules.reverse(),
    // },
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
        exclude: /node_modules\/(?!begin-)/,
        loader: 'babel-loader',
        options: {
          presets: ['stage-3', ['env', { targets: { browsers: [BROWSERS] }, useBuiltIns: true }]],
          plugins: ['external-helpers', 'transform-runtime'],
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

  let template = path.join(base, './index.pug');
  if (fs.existsSync(template)) {
    let options = { template, props };
    let favicon = path.join(base, './favicon.png');
    if (fs.existsSync(favicon)) {
      options.favicon = favicon;
    }
    config.plugins.push(new HtmlWebpackPlugin(options));
    config.plugins.push(new WebpackPwaManifest(Object.assign({
      name: props.title,
      short_name: props.name,
      description: props.description,
      theme_color: props.color,
      background_color: '#ffffff',
      orientation: 'portrait-primary',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: favicon,
          sizes: [96, 128, 192, 256, 384, 512, 1024], // multiple sizes
        },
      ],
    }, props.manifest || {})));
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

  if (fs.existsSync(worker.swSrc)) {
    config.plugins.push(new InjectManifest(worker));
  }

  try {
    let contextConfig = require(toContext('build.config'));
    config = contextConfig(Object.assign(opts, { context, port, config, toContext, props, pug }));
  } catch (e) {
    console.warn('No webpack config found in project');
  }

  return config;
};
