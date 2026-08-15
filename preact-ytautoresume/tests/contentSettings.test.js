import { installYouTubeWatchPage } from './fixtures/youtubeWatchPage';

describe('live content-script settings', () => {
  beforeEach(() => {
    vi.resetModules();
    __resetExtensionStorage({
      settings: {
        pauseResume: true,
        minWatchTime: 60,
        minVideoLength: 480,
        markPlayedTime: 60,
        deleteAfter: 30
      },
      videoStorageVersion: 1
    });
    installYouTubeWatchPage();
  });

  test('unpauses, applies changes without duplication, and pauses an open tab', async () => {
    const video = document.querySelector('video');
    const addSpy = vi.spyOn(video, 'addEventListener');
    const removeSpy = vi.spyOn(video, 'removeEventListener');

    await import('../src/content');
    window.dispatchEvent(new Event('load'));
    await flushPromises();
    await flushPromises();

    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(0);
    expect(document.querySelector('#YTAutoResumePlayerSwitch')).toBeNull();

    const activeSettings = {
      pauseResume: false,
      minWatchTime: 10,
      minVideoLength: 20,
      markPlayedTime: 30,
      deleteAfter: 30
    };
    __emitExtensionStorageChange({
      settings: { oldValue: __getExtensionStorage().settings, newValue: activeSettings }
    });
    await flushPromises();
    await flushPromises();

    expect(document.querySelector('#YTAutoResumePlayerSwitch')).not.toBeNull();
    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(1);

    const thresholdUpdate = { ...activeSettings, minWatchTime: 45, markPlayedTime: 100 };
    __emitExtensionStorageChange({
      settings: { oldValue: activeSettings, newValue: thresholdUpdate }
    });
    await flushPromises();
    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(1);
    video.currentTime = 550;
    video.dispatchEvent(new Event('timeupdate'));
    await flushPromises();
    expect(__getStoredVideos()[0].complete).toBe(true);

    const pausedSettings = { ...thresholdUpdate, pauseResume: true };
    __emitExtensionStorageChange({
      settings: { oldValue: thresholdUpdate, newValue: pausedSettings }
    });
    await flushPromises();
    await flushPromises();
    expect(removeSpy.mock.calls.some(([type]) => type === 'timeupdate')).toBe(true);

    __emitExtensionStorageChange({
      settings: { oldValue: pausedSettings, newValue: thresholdUpdate }
    });
    await flushPromises();
    await flushPromises();
    expect(addSpy.mock.calls.filter(([type]) => type === 'timeupdate')).toHaveLength(2);
  });

  test('normalizes and repairs malformed settings received while the tab is open', async () => {
    await import('../src/content');
    window.dispatchEvent(new Event('load'));
    await flushPromises();
    await flushPromises();

    const malformedSettings = {
      pauseResume: true,
      minWatchTime: '45',
      minVideoLength: -1,
      markPlayedTime: '30',
      deleteAfter: '0',
      extra: true
    };
    __emitExtensionStorageChange({
      settings: {
        oldValue: __getExtensionStorage().settings,
        newValue: malformedSettings
      }
    });
    await flushPromises();

    const normalizedSettings = {
      pauseResume: true,
      minWatchTime: 45,
      minVideoLength: 480,
      markPlayedTime: 30,
      deleteAfter: 0
    };
    expect(__getExtensionStorage().settings).toEqual(normalizedSettings);
    expect(__getExtensionStorageSetCalls()).toContainEqual({
      settings: normalizedSettings
    });
  });
});
