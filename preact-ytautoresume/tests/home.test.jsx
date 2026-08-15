import Home from '../src/components/home';

function makeSynchronous(component) {
  component.setState = (update, callback) => {
    const values = typeof update === 'function' ? update(component.state) : update;
    component.state = { ...component.state, ...values };
    if (callback) {
      callback();
    }
  };
  component.setList = vi.fn();
  return component;
}

describe('popup initialization', () => {
  beforeEach(() => {
    __resetExtensionStorage({});
  });

  test('initializes missing storage before rendering a fresh install', async () => {
    const home = makeSynchronous(new Home());

    await home.componentDidMount();

    expect(__getExtensionStorage().videos).toBeUndefined();
    expect(__getExtensionStorage().videoStorageVersion).toBe(1);
    expect(__getExtensionStorage().settings).toEqual({
      pauseResume: false,
      minWatchTime: 60,
      minVideoLength: 480,
      markPlayedTime: 60,
      deleteAfter: 30
    });
    expect(home.state.dataReady).toBe(true);
    expect(home.state.storageError).toBe(false);
    expect(home.setList).toHaveBeenCalledTimes(1);
  });

  test('migrates missing settings before cleaning existing videos', async () => {
    __resetExtensionStorage({
      settings: {
        pauseResume: true,
        minWatchTime: 10,
        minVideoLength: 20,
        markPlayedTime: 30
      },
      videos: []
    });
    const home = makeSynchronous(new Home());

    await home.componentDidMount();

    expect(__getExtensionStorage().settings.deleteAfter).toBe(30);
    expect(home.state.settings.deleteAfter).toBe(30);
    expect(home.state.paused).toBe(true);
  });

  test('repairs malformed top-level storage values', async () => {
    __resetExtensionStorage({ settings: [], videos: [null] });
    const home = makeSynchronous(new Home());

    await home.componentDidMount();

    expect(__getExtensionStorage().settings).toEqual({
      pauseResume: false,
      minWatchTime: 60,
      minVideoLength: 480,
      markPlayedTime: 60,
      deleteAfter: 30
    });
    expect(__getExtensionStorage().videos).toBeUndefined();
    expect(__getExtensionStorage().videoStorageVersion).toBe(1);
    expect(home.state.storageError).toBe(false);
  });

  test('renders a recoverable error state when storage fails', async () => {
    __setExtensionStorageError('Storage unavailable');
    const home = makeSynchronous(new Home());
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await home.componentDidMount();

    expect(home.state.dataReady).toBe(true);
    expect(home.state.storageError).toBe(true);
    expect(home.setList).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('treats supported URL variants as the same selected video', () => {
    const home = makeSynchronous(new Home());
    const selectedVideo = {
      videolink: 'https://www.youtube.com/watch?list=queue&v=shared-id&index=2'
    };
    home.state = {
      ...home.state,
      edit: true,
      selectedVideos: [selectedVideo]
    };

    home.editVideoClick({ videolink: 'https://youtu.be/shared-id' }, 0, { shiftKey: false });

    expect(home.state.selectedVideos).toEqual([]);
  });
});
