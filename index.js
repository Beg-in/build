/* eslint-disable strict, global-require */

require('babel-polyfill');
let Vue = require('vue');
let component = require('./vue.pug');
let external = require('./external/vue.pug');

// Vue.config.devtools = false
// Vue.config.debug = false
// Vue.config.silent = true

module.exports = app => {
  Vue.component('external', external);
  if (app.router) {
    let router = require('./router');
    app.router = router.create(app.router);
  }
  app.vm = new Vue(Object.assign(component, app));
  app.vm.$mount('#app');
  return app;
};
