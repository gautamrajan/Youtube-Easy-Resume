import { installYouTubeWatchPage } from './fixtures/youtubeWatchPage';

describe('YouTube player blacklist control', () => {
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

  test('the first click blacklists and the second click restores auto-resume', async () => {
    await import('../src/content');
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
    expect(__getStoredVideos()[0].doNotResume).toBe(true);

    document.dispatchEvent(new CustomEvent('yt-navigate-finish'));
    await flushPromises();
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    await flushPromises();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Video will auto-resume');
    expect(document.querySelector('#YTAutoResumeSwitchIcon').src).toContain('playericon.svg');
    expect(__getStoredVideos()[0].doNotResume).toBe(false);
  });
});
