'use strict';

module.exports = () => ({
  module: {
    rules: {
      $build: Array,
      images: {
        test: /\.(jpe?g|png|gif)$/,
        use: {
          $build: Array,
          file: 'file-loader',
          image: 'image-webpack-loader?bypassOnDebug',
        },
      },
    },
  },
});
