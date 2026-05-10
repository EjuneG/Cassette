// ============================================================
// 部署 Worker 后把这两个常量填上即可启用上报
// 留空 = 不启用（dev 时本地 console 还是会打错误）
// ============================================================
const WORKER_URL = 'https://yesplaymusic.shuaishuai614.workers.dev'; // e.g. 'https://ypm-reporter.xxx.workers.dev'
const SHARED_SECRET =
  '0e9a4bd9592e3da2f3332f37368b2dbbf195f76e25158e580fee1321badbfa19'; // 与 Worker 那边的 SHARED_SECRET 完全一致

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
