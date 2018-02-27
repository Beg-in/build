let Vue = require('vue');
let { isString } = require('begin-util');
let { delay } = require('begin-util/async');
let { store, getHelpers } = require('../store');

const NAMESPACE = '$alerts';
const DURATION = 7000;

store.registerModule(NAMESPACE, {
  namespaced: true,

  state: {
    id: 0,
    messages: {},
  },

  mutations: {
    increment(state) {
      state.id++;
    },

    alert(state, obj) {
      Vue.set(state.messages, obj.id, obj);
    },

    remove(state, id) {
      Vue.delete(state.messages, id);
    },

    removeAll(state) {
      state.messages = {};
    },
  },

  getters: {
    alerts(state) {
      return Object.values(state.messages);
    },
  },

  actions: {
    getId({ state, commit }) {
      let { id } = state;
      commit('increment');
      return id;
    },

    dismiss({ commit }, id) {
      commit('remove', id);
    },

    dismissAll({ commit }) {
      commit('removeAll');
    },

    async push({ commit, dispatch }, { type = 'error', message, sticky = false }) {
      if (!message) {
        console.error(new Error('Alert created without message'));
        return;
      }
      if (message.response) {
        message = message.response;
      }
      if (message.status === 0 || message.status === 403 || message.status === 401) {
        return;
      }
      if (message.status) {
        message = message.data;
      }
      if (message.error) {
        message = message.error;
      }
      if (message.message) {
        console.error(message);
        /* eslint-disable prefer-destructuring */
        message = message.message;
        /* eslint-enable */
      }
      if (!isString(message)) {
        console.error(message);
        return;
      }
      let id = await dispatch('getId');
      commit('alert', { id, type, message });
      if (!sticky) {
        await delay(DURATION);
        dispatch('dismiss', id);
      }
    },

    error({ dispatch }, message) {
      dispatch('push', { type: 'error', message });
    },

    success({ dispatch }, message) {
      dispatch('push', { type: 'success', message });
    },

    info({ dispatch }, message) {
      dispatch('push', { type: 'info', message });
    },

    warn({ dispatch }, message) {
      dispatch('push', { type: 'warn', message });
    },

    stickyError({ dispatch }, message) {
      dispatch('push', { type: 'error', message, sticky: true });
    },

    fourOhFour({ dispatch }, cb) {
      return to => {
        dispatch('error', { message: cb(to) });
        return '/';
      };
    },
  },
});

module.exports = getHelpers(NAMESPACE);
