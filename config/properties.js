'use strict';

let assignDeep = require('begin-util/assign-deep');

module.exports = ({
  properties,
  stage,
  development,
  url,
  port,
  package: {
    name,
    version,
    description,
  },
}) => {
  let domain = (properties
    && properties.production
    && properties.production.build
    && properties.production.build.domain) || name;

  properties = assignDeep({
    build: {
      cdn: `https://cdn.${domain}/`,
      api: `https://api.${domain}/v1/`,
      root: `https://${domain}/`,
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
  }, properties.production || {});
  if (properties[stage]) {
    properties = assignDeep(properties, properties[stage]);
  }
  if (development) {
    properties = assignDeep(properties, {
      build: {
        cdn: '/',
        api: `${url}:${~~port + 1}/v1/`,
        root: `${url}:${port}/`,
      },
    });
  }

  let { cdn, api, root } = properties.build;
  return Object.assign(properties.build, {
    public: Object.assign({ cdn, api, root }, properties.public),
  });
};
