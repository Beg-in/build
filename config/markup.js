'use strict';

let path = require('path');

module.exports = data => ({
  module: {
    rules: {
      $build: Array,
      markup: {
        test: /\.pug$/,
        use: {
          $build: Array,
          html: {
            loader: 'html-loader',
          },
          pug: {
            loader: 'pug-plain-loader',
            options: {
              ident: 'pug-loader',
              data,
              plugins: {
                $build: Array,
                rootOperator: {
                  resolve(file, source) {
                    if (file.indexOf('~') === 0) {
                      return require.resolve(file.substring(1), {
                        paths: data.config.base.resolve.modules,
                      });
                    }
                    return path.join(path.dirname(source), file);
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});
