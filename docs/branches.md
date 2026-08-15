# Branch and repository lifecycle

`main` is the only maintained application line. It produces both browser
packages and is protected by the required `validate` check. New work uses
short-lived `codex/*` branches and is squash-merged through pull requests.
Matching `v*` release tags are protected separately and may be created only by
repository administrators.

## Historical branches

The useful Chrome feature work and the cross-browser stabilization work are now
represented in `main`. After the first consolidated Chrome and Firefox store
release is verified, these remote branches can be deleted:

- `dev` and `feature/moving-master-toggle-to-settings`: integrated through PR
  #21 and its follow-up fixes.
- `codex/cross-browser-stabilization`, `codex/shared-browser-api`,
  `codex/firefox-mv3-metadata`, `codex/modern-build`,
  `codex/youtube-dom-hardening`, `codex/popup-settings-accessibility`,
  `codex/dual-browser-ci`, `codex/reproducible-releases`, and
  `codex/repository-cleanup`: reviewed and merged through PRs #21–#29.
- `bug-fixes`: its useful audit findings have been fixed or converted into
  tracked issues.

Preserve two useful historical snapshots before deleting their branches:

- Create `archive/indexeddb-experiment` at commit `51e90b8`, then delete
  `feature/indexeddb-migration`.
- Create `archive/bug-audit-2026-04-21` at commit `e4e64f6`, then delete
  `bug-fixes`.

The local-only `feature/search` branch has no remaining remote and its useful
work is already integrated. It can be removed with the other local historical
branches after the release.

## Release cleanup gate

Do not delete the historical branches or archive the old Firefox repository
until all of these checks are complete:

1. Resolve the AMO extension ID in issue #13.
2. Confirm signed upgrade and rollback tests preserve existing user data.
3. Produce a GitHub release from a protected tag and have both stores accept
   its browser packages.
4. Complete the manual smoke test for the published version in both browsers.

After that gate, create the two archive tags above, delete the obsolete remote
branches, prune their local counterparts, and archive the Firefox-only GitHub
repository. The canonical remote remains
`git@github.com:gautamrajan/Youtube-Easy-Resume.git`; the Firefox-only remote is
retained solely as release history until it is archived.
