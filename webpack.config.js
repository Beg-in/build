'use strict';

/* eslint-disable global-require, import/no-dynamic-require, security/detect-non-literal-require */
let path = require('path');
let assignDeep = require('begin-util/assign-deep');
let { isRegex, isObject, isFunction } = require('begin-util');
let properties = require('./config/properties');
let main = require('./config/main');

module.exports = (options = {}, argv = {}) => {
  let {
    stage = 'production',
    context = process.cwd(),
    url = 'http://localhost',
    port = 8080,
  } = options;
  let development = stage === 'development';
  let { mode = development ? 'development' : 'production' } = argv;

  let api = {
    development,
    options,
    argv,
    package: require(path.join(context, 'package')),
    mode,
    stage,
    context,
    url,
    port,
    dir: __dirname,
    toContext: (...args) => path.join(context, ...args),
    properties: {},
  };
  try {
    api.properties = require(path.join(api.context, 'properties'));
  } catch (e) {
    console.warn('properties.js not found in project');
  }
  api.properties = properties(api);
  Object.assign(api, main(api));

  let parts;
  if (isFunction(api.properties.config)) {
    parts = api.properties.config(api);
  } else {
    parts = Object.assign({}, require('./config/basic'));
  }

  let merged = Object.values(parts).reduce((config, part) =>
    assignDeep(config, part(Object.assign({ config }, api))), {});

  let build = tree => {
    let { $build } = tree;
    delete tree.$build;
    tree = Object.entries(tree).reduce((out, [key, value]) => {
      if (key === '$when' || value === undefined) {
        return out;
      }
      if (!isRegex(value) && isObject(value)) {
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
      }
      if (isFunction($build)) {
        return $build.call(tree, ...Object.values(tree));
      }
    }
    return tree;
  };

  return build(merged);
};
