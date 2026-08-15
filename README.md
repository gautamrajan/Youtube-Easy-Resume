# YouTube Easy Resume

A Chrome and Firefox extension that adds auto-resume functionality to YouTube videos. Videos automatically resume from where you left off, and in-progress videos are displayed in a popup. Configurable settings control which videos resume, and a toggle is added to the YouTube player.

Both browsers use the same source and generated content/popup bundles. Browser-specific API namespace selection is isolated in `preact-ytautoresume/src/extensionApi.js`.

## Requirements

- Node 24.18.0 (the pinned Node 24 LTS release in `.nvmrc`)
- npm 11 (included with the pinned Node release)

## Development

Run commands from the repository root:

```bash
nvm use
npm ci
npm test
npm run lint
npm run build
```

`npm run build` creates both unpacked extensions from the same source commit:

- `dist/chrome`
- `dist/firefox`

The bundles target Chrome 95 and Firefox 140. Chrome 95 is the first MV3
release with the Promise-based storage API used by the shared adapter; the
Firefox minimum is also enforced in its manifest.

Use `npm run dev:firefox` after building to open the Firefox artifact as a
temporary extension. For Chrome, load `dist/chrome` as an unpacked extension.

Firefox-specific signing and privacy fields live in
`preact-ytautoresume/manifest.firefox.json`; the rest of the manifest is shared.
Generated directories are intentionally not committed.

## Toolchain

The extension uses esbuild for two standalone browser bundles and Vitest for the
existing regression suite. This replaces the old Preact CLI, Babel, Webpack,
Jest, and Enzyme graph without changing the application framework.

Before the migration, `npm audit` reported 133 findings in the nested toolchain
(8 critical, 40 high, 77 moderate, and 8 low). Run `npm audit` from the root to
check the current root lockfile. The migrated production dependency graph has no
known findings. The complete development graph currently has three high-severity
findings, all inherited from `web-ext` through its image parser; it remains a
development-only package validator and should be updated when its upstream fix
is released.
