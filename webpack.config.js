'use strict';

/* eslint-disable global-require, import/no-dynamic-require, security/detect-non-literal-require */
let path = require('path');
let properties = require('./config/properties');
let main = require('./config/main');

module.exports = (options = {}, argv = {}) => {
  let {
    context = process.cwd(),
    url = 'http://localhost',
    port = 8080,
  } = options;
  let { mode } = argv;

  let api = {
    options,
    argv,
    package: require(path.join(context, 'package')),
    context,
    url,
    port,
    mode,
    dir: __dirname,
    toContext: (...args) => path.join(context, ...args),
    development: mode === 'development',
    properties: {},
  };
  try {
    api.properties = require(path.join(api.context, 'properties'));
  } catch (e) {
    // intentionally empty
  }
  api.properties = properties(api);
  Object.assign(api, main(api));

  // let config;
  // try {
  //   let contextConfig = require(api.toContext('build.config'));
  //   config = contextConfig(Object.assign(options, { context, port, config, toContext, props, pug }));
  // } catch (e) {
  //   console.warn('No webpack config found in project');
  // }

  // return config;
};
