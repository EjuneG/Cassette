import path from 'path';
import { BrowserWindow, ipcMain, screen } from 'electron';
import clc from 'cli-color';

const log = text => {
  console.log(`${clc.blueBright('[miniPlayer.js]')} ${text}`);
};

const MINI_WIDTH = 320;
const MINI_HEIGHT = 148;
const SCREEN_MARGIN = 24;

// mini -> main-process -> renderer(main). We deliberately reuse the command
// channels the tray and MPRIS already speak (see src/electron/ipcRenderer.js)
// instead of teaching the renderer a second vocabulary.
const COMMAND_CHANNELS = {
  play: 'play',
  next: 'next',
  previous: 'previous',
  like: 'like',
  volumeUp: 'increaseVolume',
  volumeDown: 'decreaseVolume',
};

// Set by initMiniPlayer(). There is exactly one Deck per app, and several
// modules that know nothing about each other (tray, menu, global shortcuts)
// need to ask "is it up?" — a module singleton beats threading a callback
// through every one of their signatures.
let miniPlayer = null;

/**
 * Reveal the main window from anywhere in the main process.
 *
 * While the Deck is up the main window is hidden on purpose, so every "show
 * the app" path has to tear the widget down first — otherwise the app ends up
 * wearing two faces at once.
 *
 * @param {Electron.BrowserWindow | null} win The main window.
 */
export function showMainWindow(win) {
  if (miniPlayer && miniPlayer.isOpen()) {
    miniPlayer.exit();
    return;
  }
  if (win && !win.isDestroyed()) win.show();
}

/**
 * The mini player ("The Deck") — a frameless always-on-top remote control.
 *
 * It is a dumb terminal: audio never leaves the main window's renderer, which
 * stays alive but hidden while the widget is up. State flows
 * renderer(main) -> here (cached) -> mini; commands flow the other way.
 *
 * @param {() => Electron.BrowserWindow | null} getMainWindow Always resolved
 *   lazily — the main window can be recreated (macOS `activate`).
 * @param {import('electron-store')} store
 */
export function initMiniPlayer(getMainWindow, store) {
  let miniWin = null;
  let lastState = null;
  let isQuitting = false;

  const isOpen = () => !!miniWin && !miniWin.isDestroyed();

  const getUrl = () => {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    return devServerUrl
      ? `${devServerUrl}/mini.html`
      : 'http://localhost:27232/mini.html';
  };

  function savedPosition() {
    const x = store.get('miniPlayer.x');
    const y = store.get('miniPlayer.y');
    if (typeof x !== 'number' || typeof y !== 'number') return null;

    // Keep at least a grabbable sliver of the widget on some display —
    // monitors come and go between sessions.
    const visible = screen.getAllDisplays().some(({ bounds }) => {
      return (
        x + MINI_WIDTH > bounds.x + 60 &&
        x < bounds.x + bounds.width - 60 &&
        y + MINI_HEIGHT > bounds.y + 30 &&
        y < bounds.y + bounds.height - 30
      );
    });
    return visible ? { x, y } : null;
  }

  function defaultPosition() {
    const { workArea } = screen.getPrimaryDisplay();
    return {
      x: workArea.x + workArea.width - MINI_WIDTH - SCREEN_MARGIN,
      y: workArea.y + workArea.height - MINI_HEIGHT - SCREEN_MARGIN,
    };
  }

  function persistPosition() {
    if (!isOpen()) return;
    const [x, y] = miniWin.getPosition();
    store.set('miniPlayer.x', x);
    store.set('miniPlayer.y', y);
  }

  function enter() {
    if (isOpen()) {
      miniWin.show();
      miniWin.focus();
      return;
    }
    log('entering mini mode');

    const { x, y } = savedPosition() || defaultPosition();
    // Every handler below closes over `win`, never over the mutable `miniWin`,
    // so a fast exit/re-enter can't have the old window's teardown null out
    // the new one.
    const win = new BrowserWindow({
      x,
      y,
      width: MINI_WIDTH,
      height: MINI_HEIGHT,
      useContentSize: true,
      frame: false,
      transparent: true,
      hasShadow: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      show: false,
      title: 'Cassette Mini',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false,
      },
    });

    miniWin = win;

    win.setAlwaysOnTop(true, 'floating');
    win.setMenuBarVisibility(false);

    win.once('ready-to-show', () => {
      win.show();
      // Show the widget *before* hiding the main window so the desktop never
      // flashes empty.
      const main = getMainWindow();
      if (main && !main.isDestroyed()) main.hide();
    });

    win.webContents.on('did-finish-load', () => {
      if (lastState) win.webContents.send('mini:state', lastState);
    });

    win.on('moved', () => {
      if (miniWin === win) persistPosition();
    });

    win.on('close', e => {
      // WM close (Alt+F4) on the widget means "exit mini mode", never "quit".
      if (isQuitting) return;
      e.preventDefault();
      exit();
    });

    win.on('closed', () => {
      if (miniWin === win) miniWin = null;
    });

    win.loadURL(getUrl());
  }

  function exit() {
    const main = getMainWindow();
    if (main && !main.isDestroyed()) {
      main.show();
      main.focus();
    }
    if (!isOpen()) return;
    log('exiting mini mode');
    persistPosition();
    const closing = miniWin;
    miniWin = null;
    // destroy() skips the 'close' handler above — no re-entry.
    closing.destroy();
  }

  function toggle() {
    isOpen() ? exit() : enter();
  }

  function destroy() {
    isQuitting = true;
    if (!isOpen()) return;
    persistPosition();
    const closing = miniWin;
    miniWin = null;
    closing.destroy();
  }

  function relay(payload) {
    const { action, value } = payload || {};
    if (!action) return;
    if (action === 'expand') return exit();

    const main = getMainWindow();
    if (!main || main.isDestroyed()) return;

    if (action === 'seek') {
      if (typeof value === 'number')
        main.webContents.send('setPosition', value);
      return;
    }

    const channel = COMMAND_CHANNELS[action];
    if (channel) main.webContents.send(channel);
  }

  ipcMain.on('mini:player-state', (_, state) => {
    lastState = state;
    if (isOpen()) miniWin.webContents.send('mini:state', state);
  });

  ipcMain.on('mini:toggle', () => toggle());

  ipcMain.on('mini:command', (_, payload) => relay(payload));

  miniPlayer = { enter, exit, toggle, destroy, isOpen };
  return miniPlayer;
}
