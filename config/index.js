'use strict';

/* eslint-disable security/detect-non-literal-fs-filename */
let fs = require('fs');
let path = require('path');
let HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = ({ base }) => {
  let template = path.join(base, './index.pug');
  let favicon = path.join(base, './favicon.png');

  return {
    plugins: {
      $build: Array,
      index: {
        $when: fs.existsSync(template),
        $build: options => new HtmlWebpackPlugin(options),
        options: {
          template,
          favicon: {
            $when: fs.existsSync(favicon),
            $build: () => favicon,
          },
        },
      },
    },
  };
};
