# Bug & stability audit

Findings from a read-through of `preact-ytautoresume/src/` on 2026-04-21. No fixes applied — this is a report. Ordered by user-facing impact.

---

## Critical (user-facing breakage)

### C1. Blacklist toggle on the YouTube player is broken
**File:** `src/content.js:71, 90–97`

`createPlayerButton` creates a `<div>`, but `onPlayerButtonClick` reads `document.querySelector("#YTAutoResumePlayerSwitch").checked`. Divs have no `.checked` property, so it's always `undefined`. Net effect:
- First click: `blacklist = undefined` → icon doesn't flip, storage writes `doNotResume: undefined` (falsy — NOT blacklisted).
- `togglePlayerButtonState` then assigns `switchButton.checked = true` as an ad-hoc property on the div.
- Second click: `.checked` now returns `true` from that ad-hoc property, so THIS click starts behaving.

Result: the first click of the blacklist button is dead; subsequent clicks invert state inconsistently. Users report "the button doesn't do anything" — this is why.

### C2. Shift-click multiple-select never actually selects the range
**File:** `src/components/home.jsx:275–289`

`handleShiftClick` mutates the `selectedVideos` array inside a `chrome.storage.local.get("videos", ...)` async callback. But `editVideoClick` immediately calls `setState({ selectedVideos: newSelectedVideos, ... })` on line 264 — *before* the async callback fires. The setState captures the pre-callback value; the mutations never reach React state.

Commit `e3b9533` ("Implemented shift+click multiple video selection") introduced this. Feature currently broken.

### C3. Video title selector is likely already stale
**File:** `src/content.js:111, 187, 294, 297`

Uses `"h1.title.style-scope.ytd-video-primary-info-renderer"` — YouTube's Polymer web-component class names. YouTube periodically refactors these; today's current DOM uses `h1.ytd-watch-metadata yt-formatted-string` (and variations). If the selector has already drifted, title-grabbing silently fails, which cascades into missing titles in the popup list and NPEs at lines 111, 294, 297 (no null check after `querySelector`).

Needs live verification against current youtube.com before any other fix.

### C4. Storage write amplification + race on every `timeupdate`
**File:** `src/content.js:292–317, 215–223`

`video.ontimeupdate` fires ~4×/second. Each tick calls `setTime()` which does `chrome.storage.local.get("videos") → filter → push → set("videos")`. That's:
- O(n) read + O(n) write per tick for n videos stored (users with 100+ saved videos eat serious overhead)
- Classic read-modify-write race — two YouTube tabs open means writes will clobber each other
- Chrome's QUOTA_BYTES is 5MB for `storage.local`; under load this can hit `MAX_WRITE_OPERATIONS_PER_MINUTE` (120) and silently fail

Throttle to every 3–5 seconds at minimum, or migrate to IndexedDB.

---

## High (subtle bugs that bite specific users)

### H1. `initSettingsDB` resolves prematurely in the migration path
**File:** `src/components/home.jsx:328–371`

```js
else {
    chrome.storage.local.get("settings", (data) => {
        if (!current_settings.hasOwnProperty('deleteAfter')) {
            chrome.storage.local.set({...}, ()=>{resolve();})   // async
        }
    })
   resolve();  // ← synchronous, fires BEFORE the migration above can run
}
```

The sync `resolve()` at line 365 fires immediately, so users upgrading from a pre-`deleteAfter` settings schema proceed without the migration having applied. Double-resolve also happens on the migration path (harmless but symptomatic).

### H2. `componentDidMount` promise chain is malformed
**File:** `src/components/home.jsx:53–60`

```js
initSettingsDB().then(this.cleanDB()).then(() => {
```

`this.cleanDB()` is invoked (parentheses), not passed as a callback. `.then(somePromise)` treats the promise-as-value as undefined, so the next `.then` runs after `initSettingsDB()` completes, in parallel with `cleanDB`. Combined with H1, `cleanDB` may read `videos` before storage is initialized.

### H3. `cleanDB` crashes on first-ever run
**File:** `src/components/home.jsx:313–326`

```js
chrome.storage.local.get("videos", (data) => {
    let fixedDB = data;
    for (let i = fixedDB.videos.length - 1; i >= 0; i--){  // TypeError if videos undefined
```

A fresh user who opens the popup before the content script has run on any YouTube page has no `videos` key in storage → `data.videos` is undefined → TypeError. `content.js` has an `initDB()` guard but the popup doesn't.

### H4. `generateList` never resolves on empty/undefined video list
**File:** `src/components/list.jsx:10–44`

```js
if (data.videos != undefined && data.videos.length != 0) {
    // ... resolve(elementList);
}
// no else — promise hangs forever for empty state
```

UI happens to still render ("No videos" appears by other means), but `setList`'s `.then` callback never fires for empty state — leaves `listReady: false` permanently and any state that depended on the then is dead.

### H5. `checkWatchable` wrong substring check for timestamp URLs
**File:** `src/content.js:202–204`

```js
return link.includes("watch?") && !link.includes("?t=");
```

YouTube's timestamp-shared URLs use `&t=30s`, not `?t=30s`. So the `?t=` exclusion check never matches real timestamp links. If the intent is "skip auto-resume on timestamp-shared URLs," it doesn't work. If the intent is something else, the name is wrong.

