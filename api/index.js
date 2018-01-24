let axios = require('axios');
let props = require('../props');

module.exports = axios.create({
  baseURL: props.api,
});
