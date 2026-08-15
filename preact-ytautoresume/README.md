# YouTube Easy Resume extension

Chrome and Firefox use the same application source. `src/extensionApi.js` selects Firefox's `browser` namespace when available and otherwise uses Chrome's `chrome` namespace. All asynchronous extension storage calls use the shared Promise interface.

The content script and popup are both Webpack entries, so they execute the same imported storage and API modules. Browser packaging metadata is kept separate from application behavior.

## Requires Node 16.13.0 to build

## CLI Commands

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# run tests with jest and enzyme
npm run test
```
