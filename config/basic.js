'use strict';

let base = require('./base');
let index = require('./index');
let scripts = require('./scripts');
let styles = require('./styles');
let markup = require('./markup');
let images = require('./images');
let fonts = require('./fonts');

module.exports = {
  base,
  index,
  scripts,
  styles,
  markup, // depends on base
  images,
  fonts,
  // pwa, // depends on index
  // vue, // overrides styles depends on markup
};
