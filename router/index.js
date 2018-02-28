let Vue = require('vue');
let VueRouter = require('vue-router');

Vue.use(VueRouter);
let config = {
  mode: 'history', // TODO: merge with mode when mobile is added
};

let first = true;
let ready;
let deferred = new Promise(resolve => {
  ready = resolve;
});

module.exports = {
  create(...args) {
    Object.assign(config, ...args);
    let router = new VueRouter(config);
    let initial;
    router.beforeEach((to, from, next) => {
      if (first) {
        first = false;
        initial = to;
        next(false);
      } else {
        next();
      }
    });
    (async () => {
      await deferred;
      router.replace(initial);
    })();
    Object.assign(module.exports, router);
    Object.setPrototypeOf(module.exports, Object.getPrototypeOf(router));
    return module.exports;
  },

  register(routes) {
    module.exports.addRoutes(routes);
    ready();
  },
};
