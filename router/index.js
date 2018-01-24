let Vue = require('vue');
let VueRouter = require('vue-router');

module.exports = {};

let ready;
module.exports.ready = new Promise(resolve => {
  ready = resolve;
});

module.exports.create = routes => {
  Vue.use(VueRouter);
  routes.mode = 'history'; // TODO: merge with mode when mobile is added
  let router = new VueRouter(routes);
  Object.assign(module.exports, router);
  Object.setPrototypeOf(module.exports, Object.getPrototypeOf(router));
  ready(module.exports);
  return module.exports;
};
