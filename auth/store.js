let api = require('../api');
let { store, registerModule } = require('../store');
let router = require('../router');

const CSRF_HEADER = 'x-csrf-token';

let setHeaders = ({ access, csrfToken }) => {
  if (access && csrfToken) {
    api.defaults.headers.common.Authorization = `Bearer ${access}`;
    api.defaults.headers.common[CSRF_HEADER] = csrfToken;
  }
};

const NAMESPACE = '$auth';
const CONFIG = {
  logInEndpoint: 'profile/login',
  logOutEndpoint: 'profile/logout',
  logInRoute: 'auth',
  forbiddenRoute: 'home',
};

module.exports = registerModule(NAMESPACE, {
  persist: true,

  state: {
    profile: null,
    access: null,
    csrfToken: null,
    isLoggedIn: false,
  },

  mutations: {
    setState(state, { data, headers }) {
      let { profile, access } = data;
      let csrfToken = headers[CSRF_HEADER];
      state.profile = profile;
      state.access = access;
      state.csrfToken = csrfToken;
      state.isLoggedIn = true;
      setHeaders(state);
    },

    unsetState(state) {
      state.profile = null;
      state.access = null;
      state.csrfToken = null;
      state.isLoggedIn = false;
    },

    setConfig(state, options = {}) {
      Object.assign(CONFIG, options);
    },
  },

  getters: {
    config() {
      return CONFIG;
    },

    isLoggedIn(state) {
      return state.isLoggedIn;
    },

    access(state) {
      return state.access;
    },

    getProfile(state) {
      return state.profile;
    },

    getRole(state) {
      return state.profile && state.profile.role;
    },

    getFlags(state) {
      let out = {};
      if (!state.organization || !Array.isArray(state.organization.flags)) {
        return out;
      }
      state.organization.flags.forEach(flag => {
        out[flag] = true;
      });
      return out;
    },
  },

  actions: {
    async config({ commit }, config) {
      commit('setConfig', config);
    },

    async login({ getters, commit }, credentials) {
      let res = await api.put(getters.config.logInEndpoint, credentials);
      commit('setState', res);
    },

    async logout({ getters, state, commit }, { error, redirect } = {}) {
      if (state.isLoggedIn) {
        let loginState = {
          access: state.access,
        };
        api.put(getters.config.logOutEndpoint, loginState);
        commit('unsetState');
        delete api.defaults.headers.common.Authorization;
        delete api.defaults.headers.common[CSRF_HEADER];
        store.$persist.clear();
        router.push({
          name: getters.config.logInRoute,
          query: { redirect },
        });
      }
      if (error) {
        console.error(error);
      }
    },

    init({ dispatch, getters, state }) {
      setHeaders(state);
      router.beforeEach((route, redirect, next) => {
        if (getters.isLoggedIn || route.matched.some(({ meta }) => meta.publicAllowed)) {
          next();
        } else {
          let path = getters.config.logInRoute;
          next({
            path,
            query: {
              redirect: route.fullPath,
            },
          });
        }
      });
      api.interceptors.response.use(null, err => {
        let { status = 0 } = err.response || {};
        if (status === 403) {
          let name = getters.config.forbiddenRoute;
          router.push({ name });
        } else if (status === 401) {
          let error = (err.response && err.response.data && err.response.data.error)
            || 'unauthorized';
          dispatch('logout', {
            error,
            redirect: router.currentRoute.fullPath,
          });
        }
        throw err;
      });
    },
  },
});
