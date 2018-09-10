'use strict';

let assignDeep = require('begin-util/assign-deep');

module.exports = api => {
  let { properties, stage, development, url, port, package: {
    name, version, description, domain = 'localhost',
  } } = api;

  properties = assignDeep({
    build: {
      domain,
      dist: 'dist',
      browsers: 'last 2 versions',
    },
    public: {
      stage,
      name,
      version,
      description,
    },
  }, properties.base || {}, properties[stage] || {}, !development ? {} : {
    public: {
      cdn: '/',
      api: `${url}:${~~port + 1}/v1/`,
      root: `${url}:${port}/`,
    },
  });

  properties.public = Object.assign({
    cdn: `https://cdn.${properties.build.domain}/`,
    api: `https://api.${properties.build.domain}/v1/`,
    root: `https://${properties.build.domain}/`,
  }, properties.public);

  Object.assign(properties, properties.build, properties.public);

  return properties;
};
