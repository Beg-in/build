/* eslint-disable strict, global-require */

require('babel-polyfill');
let Vue = require('vue');
let component = require('./vue.pug');
let external = require('./external/vue.pug');

module.exports = app => {
  Vue.component('external', external);
  if (app.router) {
    let VueRouter = require('vue-router');
    // TODO: merge with mode when mobile is added
    let router = new VueRouter(Object.assign({ mode: 'history' }, app.router));
    Vue.use(VueRouter);
    delete app.router;
    app.router = router;
  }
  if (app.store) {
    app.store = require('./store').store;
  }
  app.vm = new Vue(Object.assign(component, app));
  app.vm.$mount('#app');
  return app;
};
