import {
  createVideoStorage,
  getVideoKey,
  getLegacyVideoKey,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY
} from '../src/videoStorage';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const NOW = 2_000_000_000_000;

function createStore(now = NOW) {
  return createVideoStorage(
    chrome.storage.local,
    () => now
  );
}

function makeVideo(id, values = {}) {
  return {
    videolink: `https://www.youtube.com/watch?v=${id}`,
    time: 120,
    duration: 600,
    title: `Video ${id}`,
    channel: 'Test channel',
    complete: false,
    doNotResume: false,
    ...values
  };
}

describe('versioned video storage', () => {
  test('migrates a realistic legacy array once without losing valid history', async () => {
    const olderDuplicate = makeVideo('one', { title: 'Old title', timestamp: NOW - 1000 });
    const newerDuplicate = makeVideo('one', { title: 'New title', timestamp: NOW - 500 });
    const missingTimestamp = makeVideo('two');
    __resetExtensionStorage({
      settings: { deleteAfter: 30 },
      videos: [olderDuplicate, null, missingTimestamp, newerDuplicate]
    });
    const store = createStore();

    await store.initialize();

    const storage = __getExtensionStorage();
    expect(storage.videos).toBeUndefined();
    expect(storage[SCHEMA_VERSION_KEY]).toBe(SCHEMA_VERSION);
    expect(storage[getLegacyVideoKey(olderDuplicate.videolink)]).toMatchObject({
      title: 'New title',
      updatedAt: NOW - 500
    });
    expect(storage[getLegacyVideoKey(missingTimestamp.videolink)]).toMatchObject({
      title: 'Video two',
      updatedAt: NOW
    });
    expect(storage[getLegacyVideoKey(olderDuplicate.videolink)].timestamp).toBeUndefined();

    const setCallCount = __getExtensionStorageSetCalls().length;
    const removeCallCount = __getExtensionStorageRemoveCalls().length;
    await store.initialize();
    expect(__getExtensionStorageSetCalls()).toHaveLength(setCallCount);
    expect(__getExtensionStorageRemoveCalls()).toHaveLength(removeCallCount);
  });

  test('saves different videos independently with validated update times', async () => {
    __resetExtensionStorage({ [SCHEMA_VERSION_KEY]: SCHEMA_VERSION });
    const firstTab = createStore();
    const secondTab = createStore();
    const firstVideo = makeVideo('first', { updatedAt: 'invalid' });
    const secondVideo = makeVideo('second');

    await Promise.all([
      firstTab.saveVideo(firstVideo),
      secondTab.saveVideo(secondVideo)
    ]);

    expect(__getStoredVideos()).toHaveLength(2);
    expect(__getExtensionStorage()[getVideoKey(firstVideo.videolink)].updatedAt).toBe(NOW);
    expect(__getExtensionStorage()[getVideoKey(secondVideo.videolink)].updatedAt).toBe(NOW);
    expect(__getExtensionStorage().videos).toBeUndefined();
  });

  test('a delayed migration cannot overwrite canonical progress', async () => {
    const link = 'https://www.youtube.com/watch?v=race';
    const staleMigration = makeVideo('race', { time: 10, updatedAt: NOW - 1000 });
    const savedProgress = makeVideo('race', { time: 500 });
    __resetExtensionStorage({ [SCHEMA_VERSION_KEY]: SCHEMA_VERSION });
    const store = createStore();

    await store.saveVideo(savedProgress);
    await new Promise(resolve => {
      chrome.storage.local.set({ [getLegacyVideoKey(link)]: staleMigration }, resolve);
    });

    expect((await store.getVideo(link)).time).toBe(500);
    expect(await store.getAllVideos()).toEqual([
      expect.objectContaining({ time: 500, updatedAt: NOW })
    ]);
  });

  test('expires records by last saved activity', async () => {
    const expired = makeVideo('expired', { updatedAt: NOW - 31 * DAY_IN_MS });
    const active = makeVideo('active', { updatedAt: NOW - 30 * DAY_IN_MS });
    __resetExtensionStorage({
      [SCHEMA_VERSION_KEY]: SCHEMA_VERSION,
      [getVideoKey(expired.videolink)]: expired,
      [getVideoKey(active.videolink)]: active
    });
    const store = createStore();

    const remaining = await store.deleteExpired('30');

    expect(remaining).toEqual([active]);
    expect(await store.getVideo(expired.videolink)).toBeNull();
    expect(await store.getVideo(active.videolink)).toEqual(active);
  });
});
