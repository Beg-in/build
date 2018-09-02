'use strict';

module.exports = () => ({
  module: {
    rules: {
      $build: Array,
      fonts: {
        test: /\.ttf$/,
        loader: 'file-loader',
      },
    },
  },
});
