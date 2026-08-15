import generateList from '../src/components/list';
import { getVideoKey, SCHEMA_VERSION, SCHEMA_VERSION_KEY } from '../src/videoStorage';

const NOW = Date.now();
const settings = {
  minWatchTime: 60,
  minVideoLength: 480,
  deleteAfter: 30
};

function makeVideo(id, values = {}) {
  return {
    videolink: `https://www.youtube.com/watch?v=${id}`,
    time: 120,
    duration: 600,
    title: `Video ${id}`,
    channel: 'Test channel',
    complete: false,
    doNotResume: false,
    updatedAt: NOW,
    ...values
  };
}

function installVideos(videos) {
  __resetExtensionStorage({
    [SCHEMA_VERSION_KEY]: SCHEMA_VERSION,
    ...Object.fromEntries(videos.map(video => [getVideoKey(video.videolink), video]))
  });
}

function listProps(values = {}) {
  return {
    edit: false,
    selectedVideos: [],
    settings,
    searchQuery: '',
    eClickHandler: () => {},
    ...values
  };
}

describe('popup video list', () => {
  test('returns an empty list for a fresh install', async () => {
    installVideos([]);

    expect(await generateList(listProps())).toEqual([]);
  });

  test('filters hidden videos and searches titles and channels case-insensitively', async () => {
    const titleMatch = makeVideo('title', { title: 'Needle tutorial' });
    const channelMatch = makeVideo('channel', { channel: 'Needle studio' });
    installVideos([
      titleMatch,
      channelMatch,
      makeVideo('blacklisted', { title: 'Needle hidden', doNotResume: true }),
      makeVideo('complete', { title: 'Needle complete', complete: true }),
      makeVideo('too-short-watch', { title: 'Needle brief watch', time: 59 }),
      makeVideo('too-short-video', { title: 'Needle short video', duration: 479 })
    ]);

    const elements = await generateList(listProps({ searchQuery: 'nEeDlE' }));

    expect(elements.map(element => element.props.video)).toEqual([
      channelMatch,
      titleMatch
    ]);
  });

  test('reserves scrollbar space when four videos are displayed', async () => {
    installVideos(['one', 'two', 'three', 'four'].map(makeVideo));

    const elements = await generateList(listProps());

    expect(elements).toHaveLength(4);
    expect(elements.every(element => element.props.marginRight === 7)).toBe(true);
    expect(elements.every(element => element.props.maxBarWidth === 211)).toBe(true);
  });
});
