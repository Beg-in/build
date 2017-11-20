/* eslint-disable strict */

require('babel-polyfill');
let Vue = require('vue');
let VueRouter = require('vue-router');
let component = require('./vue.pug');
let external = require('./external/vue.pug');

module.exports = app => {
  Vue.component('external', external);
  if (app.router) {
    // TODO: merge with mode when mobile is added
    let router = new VueRouter(Object.assign({ mode: 'history' }, app.router));
    Vue.use(VueRouter);
    delete app.router;
    app.router = router;
  }
  app.vm = new Vue(Object.assign(component, app));
  app.vm.$mount('#app');
  return app;
};
