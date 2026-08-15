describe('YouTube player blacklist control', () => {
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

  test('the first click blacklists and the second click restores auto-resume', async () => {
    require('../src/content');
    window.dispatchEvent(new Event('load'));
    await flushPromises();
    await flushPromises();

    const button = document.querySelector('#YTAutoResumePlayerSwitch');
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Video will auto-resume');

    button.click();
    await flushPromises();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Video will not auto-resume');
    expect(document.querySelector('#YTAutoResumeSwitchIcon').src).toContain('playericon_inactive.svg');
    expect(__getExtensionStorage().videos[0].doNotResume).toBe(true);

    document.dispatchEvent(new CustomEvent('yt-navigate-finish'));
    await flushPromises();
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    await flushPromises();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Video will auto-resume');
    expect(document.querySelector('#YTAutoResumeSwitchIcon').src).toContain('playericon.svg');
    expect(__getExtensionStorage().videos[0].doNotResume).toBe(false);
  });
});