### H6. NPE on YouTube DOM selector failures
**File:** `src/content.js:111–112, 245, 257–258, 294, 297, 310`

Multiple `document.querySelector(...).textContent` / `.duration` calls with no null check. One failed selector match = runtime TypeError kills the content script for that tab.

### H7. Shift-click range can silently include filtered-out videos
**File:** `src/components/home.jsx:275–289, list.jsx:14–40`

`handleShiftClick` walks indices `start..end` of the raw `videos` array, but the displayed list is filtered by `checkCriteria` (skips `doNotResume`, `complete`, short videos, etc.). Shift-selecting across a filtered item silently adds it to the delete set even though the user never saw it in the list.

---

## Medium (correctness + resource issues)

### M1. `grabTitle` interval never cleared on timeout
**File:** `src/content.js:185–200`

If the title never appears (YT DOM changed, navigation cancelled), `setInterval` runs every 2s forever. Memory leak + continuous queries. Should cap retries or wrap with a max-wait timeout.

### M2. `ontimeupdate` property-assignment pattern
**File:** `src/content.js:296`

`video.ontimeupdate = ...` replaces any existing handler. If YouTube (or another extension) sets one, we blow it away. Use `addEventListener('timeupdate', handler, { once:false })` with a saved reference so we can `removeEventListener` on navigation.

### M3. `extractWatchID` doesn't handle youtu.be short URLs or `/shorts/`
**File:** `src/components/utilities.jsx:1–19` (and the different impl in `content.js:179–183`)

No `v=` in `https://youtu.be/XXX` or `https://youtube.com/shorts/XXX` → `start=0`, returns the whole URL as the "ID". Storage dedup breaks (same video via two URL shapes = two entries), blacklist lookups miss. Also: two different `extractWatchID` implementations across the popup and content script — code drift hazard. Use `URL` + `URLSearchParams` API.

### M4. Popup `getSettings` default schema is missing `deleteAfter`
**File:** `src/components/home.jsx:297–308`

Content script's `initSettings` (content.js:159–177) writes `deleteAfter: 30`. Popup's fallback defaults omit it. If the popup's fallback path fires (rare but possible), settings drift between popup and content script.

### M5. `setState` in `getSettings` else branch uses stale undefined
**File:** `src/components/home.jsx:306`

```js
chrome.storage.local.set({ settings: {...} }, () => {
    this.setState({ settings: data.settings, ... });  // data.settings was undefined — that's why we're here
});
```

Should pass the object we just wrote, not the undefined we came in with.

### M6. No `chrome.runtime.lastError` checks anywhere
Any storage operation can fail (QUOTA_BYTES exceeded, disk error, user revoked permission). None of the `.get` / `.set` callbacks check `chrome.runtime.lastError`. Silent failures — the user sees "nothing happened" with no feedback.

### M7. Settings inputs accept unbounded / negative values
**File:** `src/components/settings.jsx:128, 136, 144, 157`

`<input type="number">` with no `min` attribute. Users can enter `-5` or `99999999`. File has a `//TODO: Input validation for settings` comment on line 8 — known by you already.

---

## Low (polish / tech debt)

- **L1. Deprecated callback API** — the whole codebase uses `chrome.storage.local.get(key, cb)`. MV3 favors the promise-based variant. Functional but on a deprecation path.
- **L2. `styled-jsx` syntax without the plugin** — `<style jsx>{`...`}</style>` in popup.jsx / home.jsx is Next.js syntax. Without the plugin, it renders as a literal global `<style>` tag (works, but not scoped as the author probably expected).
- **L3. `var`/`let`/`const` mixed unsystematically** — cosmetic.
- **L4. `.DS_Store` files committed** at `preact-ytautoresume/`, `preact-ytautoresume/src/`, `preact-ytautoresume/src/assets/`, `preact-ytautoresume/src/assets/icons/`, `preact-ytautoresume/dist/icons/`. macOS droppings — add to `.gitignore` and `git rm --cached`.
- **L5. Mixed tabs/spaces** in a few files. Cosmetic.
- **L6. `DEBUG` flag is a compile-time constant** set per-file, with inconsistent defaults (`content.js: false`, `home.jsx: true`, `list.jsx: false`, `settings.jsx: false`). `home.jsx` defaults to `true`, which means all those `DEBUG && console.log(...)` calls are currently live in production. Not harmful but noisy in the user's devtools.

---

## Suggested fix order

1. **C3 first** (verify video title selector works on current YouTube) — if it's broken, everything else is academic because the content script can't identify videos.
2. **C1** (blacklist toggle) — small diff, high user-visible impact.
3. **C4** (throttle `setTime`) — avoids write quota and race.
4. **H1 + H2 + H3 + H4** — popup initialization chain. Bundle as one "initialization correctness" PR.
5. **C2 + H7** — shift-click. Rewrite `handleShiftClick` to return the updated array synchronously (pass the full videos list down as a prop, or await the storage get properly).
6. **H6 + M1 + M2** — defensive DOM programming.
7. **M3 + M4 + M5** — storage/settings hygiene.
8. **Everything else** under "durable toolchain migration" (see toolchain-modernize plan).

None of the above are "forcing function" fixes — the extension works for most users today. But each of the Critical items has a plausible "this is why my extension is buggy" user report behind it.
