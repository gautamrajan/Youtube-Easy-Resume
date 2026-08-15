# YouTube Easy Resume extension

Chrome and Firefox use the same application source. `src/extensionApi.js` selects Firefox's `browser` namespace when available and otherwise uses Chrome's `chrome` namespace. All asynchronous extension storage calls use the shared Promise interface.

The content script and popup are both Webpack entries, so they execute the same imported storage and API modules. Browser packaging metadata is kept separate from application behavior.

## Requires Node 16.13.0 to build

`manifest.json` is the shared manifest and the Chrome build manifest. The
Firefox build merges `manifest.firefox.json` into it, keeping Firefox signing
metadata separate without duplicating application code.

The Firefox add-on ID is a permanent update identity. It was added here because
the previous Firefox repository and package contain no add-on ID; do not change
it after the first signed release. Firefox 140 is the minimum supported desktop
version because it is the first release that supports Mozilla's required
built-in data-collection consent metadata. Firefox for Android is not declared
as supported until the mobile YouTube experience is tested.

The popup loads only packaged assets. Opening a saved video is user-initiated,
and the extension does not otherwise transmit browsing data, so the Firefox
manifest declares that no data is collected or transmitted.

## CLI Commands

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build the Chrome extension in dist/
npm run build

# build the Firefox extension in build/firefox/
npm run build:firefox

# run tests with jest and enzyme
npm run test
```
