/* eslint-disable strict, global-require */

let Vue = require('vue');
// let component = require('./vue.pug');
let external = require('./external');

// Vue.config.devtools = false
// Vue.config.debug = false
// Vue.config.silent = true

module.exports = component => {
  Vue.component('external', external);
  component.vm = new Vue(Object.assign({
    render(createElement) {
      return createElement('app');
    },
  }, component));
  component.vm.$mount('#app');
  return component;
};
