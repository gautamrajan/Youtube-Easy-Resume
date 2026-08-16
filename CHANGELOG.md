# Changelog

All user-visible changes are recorded here. The version in `package.json` is
the single release version used by both browser manifests and release tags.

## [Unreleased]

## [0.0.1.8] - 2026-08-15

- Preserved the original YouTube Easy Resume and Annenberg Media presentation
  in Chrome while giving Firefox independent Easy Resume for YouTube branding.
- Added privacy-focused Firefox manifest copy and browser-specific popup titles.
- Advanced the shared package version beyond the Chrome Web Store's existing
  0.0.1.7 release.

## [0.0.1.7] - 2026-08-15

- Consolidated Chrome and Firefox onto one Manifest V3 implementation.
- Fixed first-click blacklist state, popup startup, live settings, storage
  migration, expiry, progress throttling, and YouTube SPA lifecycle handling.
- Replaced the legacy build graph with a maintained Node 24, esbuild, Vitest,
  ESLint, and web-ext toolchain.
- Improved popup validation, CSS, keyboard behavior, and accessibility.
- Added deterministic dual-browser tests, package inspection, and protected CI.
