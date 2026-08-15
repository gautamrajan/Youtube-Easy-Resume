import {
  getYouTubeVideoId,
  isResumableYouTubeUrl,
  parseYouTubeUrl,
  queryFirst,
  waitForElement,
  waitForVideoMetadata,
  YOUTUBE_SELECTORS
} from '../src/youtubePage';

describe('YouTube URL parsing', () => {
  test('finds watch IDs regardless of query ordering or extra parameters', () => {
    expect(getYouTubeVideoId('https://www.youtube.com/watch?list=queue&v=abc_123-def&index=4'))
      .toBe('abc_123-def');
    expect(isResumableYouTubeUrl('https://youtube.com/watch?feature=share&v=abc123'))
      .toBe(true);
  });

  test.each([
    'https://www.youtube.com/watch?v=abc123&t=90',
    'https://www.youtube.com/watch?t=1m30s&v=abc123',
    'https://www.youtube.com/watch?v=abc123&start=90',
    'https://www.youtube.com/watch?v=abc123&time_continue=90',
    'https://www.youtube.com/watch?v=abc123#t=90'
  ])('does not override an explicit timestamp in %s', link => {
    expect(parseYouTubeUrl(link)).toMatchObject({
      videoId: 'abc123',
      kind: 'watch',
      explicitTimestamp: true,
      resumable: false
    });
  });

  test.each([
    ['https://youtu.be/abc123?t=10', 'short-link'],
    ['https://www.youtube.com/embed/abc123', 'embed'],
    ['https://www.youtube-nocookie.com/embed/abc123', 'embed'],
    ['https://www.youtube.com/shorts/abc123', 'shorts']
  ])('recognizes %s for identity without activating resume', (link, kind) => {
    expect(parseYouTubeUrl(link)).toMatchObject({ videoId: 'abc123', kind, resumable: false });
  });

  test.each([
    null,
    '',
    'not a url',
    'ftp://www.youtube.com/watch?v=abc123',
    'https://example.com/watch?v=abc123',
    'https://www.youtube.com/watch?list=queue',
    'https://youtu.be/%E0%A4%A'
  ])('rejects malformed or unsupported input %#', link => {
    expect(parseYouTubeUrl(link)).toBeNull();
  });
});

describe('YouTube DOM helpers', () => {
  test('uses maintained selector fallbacks', () => {
    document.body.innerHTML = `
      <div class="ytp-right-controls"></div>
      <h1 class="title style-scope ytd-video-primary-info-renderer">Legacy title</h1>
      <ytd-video-owner-renderer><ytd-channel-name><a>Legacy channel</a></ytd-channel-name></ytd-video-owner-renderer>
      <video></video>
    `;

    expect(queryFirst(YOUTUBE_SELECTORS.title).textContent).toBe('Legacy title');
    expect(queryFirst(YOUTUBE_SELECTORS.channel).textContent).toBe('Legacy channel');
    expect(queryFirst(YOUTUBE_SELECTORS.video).tagName).toBe('VIDEO');
    expect(queryFirst(YOUTUBE_SELECTORS.playerControls).className).toBe('ytp-right-controls');
  });

  test('resolves when a selector appears and rejects within the timeout', async () => {
    document.body.innerHTML = '<main></main>';
    const elementPromise = waitForElement(['.late-node'], { timeoutMs: 100 });
    const element = document.createElement('div');
    element.className = 'late-node';
    document.querySelector('main').appendChild(element);
    await expect(elementPromise).resolves.toBe(element);

    await expect(waitForElement(['.missing-node'], { timeoutMs: 5 }))
      .rejects.toMatchObject({ name: 'TimeoutError' });
  });

  test('cancels selector and metadata waits', async () => {
    const elementController = new AbortController();
    const elementPromise = waitForElement(['.missing-node'], {
      signal: elementController.signal,
      timeoutMs: 100
    });
    elementController.abort();
    await expect(elementPromise).rejects.toMatchObject({ name: 'AbortError' });

    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: Number.NaN });
    const metadataController = new AbortController();
    const metadataPromise = waitForVideoMetadata(video, {
      signal: metadataController.signal,
      timeoutMs: 100
    });
    metadataController.abort();
    await expect(metadataPromise).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('waits for usable video metadata', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: Number.NaN });
    const metadataPromise = waitForVideoMetadata(video, { timeoutMs: 100 });
    Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
    video.dispatchEvent(new Event('loadedmetadata'));
    await expect(metadataPromise).resolves.toBe(video);
  });

  test('bounds the video metadata wait', async () => {
    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: Number.NaN });
    await expect(waitForVideoMetadata(video, { timeoutMs: 5 }))
      .rejects.toMatchObject({ name: 'TimeoutError' });
  });
});
