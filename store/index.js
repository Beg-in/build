/* eslint-disable security/detect-object-injection */
let Vue = require('vue');
let Vuex = require('vuex');

const state = {};

Vue.use(Vuex);
let store = new Vuex.Store({ state });
let modules = {};

let register = (id, obj) => {
  store.registerModule(modules[id], obj);
};

module.exports = (id, obj) => {
  obj.namespaced = true;
  register(id, obj);
  let helpers = Vuex.createNamespacedHelpers(modules[id]);
  if (obj.actions && obj.actions.init) {
    let { mapActions } = helpers;
    let context = Object.assign({ $store: store }, mapActions(['init']));
    context.init();
  }
  return helpers;
};
module.exports.store = store;

// store.subscribe((...args) => {
//   console.log(args);
// });

module.exports.context = (appModule, context) => {
  if (module.hot) {
    let hot = [];
    register = (id, obj) => {
      let path = modules[id];
      if (hot.includes(id)) {
        store.hotUpdate({ modules: { [path]: obj } });
      } else {
        hot.push(id);
        store.registerModule(path, obj);
      }
    };
    appModule.hot.accept(context.id, () => {});
  }
  context.keys().forEach(key => {
    modules[context.resolve(key)] = key
      .replace(/^\.\//, '')
      .replace(/(\/index)?\.js$/, '');
  });
  return store;
};
