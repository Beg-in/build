let Vue = require('vue');
let Vuex = require('vuex');

const state = {};

Vue.use(Vuex);

let store = new Vuex.Store({ state });

module.exports = (path, id, obj) => {
  obj.namespaced = true;
  store.registerModule(path, obj);
  if (module.hot) {
    module.hot.accept(id, () => {
      // store.unregisterModule(path)
      /* eslint-disable global-require, import/no-dynamic-require, security/detect-non-literal-require */
      store.hotUpdate({ modules: { [path]: require(id).default } });
      /* eslint-enable */
    });
  }
  return Vuex.createNamespacedHelpers(path);
};

module.exports.store = store;
