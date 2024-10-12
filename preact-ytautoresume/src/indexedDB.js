const DB_NAME = 'YouTubeAutoResume';
const DB_VERSION = 1;
const VIDEOS_STORE = 'videos';
const SETTINGS_STORE = 'settings';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
        db.createObjectStore(VIDEOS_STORE, { keyPath: 'videolink' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
  });
}

// CRUD operations for videos
async function getVideos(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, 'readonly');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function setVideo(db, video) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, 'readwrite');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.put(video);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  }).then(() => console.log("set video"));
}

async function deleteVideo(db, videolink) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VIDEOS_STORE, 'readwrite');
    const store = transaction.objectStore(VIDEOS_STORE);
    const request = store.delete(videolink);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// CRUD operations for settings
async function getSettings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get('settings');

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ? request.result.value : null);
  });
}

async function setSettings(db, settings) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.put({ key: 'settings', value: settings });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Migration function
async function migrateData() {
  const db = await openDB();
  
  return new Promise((resolve) => {
    chrome.storage.local.get(null, async (data) => {
      if (data.videos) {
        for (const video of data.videos) {
          await setVideo(db, video);
        }
      }
      
      if (data.settings) {
        await setSettings(db, data.settings);
      }
      
      // Clear Chrome local storage after successful migration
      chrome.storage.local.clear(() => {
        console.log('Migration complete');
        resolve();
      });
    });
  });
}

export { openDB, getVideos, setVideo, deleteVideo, getSettings, setSettings, migrateData };