import {
  installYouTubeWatchPage,
  navigateYouTubeWatchPage
} from './fixtures/youtubeWatchPage';

describe('content-script navigation flush', () => {
  beforeEach(() => {
    vi.resetModules();
    __resetExtensionStorage({
      settings: {
        pauseResume: false,
        minWatchTime: 60,
        minVideoLength: 480,
        markPlayedTime: 60,
        deleteAfter: 30
      },
      videoStorageVersion: 1
    });
  });

  test('detaches the old monitor before awaiting a delayed storage write', async () => {
    const page = installYouTubeWatchPage({ videoId: 'video-A' });
    const addSpy = vi.spyOn(page.video, 'addEventListener');
    const removeSpy = vi.spyOn(page.video, 'removeEventListener');

    await import('../src/content');
    window.dispatchEvent(new Event('load'));
    await flushPromises();
    await flushPromises();

    const originalSet = chrome.storage.local.set;
    const delayedWrites = [];
    let releaseWrite;
    chrome.storage.local.set = values => {
      delayedWrites.push(values);
      return new Promise((resolve, reject) => {
        releaseWrite = () => originalSet(values).then(resolve, reject);
      });
    };

    navigateYouTubeWatchPage({
      videoId: 'video-B',
      title: 'Video B',
      channel: 'Channel B',
      currentTime: 5
    });
    page.video.dispatchEvent(new Event('timeupdate'));
    await Promise.resolve();
    await Promise.resolve();

    expect(removeSpy.mock.calls.some(([type]) => type === 'timeupdate')).toBe(true);
    expect(delayedWrites).toHaveLength(1);
    expect(delayedWrites[0]['video:video-A']).toMatchObject({
      videolink: 'https://www.youtube.com/watch?v=video-A',
      time: 120
    });

    chrome.storage.local.set = originalSet;
    releaseWrite();
    await flushPromises();
    await flushPromises();

    expect(__getExtensionStorage()['video:video-A'].time).toBe(120);
    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(2);
  });
});
