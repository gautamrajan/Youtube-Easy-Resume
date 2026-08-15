# Video storage

Video history uses schema version `1`, recorded in `videoStorageVersion`.

Each current video is stored independently under `video:<youtube-video-id>`. This lets two tabs update different videos without reading and rewriting one shared array. A record contains `videolink`, `time`, `duration`, `title`, `channel`, `complete`, `doNotResume`, and `updatedAt`. The `complete` and `doNotResume` fields are booleans; `updatedAt` is a numeric Unix timestamp in milliseconds.

`updatedAt` means “last saved playback activity.” It is refreshed whenever progress or the resume toggle is saved, and automatic expiry is based on this value. A separate creation timestamp is intentionally not stored because it is not used by the extension.

On first use, the old `videos` array is migrated once:

- A valid legacy `timestamp` becomes `updatedAt`.
- A record without a timestamp receives the migration time so upgrading cannot unexpectedly delete history.
- Duplicate video IDs keep the most recently updated record.
- Invalid entries are ignored, the old array is removed, and `videoStorageVersion` is set only after migration succeeds.

Migrated records initially use `legacyVideo:<youtube-video-id>`. A normal playback write stores the canonical `video:` record and removes its legacy counterpart. Reads always prefer a canonical record, so a delayed migration from another tab cannot overwrite progress saved while migration was running.

All video persistence remains in `chrome.storage.local`; IndexedDB is not part of the storage plan.
