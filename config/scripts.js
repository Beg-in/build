'use strict';

module.exports = ({ properties: { browsers } }) => ({
  module: {
    rules: {
      $build: Array,
      js: {
        test: /\.js$/,
        exclude: /node_modules\/(?!begin-)/,
        loader: 'babel-loader',
        options: {
          presets: {
            $build: Array,
            env: {
              $build: Array,
              preset: '@babel/preset-env',
              options: {
                targets: browsers,
              },
            },
          },
          plugins: {
            $build: Array,
            transformRuntime: '@babel/plugin-transform-runtime',
          },
        },
      },
    },
  },
});
