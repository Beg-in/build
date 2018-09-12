'use strict';

let path = require('path');

module.exports = data => {
  let paths = Object.entries(data.config.resolve.modules).reduce((out, [key, value]) => {
    if (key[0] !== '$') {
      out.push(value);
    }
    return out;
  }, []);

  return {
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
                        let modules = require.resolve(file.substring(1), { paths });
                        return modules;
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
  };
};
