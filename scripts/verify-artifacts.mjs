import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = path.join(rootDir, 'dist');
const artifactsDir = path.join(rootDir, 'build', 'artifacts');
const targets = ['chrome', 'firefox'];
const requiredFiles = [
  'content.js',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'icons/playericon.svg',
  'icons/playericon_inactive.svg',
  'icons/redcircle.svg',
  'manifest.json',
  'popup.css',
  'popup.html',
  'popup.js'
];

async function readManifest(target) {
  const manifestPath = path.join(distDir, target, 'manifest.json');
  return JSON.parse(await readFile(manifestPath, 'utf8'));
}

async function verifyRequiredFiles(target) {
  for (const relativePath of requiredFiles) {
    const file = path.join(distDir, target, relativePath);
    assert.ok((await stat(file)).size > 0, `${target}/${relativePath} is empty`);
  }
}

async function verifyPackage(target, version) {
  const files = await readdir(path.join(artifactsDir, target));
  const expectedArchive = `youtube-easy-resume-${version}-${target}.zip`;
  const matchingArchives = files.filter(file => file === expectedArchive);
  assert.equal(
    matchingArchives.length,
    1,
    `Expected one ${target} archive for version ${version}`
  );
  const archive = path.join(artifactsDir, target, matchingArchives[0]);
  assert.ok((await stat(archive)).size > 0, `${target} archive is empty`);

  const zip = await JSZip.loadAsync(await readFile(archive), { checkCRC32: true });
  const packagedPaths = Object.values(zip.files)
    .filter(entry => !entry.dir)
    .map(entry => entry.name)
    .sort();
  assert.deepEqual(
    packagedPaths,
    [...requiredFiles].sort(),
    `${target} archive has an unexpected file set`
  );

  const packagedFiles = {};
  for (const relativePath of requiredFiles) {
    const packagedFile = zip.file(relativePath);
    assert.ok(packagedFile, `${target} archive is missing ${relativePath}`);
    const packagedBytes = Buffer.from(await packagedFile.async('uint8array'));
    const distBytes = await readFile(path.join(distDir, target, relativePath));
    assert.ok(packagedBytes.length > 0, `${target}/${relativePath} is empty in the archive`);
    assert.ok(
      packagedBytes.equals(distBytes),
      `${target}/${relativePath} differs between dist and the archive`
    );
    packagedFiles[relativePath] = packagedBytes;
  }
  return packagedFiles;
}

await Promise.all(targets.map(verifyRequiredFiles));

const chromeManifest = await readManifest('chrome');
const firefoxManifest = await readManifest('firefox');
assert.equal(chromeManifest.manifest_version, 3);
assert.equal(firefoxManifest.manifest_version, 3);
assert.equal(firefoxManifest.version, chromeManifest.version);
assert.equal(chromeManifest.name, 'YouTube Easy Resume');
assert.equal(chromeManifest.short_name, 'YT Easy Resume');
assert.equal(chromeManifest.description,
  'An extension that provides auto-resume functionality and an easy to access watchlist for YouTube');
assert.equal(chromeManifest.action.default_title, 'YouTube Easy Resume');
assert.equal(firefoxManifest.name, 'Easy Resume for YouTube');
assert.equal(firefoxManifest.short_name, 'Easy Resume');
assert.equal(firefoxManifest.description,
  'Private, local YouTube watch history with automatic resume—even while YouTube Watch History is turned off.');
assert.equal(firefoxManifest.action.default_title, 'Easy Resume for YouTube');
assert.equal(firefoxManifest.action.default_popup, chromeManifest.action.default_popup);
assert.deepEqual(firefoxManifest.action.default_icon, chromeManifest.action.default_icon);
assert.equal(firefoxManifest.browser_specific_settings.gecko.id,
  'youtube-easy-resume@annenbergmedia.com');
assert.equal(chromeManifest.browser_specific_settings, undefined);

const popupPages = await Promise.all(targets.map(target => {
  return readFile(path.join(distDir, target, 'popup.html'), 'utf8');
}));
assert.match(popupPages[0], /<title>YouTube Easy Resume<\/title>/);
assert.match(popupPages[1], /<title>Easy Resume for YouTube<\/title>/);
assert.ok(popupPages.every(page => !page.includes('{{EXTENSION_NAME}}')));

const sharedFiles = requiredFiles.filter(file => !['manifest.json', 'popup.html'].includes(file));
for (const relativePath of sharedFiles) {
  const [chromeFile, firefoxFile] = await Promise.all(targets.map(target => {
    return readFile(path.join(distDir, target, relativePath));
  }));
  assert.ok(
    chromeFile.equals(firefoxFile),
    `${relativePath} differs between browser targets`
  );
}

const [chromePackage, firefoxPackage] = await Promise.all(
  targets.map(target => verifyPackage(target, chromeManifest.version))
);
for (const relativePath of sharedFiles) {
  assert.ok(
    chromePackage[relativePath].equals(firefoxPackage[relativePath]),
    `${relativePath} differs between browser archives`
  );
}
console.log(`Verified Chrome and Firefox ${chromeManifest.version} artifacts.`);
