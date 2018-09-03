'use strict';

/* eslint-disable global-require, import/no-dynamic-require, security/detect-non-literal-require */
let path = require('path');
let assignDeep = require('begin-util/assign-deep');
let { isObject, isFunction } = require('begin-util');
let properties = require('./config/properties');
let main = require('./config/main');
let parts = require('./config/default');

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

  parts = api.properties.config || parts;

  let merged = Object.values(parts).reduce((part, config) =>
    assignDeep(config, part(Object.assign({ config }, api))), {});

  let build = tree => {
    let { $build } = tree;
    delete tree.$build;
    Object.entries(tree).reduce(([key, value], out) => {
      if (key === '$when') {
        return out;
      }
      if (isObject(value)) {
        if (value.$when === false) {
          return out;
        }
        out[key] = build(value);
        return out;
      }
      out[key] = value;
      return out;
    }, {});
    if ($build) {
      if ($build === Array) {
        return Object.values(tree);
      } else if (isFunction($build)) {
        return $build.call(tree, ...Object.values(tree));
      }
    }
    return tree;
  };

  return build(merged);
};
