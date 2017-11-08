let { isArray, isString } = require('begin-util');

module.exports = {
  props: [
    'src',
    'innerStyle',
  ],
  mounted() {
    this.setStyle(this.innerStyle);
  },
  watch: {
    innerStyle(style) {
      this.setStyle(style);
    },
  },
  methods: {
    setStyle(style) {
      if (!style) {
        return;
      }
      if (isArray(style)) {
        style = Object.assign(...style);
      }
      if (isString(style)) {
        style = style.split(/;(?![^(]*\))/g).reduce((res, item) => {
          if (item) {
            let [key, value] = item.split(/:(.+)/);
            res[key.trim()] = value.trim();
          }
          return res;
        }, {});
      }
      Object.assign(this.$refs.svg.style, style);
    },
  },
};
