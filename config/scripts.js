'use strict';

module.exports = ({ properties: { browsers } }) => ({
  module: {
    rules: {
      $build: Array,
      scripts: {
        test: /\.js$/,
        exclude: /node_modules\/(?!begin-)/,
        loader: 'babel-loader',
        options: {
          sourceType: 'unambiguous',
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
