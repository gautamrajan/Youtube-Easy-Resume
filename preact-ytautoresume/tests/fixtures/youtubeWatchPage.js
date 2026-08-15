export function installYouTubeWatchPage({
  videoId = 'test-video',
  title = 'Test video',
  channel = 'Test channel',
  duration = 600,
  currentTime = 120
} = {}) {
  window.history.replaceState({}, '', `/watch?v=${videoId}`);
  document.title = `${title} - YouTube`;
  document.body.innerHTML = `
    <div class="ytp-chrome-controls">
      <div class="ytp-right-controls"></div>
    </div>
    <ytd-watch-metadata>
      <h1><yt-formatted-string>${title}</yt-formatted-string></h1>
      <div id="owner"><ytd-channel-name><a>${channel}</a></ytd-channel-name></div>
    </ytd-watch-metadata>
    <video class="html5-main-video"></video>
  `;

  const video = document.querySelector('video');
  Object.defineProperty(video, 'duration', { configurable: true, value: duration });
  Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: currentTime });
  return {
    video,
    title: document.querySelector('yt-formatted-string'),
    channel: document.querySelector('ytd-channel-name a'),
    controls: document.querySelector('.ytp-right-controls')
  };
}

export function navigateYouTubeWatchPage({
  videoId,
  title,
  channel,
  currentTime = 0
}) {
  window.history.pushState({}, '', `/watch?v=${videoId}`);
  const page = {
    video: document.querySelector('video'),
    title: document.querySelector('yt-formatted-string'),
    channel: document.querySelector('ytd-channel-name a')
  };
  page.title.textContent = title;
  page.channel.textContent = channel;
  page.video.currentTime = currentTime;
  document.title = `${title} - YouTube`;
  document.dispatchEvent(new CustomEvent('yt-navigate-finish'));
  return page;
}
