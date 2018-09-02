'use strict';

let { VueLoaderPlugin } = require('vue-loader');

module.exports = ({ config, development }) => ({
  module: {
    rules: {
      $build: Array,
      vue: {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      vuePug: {
        test: /vue\.pug$/,
        use: {
          $build: Array,
          vue: 'vue-loader',
          pug: config.module.rules.markup.use.pug,
        },
      },
      styles: {
        use: {
          $build: Array,
          style: {
            $when: development,
            loader: 'vue-style-loader',
          },
        },
      },
      markup: {
        exclude: /vue\.pug$/,
      },
      svg: {
        test: /\.svg$/,
        loader: 'vue-svg-loader',
        options: {
          svgo: {
            plugins: {
              $build: Array,
              comments: { removeComments: true },
              dimensions: { removeDimensions: true },
              xmlns: { removeXMLNS: true },
            },
          },
        },
      },
    },
  },
  plugins: {
    $build: Array,
    vueLoader: {
      $build: (...args) => new VueLoaderPlugin(...args),
    },
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.common.js',
      'vue-router$': 'vue-router/dist/vue-router.common.js',
      vuex$: 'vuex/dist/vuex.common.js',
    },
  },
});
