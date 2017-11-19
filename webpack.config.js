'use strict';

let HtmlWebpackPlugin = require('html-webpack-plugin');
let assignDeep = require('begin-util/assign-deep');
let path = require('path');
let webpack = require('webpack');
let ExtractTextPlugin = require('extract-text-webpack-plugin');
let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const MAIN = './index.js';

module.exports = ({
  context = process.cwd(),
  stage = 'production',
  port,
  isCordova = false,
} = {}) => {
  let isLocal = stage === 'local';
  let base = require.resolve(MAIN, { paths: [
    path.join(context, 'src/client'),
    path.join(context, 'src/'),
    context,
  ] });
  base = base.substring(0, base.lastIndexOf('/'));
  let props;

  /*
     eslint-disable
     global-require,
     import/no-dynamic-require,
     security/detect-non-literal-require,
     security/detect-object-injection
  */
  try {
    props = require(`${context}/properties`);
  } catch (e) {
    props = { domain: require(`${context}/package`).domain };
  }
  props = assignDeep(props.base || {}, props[stage] || {}).client || {};
  /* eslint-enable */

  const DOMAIN = props.domain;
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

  let modules = [
    path.join(context, 'node_modules'),
    path.join(__dirname, 'node_modules'),
    'node_modules',
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
        resolve(filename, source) {
          let opts = { paths: [path.dirname(source)] };
          if (filename.indexOf('~') === 0) {
            filename = filename.substring(1);
            opts.paths = modules;
          }
          return require.resolve(filename, opts);
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
            includePaths: modules,
          },
        }],
      },
    },
  };

  let config = {
    entry: path.join(base, MAIN),
    output: {
      path: path.join(context, 'www'),
      publicPath: props.cdn,
      filename: '[hash].min.js',
    },
    module: {
      rules: [{
        /* eslint-disable security/detect-unsafe-regex */
        test: /(?<!vue)\.pug$/,
        /* eslint-enable */
        loaders: ['html-loader', pug],
      }, {
        test: /\.js$/,
        exclude: /node_modules\/(?!begin-)/,
        loader: 'babel-loader',
        options,
      }, {
        test: /\.py$/,
        loaders: python,
      }, {
        test: /\.svg$/,
        loader: 'vue-svg-loader',
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
        loaders: [vueLoader, pug],
      }],
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
        props,
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    resolve: {
      modules,
      alias: {
        vue: 'vue/dist/vue.js',
        // HACK: VueRouter exports an ES6 module
        'vue-router': 'vue-router/dist/vue-router.common.js',
      },
    },
  };

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
      // sourceMap: true,
    }));
  }

  return config;
};
