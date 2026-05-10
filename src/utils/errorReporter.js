// ============================================================
// Bug-reporter Worker config — values come from .env via VITE_REPORTER_*.
// Leave the env vars empty to disable reporting (dev still logs to console).
// Renderer build: Vite reads .env automatically.
// Main-process build: scripts/build-electron.js loads .env and inlines
// import.meta.env.VITE_REPORTER_* at bundle time.
// Note: anything that reaches the deployed bundle is observable in DevTools,
// so SHARED_SECRET is a soft anti-spam token — not a real secret.
// ============================================================
const WORKER_URL = import.meta.env.VITE_REPORTER_WORKER_URL || '';
const SHARED_SECRET = import.meta.env.VITE_REPORTER_SECRET || '';

const APP_VERSION = '0.5.2';

let processContext = 'unknown';
let initialized = false;
let reporting = false;

const recentFingerprints = new Map();
const DEDUPE_WINDOW_MS = 60_000;

function fingerprint(message, stack) {
  const stackHead = (stack || '').split('\n')[1] || '';
  return `${message}::${stackHead.trim()}`;
}

function isDuplicate(fp) {
  const now = Date.now();
  for (const [k, t] of recentFingerprints) {
    if (now - t > DEDUPE_WINDOW_MS) recentFingerprints.delete(k);
  }
  if (recentFingerprints.has(fp)) return true;
  recentFingerprints.set(fp, now);
  return false;
}

function buildIssueBody({ message, stack, extra }) {
  const lines = [
    '## Error',
    '```',
    message,
    '```',
    '',
    '## Stack',
    '```',
    stack || '(no stack)',
    '```',
    '',
    '## Environment',
    `- Process: ${processContext}`,
    `- App version: ${APP_VERSION}`,
    `- Time: ${new Date().toISOString()}`,
  ];
  if (typeof process !== 'undefined') {
    if (process.platform) lines.push(`- Platform: ${process.platform}`);
    if (process.versions?.electron)
      lines.push(`- Electron: ${process.versions.electron}`);
    if (process.versions?.node) lines.push(`- Node: ${process.versions.node}`);
  }
  if (typeof navigator !== 'undefined') {
    lines.push(`- User agent: ${navigator.userAgent}`);
  }
  if (extra) {
    lines.push('', '## Extra', '```json', safeStringify(extra), '```');
  }
  return lines.join('\n');
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

async function send(title, body) {
  if (!WORKER_URL || !SHARED_SECRET) return;
  if (reporting) return;
  reporting = true;
  try {
    await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-YPM-Secret': SHARED_SECRET,
      },
      body: JSON.stringify({ title, body }),
    });
  } catch {
    // 静默失败，绝对不能 throw — 否则 unhandledrejection 会再次触发上报，死循环
  } finally {
    reporting = false;
  }
}

export function reportError(error, extra) {
  const message = error?.message || String(error);
  const stack = error?.stack;
  const fp = fingerprint(message, stack);
  if (isDuplicate(fp)) return;
  const title = `[${processContext}] ${message.split('\n')[0].slice(0, 120)}`;
  const body = buildIssueBody({ message, stack, extra });
  send(title, body);
}

export function initRendererErrorReporter(app) {
  if (initialized) return;
  initialized = true;
  processContext = 'renderer';

  app.config.errorHandler = (err, _instance, info) => {
    reportError(err, { vueInfo: info });
    console.error('[Vue]', err);
  };

  window.addEventListener('error', event => {
    const err = event.error || new Error(event.message);
    reportError(err, {
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));
    reportError(err, { type: 'unhandledrejection' });
  });
}

export function initMainErrorReporter() {
  if (initialized) return;
  initialized = true;
  processContext = 'main';

  process.on('uncaughtException', err => {
    reportError(err, { type: 'uncaughtException' });
    console.error('[main uncaughtException]', err);
  });

  process.on('unhandledRejection', reason => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    reportError(err, { type: 'unhandledRejection' });
    console.error('[main unhandledRejection]', reason);
  });
}
