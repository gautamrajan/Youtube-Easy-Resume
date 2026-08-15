import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
assert.equal(result.status, 0, result.stderr || 'Unable to list tracked files');

const trackedFiles = result.stdout.split('\0').filter(Boolean);
const forbiddenFiles = trackedFiles.filter((file) => {
  return file === '.DS_Store'
    || file.includes('/.DS_Store')
    || /(^|\/)(dist|build|\.vscode)(\/|$)/.test(file)
    || file.endsWith('.zip')
    || /package-lock\.json\.\d+$/.test(file);
});

assert.deepEqual(
  forbiddenFiles,
  [],
  `Generated files are tracked: ${forbiddenFiles.join(', ')}`,
);

const lockfiles = trackedFiles.filter((file) => file.endsWith('package-lock.json'));
assert.deepEqual(
  lockfiles,
  ['package-lock.json'],
  'The root package-lock.json must be the only lockfile',
);

console.log('Verified repository artifact hygiene.');
