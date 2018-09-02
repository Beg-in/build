'use strict';

/* eslint-disable security/detect-non-literal-fs-filename  */
let fs = require('fs');
let path = require('path');

module.exports = ({ properties: { main }, context, toContext }) => {
  if (main) {
    main = toContext(main);
  } else {
    let locate = dir => path.join(toContext(dir), './index.js');
    let mainSrcClient = locate('src/client');
    let mainClient = locate('client');
    let mainSrc = locate('src');
    if (fs.existsSync(mainSrcClient)) {
      main = mainSrcClient;
    } else if (fs.existsSync(mainClient)) {
      main = mainClient;
    } else if (fs.existsSync(mainSrc)) {
      main = mainSrc;
    } else {
      main = locate(context);
    }
    // BUG: resolve does't work properly when from another directory, see: https://github.com/nodejs/node/issues/18686
    // main = require.resolve(MAIN, { paths: [
    //   toContext('src/client'),
    //   toContext('client'),
    //   toContext('src'),
    //   context,
    // ] });
  }

  return {
    main,
    base: main.substring(0, main.lastIndexOf('/')),
  };
};
