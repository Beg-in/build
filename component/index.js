/* eslint-disable security/detect-object-injection */

let { isFunction } = require('begin-util');

let toThis = F => function (...args) {
  return F.apply(this, args);
};

module.exports = T => {
  let out = {
    methods: {},
    watch: {},
    computed: {},
  };

  Object.getOwnPropertyNames(T).forEach(name => {
    if (name === 'length' || name === 'prototype' || name === 'name') {
      return;
    }
    out[name] = toThis(T[name]);
  });

  Object.getOwnPropertyNames(T.prototype).forEach(name => {
    if (name === 'constructor') {
      return;
    }
    let descriptor = Object.getOwnPropertyDescriptor(T.prototype, name);
    if (isFunction(descriptor.value)) {
      out.methods[name] = toThis(descriptor.value);
    }
    if (isFunction(descriptor.get)) {
      out.computed[name] = toThis(descriptor.get);
    }
    if (isFunction(descriptor.set)) {
      out.watch[name] = toThis(descriptor.set);
    }
  });

  return out;
};
