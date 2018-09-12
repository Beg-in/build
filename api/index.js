let axios = require('axios');
let { api } = require('../properties');

module.exports = axios.create({
  baseURL: api,
});
