import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const requestedTarget = process.argv[2];
const targets = requestedTarget ? [requestedTarget] : ['chrome', 'firefox'];

if (targets.some(target => !['chrome', 'firefox'].includes(target))) {
  throw new Error('Package target must be chrome or firefox.');
}

const webExt = path.join(
  rootDir,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'web-ext.cmd' : 'web-ext'
);

function buildArchive(target) {
  const sourceDir = path.join(rootDir, 'dist', target);
  const targetArtifactsDir = path.join(rootDir, 'build', 'artifacts', target);
  const filename = `youtube-easy-resume-${packageJson.version}-${target}.zip`;

  return rm(targetArtifactsDir, { recursive: true, force: true }).then(() => {
    return new Promise((resolve, reject) => {
      const child = spawn(webExt, [
        'build',
        '--source-dir', sourceDir,
        '--artifacts-dir', targetArtifactsDir,
        '--filename', filename,
        '--overwrite-dest'
      ], {
        cwd: rootDir,
        stdio: 'inherit'
      });
      child.once('error', reject);
      child.once('exit', code => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(`Unable to package ${target}; web-ext exited with ${code}`));
      });
    });
  });
}

for (const target of targets) {
  await buildArchive(target);
}
