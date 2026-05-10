/**
 * Build the Electron main process with esbuild.
 * Outputs to dist-electron/main.js
 */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Lightweight .env loader — Vite handles this automatically for the renderer
// build, but esbuild does not. We populate process.env from .env so that any
// VITE_* keys can be inlined into the main-process bundle via define: below.
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (key in process.env) continue;
    const value = rawValue.replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}
loadEnvFile(path.resolve(__dirname, '../.env'));

const ESBUILD_COMMON = {
  bundle: true,
  platform: 'node',
  target: 'node22',
  external: [
    'electron',
    'electron-updater',
    'electron-devtools-installer',
    'electron-store',
    'electron-log',
    'electron-is-dev',
    'express',
    'express-http-proxy',
    '@neteaseapireborn/api',
    '@unblockneteasemusic/rust-napi',
    'mpris-service',
    'discord-rich-presence',
    'dbus-next',
  ],
  alias: {
    '@': path.resolve(__dirname, '../src'),
  },
  define: {
    'process.env.IS_ELECTRON': 'true',
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'production'
    ),
    // Mirror Vite's import.meta.env handling so shared modules (e.g.
    // src/utils/errorReporter.js) resolve VITE_REPORTER_* the same way in
    // both renderer and main builds.
    'import.meta.env.VITE_REPORTER_WORKER_URL': JSON.stringify(
      process.env.VITE_REPORTER_WORKER_URL || ''
    ),
    'import.meta.env.VITE_REPORTER_SECRET': JSON.stringify(
      process.env.VITE_REPORTER_SECRET || ''
    ),
  },
  format: 'cjs',
  sourcemap: true,
};

Promise.all([
  esbuild.build({
    ...ESBUILD_COMMON,
    entryPoints: [path.resolve(__dirname, '../src/background.js')],
    outfile: path.resolve(__dirname, '../dist-electron/main.js'),
  }),
  esbuild.build({
    ...ESBUILD_COMMON,
    entryPoints: [path.resolve(__dirname, '../src/preload.js')],
    outfile: path.resolve(__dirname, '../dist-electron/preload.js'),
  }),
])
  .then(() => {
    console.log('Electron main + preload built successfully.');
  })
  .catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
