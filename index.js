require('babel-polyfill');
let Vue = require('vue');
let VueRouter = require('vue-router').default;
let glyph = require('./glyph/component.vue').default;
// HACK: VueRouter exports an ES6 module and doesn't support CommonJS

module.exports = app => {
  // TODO: merge with mode when mobile is added
  let router = new VueRouter(app.router);
  Vue.use(VueRouter);
  delete app.router;

  Vue.component('glyph', glyph);

  let vm = new Vue(Object.assign({}, app, {
    router,
    template: '<app></app>',
  }));

  vm.$mount('#app');

  return { vm, router };
};
