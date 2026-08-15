describe('content-script DOM fallbacks', () => {
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

  test('continues safely when optional page metadata is missing', async () => {
    vi.useFakeTimers();
    try {
      window.history.replaceState({}, '', '/watch?v=missing-metadata');
      document.title = 'Fallback title - YouTube';
      document.body.innerHTML = '<video></video>';
      const video = document.querySelector('video');
      Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
      Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 120 });
      const addSpy = vi.spyOn(video, 'addEventListener');

      await import('../src/content');
      window.dispatchEvent(new Event('load'));
      await Promise.resolve();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(10000);
      await Promise.resolve();

      expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(1);
      expect(document.querySelector('#YTAutoResumePlayerSwitch')).toBeNull();

      video.dispatchEvent(new Event('timeupdate'));
      await Promise.resolve();
      await Promise.resolve();
      expect(__getStoredVideos()[0]).toMatchObject({
        title: 'Fallback title',
        channel: ''
      });
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
