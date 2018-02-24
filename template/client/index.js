let build = require('begin-build');

// TODO: initialize your Vuex store directory or remove
// let { context } = require('begin-build/store');
//
// let store = context(module, require.context('./store', true, /\.js$/));

module.exports = build({
  components: { app: require('./app/vue.pug') },
  // TODO: configure your Vue router here or remove
  // router: {
  //   routes: [
  //     {
  //       name: 'home',
  //       path: '/',
  //       component: require('./home/vue.pug'),
  //     },
  //     {
  //       name: '404',
  //       path: '/404',
  //       component: require('./404/vue.pug'),
  //     },
  //     {
  //       path: '*',
  //       redirect: '/',
  //     },
  //   ],
  // },
});
