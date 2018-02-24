let store = require('begin-build/store');

// Optional things to do in init
let api = require('begin-build/api');
let { ready } = require('begin-build/router');

/*
 * How to set up a store module:
 * - store() will namespace this Vuex store module by the name of the file
 * - keep module.id as the first argument to store()
 * - index.js inside subdirectories will become namespaced to the parent directory name
 * - if this is in a subdirectory of the store directory this will be a pathed submodule
 */
module.exports = store(module.id, {
  state: {
    example: false,
  },

  mutations: {
    setExample(state, data) {
      state.example = data;
    },

    toggleExample(state) {
      state.example = !state.example;
    },
  },

  getters: {
    getExample(state) {
      return state.example;
    },
  },

  actions: {
    // init is a special action that will be automatically executed when this store is initialized
    async init({ commit, getters }) {
      // run some async function like a request using axios
      let { data } = await api.get('example/endpoint');

      // commit mutations or dispatch actions
      commit('setExample', data);

      // do things with router and the store
      let router = await ready;
      router.beforeEach((route, redirect, next) => {
        if (route.matched.some(record => record.meta.example)) {
          commit('setExample', true);

        // view the store with getters
        } else if (getters.example) {
          commit('toggleExample');
        }
        next();
      });
    },
  },
});
