const initialStorage = {};
let storage = { ...initialStorage };
let storageError = null;
let storageSetCalls = [];
let storageChangeListeners = [];

function selectStorage(keys) {
  if (keys == null) {
    return { ...storage };
  }
  if (typeof keys === 'string') {
    return { [keys]: storage[keys] };
  }
  if (Array.isArray(keys)) {
    return keys.reduce((result, key) => ({ ...result, [key]: storage[key] }), {});
  }
  return Object.keys(keys).reduce((result, key) => ({
    ...result,
    [key]: storage[key] === undefined ? keys[key] : storage[key]
  }), {});
}

global.__resetExtensionStorage = values => {
  storage = { ...values };
  storageError = null;
  storageSetCalls = [];
  storageChangeListeners = [];
};

global.__getExtensionStorage = () => storage;
global.__getExtensionStorageSetCalls = () => [...storageSetCalls];
global.__setExtensionStorageError = message => {
  storageError = message ? { message } : null;
};
global.__emitExtensionStorageChange = (changes, areaName = 'local') => {
  Object.entries(changes).forEach(([key, change]) => {
    if (change && Object.prototype.hasOwnProperty.call(change, 'newValue')) {
      storage[key] = change.newValue;
    }
  });
  storageChangeListeners.forEach(listener => listener(changes, areaName));
};

global.chrome = {
  runtime: {
    getURL: path => `chrome-extension://test/${path}`,
    get lastError() {
      return storageError;
    }
  },
  storage: {
    onChanged: {
      addListener: listener => storageChangeListeners.push(listener)
    },
    local: {
      get: (keys, callback) => callback(selectStorage(keys)),
      set: (values, callback = () => {}) => {
        storageSetCalls.push(values);
        if (!storageError) {
          storage = { ...storage, ...values };
        }
        callback();
      },
      getBytesInUse: (keys, callback) => {
        const values = selectStorage(keys);
        const bytes = Object.values(values).every(value => value === undefined)
          ? 0
          : JSON.stringify(values).length;
        callback(bytes);
      }
    }
  }
};
