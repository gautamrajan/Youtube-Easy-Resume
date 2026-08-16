# Release and rollback guide

Chrome and Firefox packages must come from the same protected `main` commit.
`package.json` is the only editable version source; the build injects that
version into both generated manifests. Do not add a version to the manifest
template.

## Release preflight

1. Confirm the Chrome Web Store item that existing users installed. Upload the
   Chrome ZIP to that item; creating a new item creates a different extension
   identity.
2. In AMO **Manage My Submissions**, check for an older private YouTube Easy
   Resume submission. If one exists, replace the proposed Gecko ID in
   `preact-ytautoresume/manifest.firefox.json` with its assigned GUID before
   signing. Never change the ID after the first signed release.
3. Upgrade-test both stores in disposable browser profiles. Save settings and
   video progress with the currently published version, install the candidate
   as an update under the same store identity, and confirm settings, progress,
   blacklist state, and the storage migration survive. Also test a rollback to
   the prior package because storage changes must remain backward-compatible.
4. Update only the version in `package.json` to a higher one-to-four-component
   version, then run `npm install --package-lock-only` to refresh the derived
   lockfile metadata. Move the relevant changelog entries from **Unreleased**
   into a matching `## [version]` section.
5. Run `nvm use`, `npm ci`, and `npm run check`. This runs tests and lint,
   builds and validates both packages, verifies exact package contents and
   checksums, and rebuilds to confirm content reproducibility.
6. Run the manual live-site checklist in both installed browsers. Store-release
   smoke tests remain manual because YouTube and browser-store availability are
   outside deterministic CI.

## Tag and GitHub release

After the release change is merged and the protected `main` check is green:

```bash
git switch main
git pull --ff-only
npm run verify:release-tag -- v0.0.1.8
git tag -a v0.0.1.8 -m "YouTube Easy Resume 0.0.1.8"
git push origin v0.0.1.8
```

Use the current version in place of `0.0.1.8`. The tag workflow rejects a tag
that does not match `package.json` or is not contained in `main`. The active
**Protect release tags** repository ruleset restricts creation, updates, and
deletion of matching `v*` tags to repository administrators. Do not disable or
bypass that rule for routine releases. The workflow runs the full protected
gate and creates one GitHub release with:

- `youtube-easy-resume-<version>-chrome.zip`
- `youtube-easy-resume-<version>-firefox.zip`
- `youtube-easy-resume-<version>-source.zip`

The source ZIP is for AMO reviewers. Because the shipped JavaScript is bundled
and minified, submit that source ZIP with the Firefox package and point the
reviewer to `.nvmrc`, `package-lock.json`, and `npm run build:firefox`. The
expected unpacked output is `dist/firefox`. This follows AMO's
[source-code submission requirements](https://extensionworkshop.com/documentation/publish/source-code-submission/).

For Chrome, upload the Chrome ZIP to the existing Web Store item. Its
`manifest.json` is at the archive root. Complete the store privacy and test
instructions, use deferred or staged publishing when available, and verify the
package version before publishing. Chrome's
[package guidance](https://developer.chrome.com/docs/webstore/prepare)
requires a ZIP of the extension files with the manifest at its root.

## Rollback

1. Stop or defer a pending store publication first. Record the failed version,
   affected behavior, and the last known-good tag.
2. Test the prior package against a profile upgraded to the failed version.
   Confirm the older code can still read settings and video history.
3. Use the [Chrome Web Store rollback control](https://developer.chrome.com/docs/webstore/rollback)
   to republish the previous package under the next higher version. For AMO,
   disable the bad version and use its
   [rollback flow](https://extensionworkshop.com/documentation/publish/version-rollback/)
   to republish the prior package under a new higher version.
4. Create a normal corrective commit and changelog entry. Never move or delete
   a published tag, reuse a released version, or replace GitHub release assets
   in place.
5. Repeat the full preflight and staged rollout, then confirm both store
   dashboards and fresh/upgrade browser profiles show the corrective version.
