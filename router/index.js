let Vue = require('vue');
let VueRouter = require('vue-router');

let ready;
module.exports = {
  ready: new Promise(resolve => {
    ready = resolve;
  }),

  create(routes) {
    Vue.use(VueRouter);
    routes.mode = 'history'; // TODO: merge with mode when mobile is added
    let router = new VueRouter(routes);
    Object.assign(module.exports, router);
    Object.setPrototypeOf(module.exports, Object.getPrototypeOf(router));
    ready(module.exports);
    return module.exports;
  },
};
