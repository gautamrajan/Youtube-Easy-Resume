describe('content-script video lifecycle', () => {
  beforeEach(() => {
    jest.resetModules();
    __resetExtensionStorage({
      settings: {
        pauseResume: false,
        minWatchTime: 60,
        minVideoLength: 480,
        markPlayedTime: 60,
        deleteAfter: 30
      },
      videos: []
    });
    document.body.innerHTML = `
      <div class="ytp-right-controls"></div>
      <h1 class="title style-scope ytd-video-primary-info-renderer">Test video</h1>
      <ytd-video-owner-renderer><ytd-channel-name><a>Test channel</a></ytd-channel-name></ytd-video-owner-renderer>
      <video></video>
    `;
    const video = document.querySelector('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 120 });
  });

  test('uses one listener, throttles writes, flushes, and removes the old listener', async () => {
    let now = 10000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
    const video = document.querySelector('video');
    const addSpy = jest.spyOn(video, 'addEventListener');
    const removeSpy = jest.spyOn(video, 'removeEventListener');

    require('../src/content');
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

    video.currentTime = 1;
    document.dispatchEvent(new CustomEvent('yt-navigate-finish'));
    await flushPromises();
    await flushPromises();
    expect(removeSpy.mock.calls.some(([type]) => type === 'timeupdate')).toBe(true);
    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(2);
    expect(__getExtensionStorage().videos[0].time).toBe(120);

    nowSpy.mockRestore();
  });
});
