# Settings storage shape

Settings are stored in `storage.local` under the `settings` key. Every context
normalizes legacy values to this shape before using or persisting them:

```js
{
  pauseResume: false,      // boolean
  minWatchTime: 60,        // number, seconds, 0 through 86,400
  minVideoLength: 480,     // number, seconds, 0 through 86,400
  markPlayedTime: 60,      // number, seconds, 0 through 86,400
  deleteAfter: 30          // integer, days, 0 through 3,650
}
```

Finite numeric strings from older versions are migrated to numbers. Missing,
non-finite, out-of-range, and otherwise invalid stored values fall back to the
default for that field. The settings form rejects invalid drafts rather than
persisting them.
