/* eslint-disable security/detect-object-injection */
let Vue = require('vue');
let Vuex = require('vuex');
let localstorage = require('../localstorage');

const state = {};
const PERSIST = '$persist';
const RESTORE = '_$restore';

Vue.use(Vuex);
let getKey = path => `_store_module_${path}_`;
let store = new Vuex.Store({
  state,

  mutations: {
    [RESTORE](context, path) {
      Object.assign(context[path], localstorage.get(getKey(path)));
    },
  },

  modules: {
    [PERSIST]: {
      namespaced: true,

      actions: {
        restore({ commit }, path) {
          commit(RESTORE, path, { root: true });
        },

        set({ rootState }, path) {
          localstorage.set(getKey(path), rootState[path]);
        },

        clear() {
          localstorage.clear();
        },
      },
    },
  },
});
let modules = {};
let register = (id, obj) => {
  store.registerModule(modules[id], obj);
};
let toContext = helpers => Object.entries(helpers).reduce((out, [name, helper]) => {
  out[name] = (...args) => Object.assign({ $store: store }, helper(...args));
  return out;
}, {});
let { mapActions } = toContext(Vuex.createNamespacedHelpers(PERSIST));
let $persist = mapActions(['restore', 'set', 'clear']);
let persisting = [];

module.exports = Object.assign((id, obj) => {
  obj.namespaced = true;
  register(id, obj);
  let path = modules[id];
  let helpers = Vuex.createNamespacedHelpers(path);
  helpers.context = toContext(helpers);
  if (obj.persist) {
    persisting.push(path);
    $persist.restore(path);
  }
  if (obj.actions && obj.actions.init) {
    let context = helpers.context.mapActions(['init']);
    context.init();
  }
  return helpers;
}, {
  store,
  PERSIST,
  $persist,

  context(appModule, context) {
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
  },
});

store.subscribe(({ type }) => {
  let path = type.substring(0, type.lastIndexOf('/'));
  if (persisting.includes(path)) {
    $persist.set(path);
  }
});
