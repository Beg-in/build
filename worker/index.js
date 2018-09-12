let { cdn, worker } = require('../properties');

const ready = new Promise((resolve, reject) => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(cdn + worker).then(resolve).catch(reject);
    });
  } else {
    reject(new Error('service worker unavailable'));
  }
});

module.exports = {
  ready,
};
