# Manual live-site smoke test

Run `npm run build`, then load `dist/chrome` as an unpacked Chrome extension or
run `npm run dev:firefox` for Firefox. Repeat the checklist in both browsers
before a store release.

## Supported URL behavior

| URL form | Stable video identity | Resume workflow |
| --- | --- | --- |
| `youtube.com/watch?v=...` | Yes | Yes, unless an explicit timestamp is present |
| `youtu.be/...` | Yes | The short link redirects; the resulting watch URL follows the watch rules |
| `youtube.com/embed/...` | Yes | No |
| `youtube.com/shorts/...` | Yes | No |

The narrower workflow boundary preserves the extension's existing focus on
standard watch pages while allowing all four forms to map to the same stored
video.

1. Open a normal `youtube.com/watch?v=...` video longer than the configured
   minimum. Confirm one Easy Resume button appears and no errors appear in the
   extension console.
2. Watch long enough to pass the configured minimum, leave the page, and return.
   Confirm playback resumes near the saved position.
3. Open a watch URL with reordered and extra query parameters, such as
   `watch?list=...&v=...&index=2`. Confirm it resumes the same saved video.
4. Open the same video with `t=`, `start=`, or `time_continue=`. Confirm the
   explicit timestamp wins and Easy Resume does not seek or add its player
   button.
5. Navigate between two watch videos using YouTube links without reloading the
   tab. Confirm progress for the first video is saved, the second video gets one
   button, and only the second video continues updating.
6. Visit a Shorts URL and an `/embed/` URL. Confirm neither runs the resume
   workflow. Open a `youtu.be` link and confirm its redirected watch URL follows
   the normal watch or explicit-timestamp rule.
7. In DevTools, temporarily remove the title, channel, or player-controls node,
   then navigate to another video. Confirm the content script does not throw or
   hang and works again on the next normal watch page.

The maintained DOM fixture used for initial-load and SPA-navigation regression
coverage is `preact-ytautoresume/tests/fixtures/youtubeWatchPage.js`.
