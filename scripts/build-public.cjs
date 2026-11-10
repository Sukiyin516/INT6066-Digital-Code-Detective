const { copyFileSync, mkdirSync, readdirSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'public');
const files = [
  'index.html',
  'styles.css',
  'scene.css',
  'transition.css',
  'stage2.css',
  'victory.css',
  'data.js',
  'rules.js',
  'app.js',
  'id.svg',
  'mail.svg',
  'assets/detective-room-background.png',
  'assets/tipcard1.png',
  'assets/tipcard2.png',
];

mkdirSync(path.join(output, 'assets'), { recursive: true });
const allowed = new Set(['assets', ...files]);
for (const entry of readdirSync(output, { recursive: true })) {
  if (!allowed.has(entry.split(path.sep).join('/'))) {
    throw new Error(`Unexpected file in public/: ${entry}. Remove it before building.`);
  }
}

for (const file of files) {
  copyFileSync(path.join(root, file), path.join(output, file));
}

console.log(`Prepared public/ with ${files.length} game files.`);
