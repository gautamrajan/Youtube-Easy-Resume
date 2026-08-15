import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const extensionDir = path.join(rootDir, 'preact-ytautoresume');
const sourceDir = path.join(extensionDir, 'src');
const bundleDir = path.join(rootDir, 'build', 'bundles');
const distDir = path.join(rootDir, 'dist');
const requestedTarget = process.argv[2];
const targets = requestedTarget ? [requestedTarget] : ['chrome', 'firefox'];

if (targets.some(target => !['chrome', 'firefox'].includes(target))) {
  throw new Error('Build target must be chrome or firefox.');
}

const readJson = async filename => JSON.parse(await readFile(filename, 'utf8'));
const baseManifest = await readJson(path.join(extensionDir, 'manifest.json'));
const firefoxManifest = await readJson(path.join(extensionDir, 'manifest.firefox.json'));

await rm(bundleDir, { recursive: true, force: true });
await rm(distDir, { recursive: true, force: true });
await mkdir(bundleDir, { recursive: true });

await build({
  entryPoints: {
    content: path.join(sourceDir, 'content.js'),
    popup: path.join(sourceDir, 'popup.jsx')
  },
  bundle: true,
  entryNames: '[name]',
  format: 'iife',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  legalComments: 'eof',
  minify: true,
  outdir: bundleDir,
  platform: 'browser',
  splitting: false,
  target: ['chrome95', 'firefox140']
});

for (const target of targets) {
  const targetDir = path.join(distDir, target);
  const manifest = target === 'firefox'
    ? { ...baseManifest, ...firefoxManifest }
    : baseManifest;

  await mkdir(targetDir, { recursive: true });
  await cp(bundleDir, targetDir, { recursive: true });
  await cp(path.join(sourceDir, 'popup.html'), path.join(targetDir, 'popup.html'));
  await cp(path.join(sourceDir, 'assets', 'icons'), path.join(targetDir, 'icons'), {
    recursive: true,
    filter: source => path.basename(source) !== '.DS_Store'
  });
  await writeFile(
    path.join(targetDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}

await rm(bundleDir, { recursive: true, force: true });
