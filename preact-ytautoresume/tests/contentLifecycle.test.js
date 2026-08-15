import {
  installYouTubeWatchPage,
  navigateYouTubeWatchPage
} from './fixtures/youtubeWatchPage';

describe('content-script video lifecycle', () => {
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
    installYouTubeWatchPage();
  });

  test('uses one listener, throttles writes, flushes, and removes the old listener', async () => {
    let now = 10000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
    const video = document.querySelector('video');
    const addSpy = vi.spyOn(video, 'addEventListener');
    const removeSpy = vi.spyOn(video, 'removeEventListener');

    await import('../src/content');
    window.dispatchEvent(new Event('load'));
    await flushPromises();
    await flushPromises();

    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(1);

    video.dispatchEvent(new Event('timeupdate'));
    video.dispatchEvent(new Event('timeupdate'));
    await flushPromises();
    expect(__getExtensionStorageSetCalls()).toHaveLength(1);

    now += 4999;
    video.dispatchEvent(new Event('timeupdate'));
    await flushPromises();
    expect(__getExtensionStorageSetCalls()).toHaveLength(1);

    now += 1;
    video.dispatchEvent(new Event('timeupdate'));
    await flushPromises();
    expect(__getExtensionStorageSetCalls()).toHaveLength(2);

    video.dispatchEvent(new Event('pause'));
    await flushPromises();
    expect(__getExtensionStorageSetCalls()).toHaveLength(3);

    navigateYouTubeWatchPage({
      videoId: 'next-video',
      title: 'Next video',
      channel: 'Next channel',
      currentTime: 1
    });
    await flushPromises();
    await flushPromises();
    expect(removeSpy.mock.calls.some(([type]) => type === 'timeupdate')).toBe(true);
    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(2);
    expect(__getStoredVideos()[0].time).toBe(120);

    nowSpy.mockRestore();
  });
});
