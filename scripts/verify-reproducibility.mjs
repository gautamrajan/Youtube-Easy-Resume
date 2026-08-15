import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const targets = ['chrome', 'firefox'];

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function listFiles(directory, relativeDirectory = '') {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true
  });
  const files = [];
  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(directory, relativePath));
    } else {
      files.push(relativePath.split(path.sep).join('/'));
    }
  }
  return files.sort();
}

async function snapshotDirectory(directory) {
  const files = await listFiles(directory);
  return Promise.all(files.map(async relativePath => ({
    path: relativePath,
    sha256: digest(await readFile(path.join(directory, relativePath)))
  })));
}

async function snapshotArchive(target) {
  const filename = `youtube-easy-resume-${packageJson.version}-${target}.zip`;
  const archive = await readFile(path.join(rootDir, 'build', 'artifacts', target, filename));
  const zip = await JSZip.loadAsync(archive, { checkCRC32: true });
  const entries = Object.values(zip.files)
    .filter(entry => !entry.dir)
    .sort((left, right) => left.name.localeCompare(right.name));
  return Promise.all(entries.map(async entry => ({
    path: entry.name,
    sha256: digest(Buffer.from(await entry.async('uint8array')))
  })));
}

async function snapshotBuild() {
  const snapshots = {};
  for (const target of targets) {
    snapshots[target] = {
      dist: await snapshotDirectory(path.join(rootDir, 'dist', target)),
      archive: await snapshotArchive(target)
    };
  }
  return snapshots;
}

function rebuildPackages() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return new Promise((resolve, reject) => {
    const child = spawn(npm, ['run', 'package'], { cwd: rootDir, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Rebuild failed with exit code ${code}`));
    });
  });
}

const firstBuild = await snapshotBuild();
await rebuildPackages();
const secondBuild = await snapshotBuild();
assert.deepEqual(secondBuild, firstBuild, 'Rebuilding changed packaged extension contents');
console.log(`Verified reproducible Chrome and Firefox ${packageJson.version} contents.`);
