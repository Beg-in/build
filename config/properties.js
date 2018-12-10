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

  let out = assignDeep({
    build: {
      cdn: `https://cdn.${domain}/`,
      api: `https://api.${domain}/v1/`,
      root: `https://${domain}/`,
      domain,
      dist: 'dist',
      browsers: 'last 2 versions',
      stage,
      name,
      version,
      description,
    },
    public: {
      stage,
      name,
      version,
      description,
    },
  }, properties.production || {});
  if (properties[stage]) {
    out = assignDeep(out, properties[stage]);
  }
  if (development) {
    out = assignDeep(out, {
      build: {
        cdn: '/',
        api: `${url}:${~~port + 1}/v1/`,
        root: `${url}:${port}/`,
      },
    });
  }

  let { cdn, api, root } = out.build;
  return Object.assign(out.build, {
    public: Object.assign({ cdn, api, root }, out.public),
  });
};
