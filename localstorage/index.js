const TEST = '_TEST_LOCALSTORAGE_AVAILABLE_';
let storage = window.localStorage;

try {
  window.sessionStorage.setItem(TEST, '1');
  window.sessionStorage.removeItem(TEST);
} catch (error) {
  // In-memory storage when localStorage is not available, e.g. iOS private browsing mode.
  let data = {};
  storage = {
    _data: data,
    setItem: (id, val) => {
      data[id] = String(val);
    },
    getItem: id => {
      let output = data[id];
      if (output === undefined) {
        return null;
      }
      return output;
    },
    removeItem: id => delete data[id],
    clear: () => {
      data = {};
    },
  };
}

/**
 * LocalStorage wrapper
 *  - These will be saved in localStorage as the property name you use.
 * @module store
 */
module.exports = {
  /**
   * Remove a key from localStorage
   * @function
   * @param {string} key - The key of a property to remove from localStorage
   * @example
   *   store.remove('myKey');
   */
  remove: (...args) => storage.removeItem(...args),

  /**
   * Clear all of localStorage
   * @function
   * @example
   *   store.clear();
   */
  clear: () => storage.clear(),

  /**
   * Get an item from LocalStorage
   * @function
   * @param {string} key - The key of a property to retrieve from LocalStorage
   * @return {*} - The JSON parsed result retrieved from LocalStorage
   * @example
   *   store.get('myKey');
   */
  get: key => JSON.parse(storage.getItem(key)),

  /**
   * Set an item in LocalStorage
   * @function
   * @param {string} key - The key of a property to set in LocalStorage
   * @param {*} value - The value of an object to set LocalStorage (will be converted to JSON)
   * @example
   *   store.set('myKey', myVal);
   */
  set: (key, value) => storage.setItem(key, JSON.stringify(value)),
};
