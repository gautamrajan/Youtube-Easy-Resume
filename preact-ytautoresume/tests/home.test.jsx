import Home from '../src/components/home';
import { getVideoKey, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from '../src/videoStorage';

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

  test('deletes only selected videos and exits edit mode', async () => {
    const selectedVideo = {
      videolink: 'https://www.youtube.com/watch?v=selected',
      updatedAt: Date.now()
    };
    const remainingVideo = {
      videolink: 'https://www.youtube.com/watch?v=remaining',
      updatedAt: Date.now()
    };
    __resetExtensionStorage({
      [SCHEMA_VERSION_KEY]: SCHEMA_VERSION,
      [getVideoKey(selectedVideo.videolink)]: selectedVideo,
      [getVideoKey(remainingVideo.videolink)]: remainingVideo
    });
    const home = makeSynchronous(new Home());
    home.state = {
      ...home.state,
      edit: true,
      selectedVideos: [selectedVideo]
    };
    home.bar = { MDComponent: { show: vi.fn() } };

    await home.deleteSelected();

    expect(__getExtensionStorage()[getVideoKey(selectedVideo.videolink)]).toBeUndefined();
    expect(__getExtensionStorage()[getVideoKey(remainingVideo.videolink)]).toEqual(remainingVideo);
    expect(home.state.edit).toBe(false);
    expect(home.state.selectedVideos).toEqual([]);
    expect(home.bar.MDComponent.show).toHaveBeenCalledWith({ message: '1 video removed' });
  });
});
