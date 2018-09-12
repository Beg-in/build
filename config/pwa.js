'use strict';

/* eslint-disable security/detect-non-literal-fs-filename */
let fs = require('fs');
let path = require('path');
let { InjectManifest } = require('workbox-webpack-plugin');
let WebpackPwaManifest = require('webpack-pwa-manifest');

const WORKER = 'sw.js';

module.exports = ({ base, properties, config }) => {
  let options = Object.assign({
    swSrc: WORKER,
    swDest: WORKER,
  }, properties.worker || {});
  options.swSrc = path.join(base, options.swSrc);

  return {
    plugins: {
      $build: Array,
      pwaManifest: {
        $build: manifest => new WebpackPwaManifest(manifest),
        manifest: {
          name: properties.title,
          short_name: properties.name,
          description: properties.description,
          theme_color: properties.color,
          background_color: properties.background || '#ffffff',
          orientation: properties.orientation || 'portrait-primary',
          display: properties.display || 'standalone',
          start_url: '/',
          icons: {
            $build: Array,
            favicon: {
              src: config.plugins.index.options.favicon,
              sizes: [96, 128, 192, 256, 384, 512, 1024], // multiple sizes
            },
          },
        },
      },
      injectManifest: {
        $when: fs.existsSync(options.swSrc),
        $build: (...args) => new InjectManifest(...args),
        options,
      },
      define: {
        options: {
          'process.env': {
            PROPERTIES: {
              options: {
                worker: options.swDest,
              },
            },
          },
        },
      },
    },
  };
};
