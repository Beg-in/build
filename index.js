/* eslint-disable strict */

require('babel-polyfill');
let Vue = require('vue');
let VueRouter = require('vue-router').default;

module.exports = app => {
  let component = { template: '<app></app>' };
  let out = {};
  if (app.router) {
    // TODO: merge with mode when mobile is added
    let router = new VueRouter(Object.assign({ mode: 'history' }, app.router));
    Vue.use(VueRouter);
    delete app.router;
    component.router = router;
    out.router = router;
  }
  let vm = new Vue(Object.assign({}, app, component));
  vm.$mount('#app');
  out.vm = vm;
  return out;
};
