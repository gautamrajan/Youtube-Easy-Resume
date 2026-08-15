import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const changelog = await readFile(path.join(rootDir, 'CHANGELOG.md'), 'utf8');
const version = process.argv[2];
assert.ok(version, 'Pass the release version.');

const heading = `## [${version}]`;
const start = changelog.indexOf(heading);

assert.notEqual(start, -1, `CHANGELOG.md needs a ${version} release section`);

const contentStart = changelog.indexOf('\n', start) + 1;
const nextHeading = changelog.indexOf('\n## [', contentStart);
const notes = changelog.slice(
  contentStart,
  nextHeading === -1 ? changelog.length : nextHeading
).trim();
assert.ok(notes, `CHANGELOG.md release ${version} has no notes`);
console.log(notes);
