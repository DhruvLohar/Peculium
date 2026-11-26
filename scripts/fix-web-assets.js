/**
 * Post-processes `expo export -p web` output for Vercel.
 *
 * Expo emits package assets (fonts, icons) under dist/assets/node_modules/, but the Vercel CLI never
 * uploads directories named node_modules, so they 404 in production (fonts fall back to serif).
 * This moves them to dist/assets/_pkg/ and rewrites the references in the JS bundles. Bundles whose
 * contents change are renamed with a fresh hash so no CDN/service-worker copy of the old file is reused.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIST = path.resolve(__dirname, '..', 'dist');
const FROM = path.join(DIST, 'assets', 'node_modules');
const TO = path.join(DIST, 'assets', '_pkg');
const JS_DIR = path.join(DIST, '_expo', 'static', 'js', 'web');
const INDEX = path.join(DIST, 'index.html');

if (!fs.existsSync(FROM)) {
  console.log('fix-web-assets: nothing to move');
  process.exit(0);
}

fs.rmSync(TO, { recursive: true, force: true });
fs.renameSync(FROM, TO);

let html = fs.readFileSync(INDEX, 'utf8');
let rewritten = 0;

for (const file of fs.readdirSync(JS_DIR).filter((f) => f.endsWith('.js'))) {
  const filePath = path.join(JS_DIR, file);
  const source = fs.readFileSync(filePath, 'utf8');
  const updated = source.split('/assets/node_modules/').join('/assets/_pkg/');
  if (updated === source) continue;

  const hash = crypto.createHash('md5').update(updated).digest('hex');
  const renamed = file.replace(/-[0-9a-f]{32}\.js$/, `-${hash}.js`);
  fs.writeFileSync(path.join(JS_DIR, renamed), updated);
  if (renamed !== file) fs.rmSync(filePath);

  html = html.split(file).join(renamed);
  rewritten += 1;
}

fs.writeFileSync(INDEX, html);
console.log(`fix-web-assets: moved package assets to assets/_pkg, rewrote ${rewritten} bundle(s)`);
