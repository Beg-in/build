let { password, email } = require('begin-util/validate');
let api = require('../api');
let { mapActions: mapAlertsActions } = require('../alerts');
let { mapActions: mapAuthActions, mapMutations: mapAuthMutations } = require('../store/auth');

const RESET = 'reset';
const FORGOT = 'forgot';
const CREATE = 'create';
const LOGIN = 'sign-in';

module.exports = {
  data() {
    return {
      email: null,
      password: null,
      firstName: null,
      lastName: null,
      remember: false,
    };
  },

  computed: {
    emailCheck() {
      email.required.test(this.email);
    },

    passwordCheck() {
      password.required.test(this.password);
    },

    viewType() {
      if (this.$route.query.reset) {
        return RESET;
      }
      if (this.$route.query.forgot) {
        return FORGOT;
      }
      if (this.$route.query.create) {
        return CREATE;
      }
      return LOGIN;
    },

    showPasswordField() {
      return this.viewType === RESET
        || this.viewType === CREATE
        || this.viewType === LOGIN;
    },

    showEmailField() {
      return this.viewType === FORGOT
        || this.viewType === CREATE
        || this.viewType === LOGIN;
    },

    showCreateFields() {
      return this.viewType === CREATE;
    },

    showRememberField() {
      return this.viewType === CREATE
        || this.viewType === LOGIN;
    },

    showLoginFields() {
      return this.viewType === LOGIN;
    },

    disabled() {
      let enabled = false;
      switch (this.viewType) {
        case FORGOT:
          enabled = this.email;
          break;
        case RESET:
          enabled = this.password;
          break;
        case CREATE:
          enabled = this.enable && this.email && this.password;
          break;
        case LOGIN:
        default:
          enabled = this.email && this.password;
          break;
      }
      return !enabled;
    },

    details() {
      return {
        firstName: this.firstName,
        lastName: this.lastName,
      };
    },

    enable() {
      return this.firstName && this.lastName;
    },
  },

  methods: Object.assign({
    getRedirectQuery() {
      let query = {};
      if (this.$route.query.redirect) {
        query.redirect = this.$route.query.redirect;
      }
      return query;
    },

    showCreate() {
      let query = this.getRedirectQuery();
      query.create = true;
      this.$router.push({
        query,
      });
    },

    showForgot() {
      let query = this.getRedirectQuery();
      query.forgot = true;
      this.$router.push({
        query,
      });
    },

    showLogin() {
      let query = this.getRedirectQuery();
      this.$router.push({
        query,
      });
    },

    async forgot() {
      if (!this.emailCheck()) {
        this.error('Invalid email address');
        return;
      }
      try {
        await api.get(`profile/reset/${this.email}`);
        this.$router.push({
          name: this.$route.name,
          query: null,
        });
        this.success('Password reset email sent');
      } catch (e) {
        this.error(e);
      }
    },

    async reset() {
      if (!this.$route.query.reset) {
        this.error('Missing reset token');
        return;
      }
      if (!this.passwordCheck()) {
        this.error('Invalid new password');
        return;
      }
      try {
        await api.put('profile/reset/', {
          key: this.password,
          verify: this.$route.query.reset,
        });
        this.$router.push({
          query: {},
        });
        this.success('Reset password complete, please log in');
      } catch (e) {
        this.error(e);
      }
    },

    async redirect() {
      let { redirect = '/' } = this.$route.query;
      this.$router.push(redirect);
    },

    async create() {
      if (!this.emailCheck()) {
        this.error('Invalid email address');
        return;
      }
      if (!this.passwordCheck()) {
        this.error('Invalid password');
        return;
      }
      let profile = Object.assign({
        key: this.password,
        email: this.email,
        remember: this.remember,
      }, this.details);
      try {
        let res = await api.post('profile', profile);
        this.setState(res);
        this.success('Created profile, check your email for verification');
        this.redirect();
      } catch (e) {
        this.error(e);
      }
    },

    async signIn() {
      if (!this.emailCheck()) {
        this.error('Invalid email address');
        return;
      }
      try {
        await this.login({
          key: this.password,
          email: this.email,
          remember: this.remember,
        });
        this.redirect();
      } catch (e) {
        this.error(e);
      }
    },

    submit() {
      switch (this.viewType) {
        case FORGOT:
          return this.forgot();
        case RESET:
          return this.reset();
        case CREATE:
          return this.create();
        case LOGIN:
        default:
          return this.signIn();
      }
    },
  }, mapAlertsActions(['error', 'success']), mapAuthActions(['login']), mapAuthMutations(['setState'])),
};
