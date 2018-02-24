let Vue = require('vue');
let VueRouter = require('vue-router');

Vue.use(VueRouter);
let config = {
  mode: 'history', // TODO: merge with mode when mobile is added
};

let ready;
let deferred = new Promise(resolve => {
  ready = resolve;
});

module.exports = {
  create(...args) {
    Object.assign(config, ...args);
    let router = new VueRouter(config);
    router.beforeEach(async (to, from, next) => {
      await deferred;
      next();
    });
    Object.assign(module.exports, router);
    Object.setPrototypeOf(module.exports, Object.getPrototypeOf(router));
    return module.exports;
  },

  register(routes) {
    module.exports.addRoutes(routes);
    ready();
  },
};
