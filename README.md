# YouTube Easy Resume

A Chrome and Firefox extension that adds auto-resume functionality to YouTube videos. Videos automatically resume from where you left off, and in-progress videos are displayed in a popup. Configurable settings control which videos resume, and a toggle is added to the YouTube player.

Both browsers use the same application source and generated content/popup
JavaScript. Browser-specific manifest branding and popup titles are applied by
the build, while API namespace selection is isolated in
`preact-ytautoresume/src/extensionApi.js`.

Chrome retains the original **YouTube Easy Resume** name and Annenberg Media
attribution from its development there. Firefox is presented independently as
**Easy Resume for YouTube** and omits that attribution. The Firefox UUID still
contains the historical Annenberg domain because signed extension identities
must remain stable; it is technical metadata, not current product branding.

## Requirements

- Node 24.18.0 (the pinned Node 24 LTS release in `.nvmrc`)
- npm 11 (included with the pinned Node release)

## Development

Run commands from the repository root:

```bash
nvm use
npm ci
npm run check
```

`npm run check` runs the same deterministic test, lint, dual-browser package,
Firefox package-lint, artifact inspection, and rebuild comparison gate used by
CI. Pull requests must pass that gate; the resulting Chrome and Firefox ZIPs
are retained as CI artifacts for inspection.

`npm run build` creates both unpacked extensions from the same source commit:

- `dist/chrome`
- `dist/firefox`

The bundles target Chrome 95 and Firefox 140. Chrome 95 is the first MV3
release with the Promise-based storage API used by the shared adapter; the
Firefox minimum is also enforced in its manifest.

Use `npm run dev:firefox` after building to open the Firefox artifact as a
temporary extension. For Chrome, load `dist/chrome` as an unpacked extension.
Before a store release, run the [manual live-site smoke test](docs/manual-smoke-test.md)
in both browsers. Live YouTube checks intentionally remain separate from the
deterministic CI gate so a site or network outage cannot hide a source regression.

To create local archives for both browsers:

```bash
npm run package
```

This builds both targets once, then writes separate ZIP files under
`build/artifacts/chrome` and `build/artifacts/firefox`. Release signing,
tagging, store submission, and rollback are documented in the
[release guide](docs/release.md). A `v<package version>` tag runs the same gate
and attaches both uniquely named store packages plus the AMO source archive to
a GitHub release.

Firefox-specific signing and privacy fields live in
`preact-ytautoresume/manifest.firefox.json`; the rest of the manifest is shared.
Generated directories are intentionally not committed. Before the first signed
Firefox release, the publishing-account owner must check AMO **Manage My
Submissions** for an older private submission and use its assigned GUID if one
exists. Never change the Firefox add-on ID after signing.

The persisted settings types and supported ranges are documented in
[`preact-ytautoresume/SETTINGS.md`](preact-ytautoresume/SETTINGS.md).
User-visible release changes are recorded in [`CHANGELOG.md`](CHANGELOG.md).
The maintained branch policy and post-release archive list are documented in
the [branch lifecycle guide](docs/branches.md).

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
