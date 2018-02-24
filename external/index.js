module.exports = {
  props: ['href'],

  render(createElement) {
    return createElement('a', {
      attrs: {
        href: this.href,
        target: '_blank',
        rel: 'noopener',
      },
    }, this.$slots.default);
  },
};
