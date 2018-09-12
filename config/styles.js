'use strict';

let env = require('postcss-preset-env');
let cssnano = require('cssnano');
let MiniCssExtractPlugin = require('mini-css-extract-plugin');

let { loader } = MiniCssExtractPlugin;

module.exports = ({ development, properties: { browsers } }) => ({
  module: {
    rules: {
      $build: Array,
      styles: {
        test: /\.(sa|sc|c)ss$/,
        use: {
          $build: Array,
          style: {
            $when: development,
            loader: 'style-loader',
            options: { sourceMap: true },
          },
          extract: {
            $when: !development,
            loader,
          },
          css: {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          postcss: {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
              ident: 'postcss',
              plugins: {
                $build: Array,
                env: {
                  $build: env,
                  options: {
                    browsers,
                  },
                },
                cssnano: {
                  $when: !development,
                  $build: cssnano,
                  options: {
                    preset: 'default',
                  },
                },
              },
            },
          },
          sass: {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              indentedSyntax: true,
            },
          },
        },
      },
    },
  },
  plugins: {
    $build: Array,
    extractCss: {
      $when: !development,
      $build: (...args) => new MiniCssExtractPlugin(...args),
      options: {
        filename: '[contenthash].css',
      },
    },
  },
  optimization: {
    $when: development,
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
});
