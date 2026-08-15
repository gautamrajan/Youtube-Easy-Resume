import { installYouTubeWatchPage } from './fixtures/youtubeWatchPage';

describe('content-script SPA cancellation', () => {
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

  test('cancels stale metadata work when navigation changes videos', async () => {
    const stalePage = installYouTubeWatchPage({
      videoId: 'loading-video',
      duration: Number.NaN,
      currentTime: 0
    });
    const staleAddSpy = vi.spyOn(stalePage.video, 'addEventListener');
    const staleRemoveSpy = vi.spyOn(stalePage.video, 'removeEventListener');

    await import('../src/content');
    window.dispatchEvent(new Event('load'));
    await flushPromises();

    const currentPage = installYouTubeWatchPage({
      videoId: 'ready-video',
      title: 'Ready video',
      channel: 'Ready channel'
    });
    const currentAddSpy = vi.spyOn(currentPage.video, 'addEventListener');
    document.dispatchEvent(new CustomEvent('yt-navigate-finish'));
    await flushPromises();
    await flushPromises();

    expect(staleAddSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(0);
    expect(staleRemoveSpy.mock.calls.some(([type]) => type === 'loadedmetadata')).toBe(true);
    expect(currentAddSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(1);
    expect(document.querySelectorAll('#YTAutoResumePlayerSwitch')).toHaveLength(1);
  });
});
