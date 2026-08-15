const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const chromeBuildDir = path.join(projectDir, 'dist');
const firefoxBuildDir = path.join(projectDir, 'build', 'firefox');

const readJson = filename => JSON.parse(
  fs.readFileSync(path.join(projectDir, filename), 'utf8')
);

const manifest = {
  ...readJson('manifest.json'),
  ...readJson('manifest.firefox.json')
};

fs.rmSync(firefoxBuildDir, { recursive: true, force: true });
fs.mkdirSync(path.dirname(firefoxBuildDir), { recursive: true });
fs.cpSync(chromeBuildDir, firefoxBuildDir, {
  recursive: true,
  filter: source => path.basename(source) !== '.DS_Store'
});
fs.writeFileSync(
  path.join(firefoxBuildDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`
);
