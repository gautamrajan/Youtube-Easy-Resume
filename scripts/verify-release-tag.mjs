import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const changelog = await readFile(path.join(rootDir, 'CHANGELOG.md'), 'utf8');
const tag = process.argv[2];
const expectedTag = `v${packageJson.version}`;

assert.ok(tag, `Pass the release tag, for example ${expectedTag}`);
assert.equal(tag, expectedTag, `Release tag must match package version ${expectedTag}`);
const versionParts = packageJson.version.split('.');
assert.ok(
  versionParts.length >= 1 && versionParts.length <= 4,
  'Extension version must contain one to four numeric components'
);
assert.ok(
  versionParts.every(part => /^(?:0|[1-9]\d*)$/.test(part) && Number(part) <= 65535),
  'Each extension version component must be an integer from 0 to 65,535 without leading zeros'
);
assert.ok(versionParts.some(part => Number(part) > 0), 'Extension version cannot be all zeros');
assert.ok(
  changelog.includes(`## [${packageJson.version}]`),
  `CHANGELOG.md needs a ${packageJson.version} release section`
);
console.log(`Verified release tag ${tag}.`);
