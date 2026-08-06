# Design Brief + Implementation Handoff: Mini Player — "The Deck"

**Status**: ✅ Direction approved 2026-08-05 (user confirmed Route B: separate frameless
always-on-top remote-control window; design + engineering plan fully delegated).
**This document is the single handoff artifact** — it is written for a fresh session with
zero conversation context. Everything needed to implement is here or in the referenced files.

**Source documents**: [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md),
[shape-brief.md](shape-brief.md) (approved app-shell brief — the tape-compartment states
table there is the parent of this widget's states). Anywhere this brief diverges from
PRODUCT.md/DESIGN.md, they win.

---

## 0. What this is, and the one architectural decision that shapes everything

A tiny always-on-top desktop widget (~320×148) that looks and behaves like a cassette
deck: track label, two turning reels, a row of mechanical keys. It replaces the main
window on screen while music keeps playing. Think: Winamp windowshade / 网易云 mini bar,
but as a Studio Cassette object.

**Route B — remote control, not a second player.** The mini window is a *dumb terminal*:

- Audio never moves. Howler + `Player.js` live in the **main window's renderer**, which
  is **hidden but alive** (`win.hide()`, same as the existing minimize-to-tray flow).
- The mini window is a **separate, tiny Vite entry** (`mini.html`) — NOT the main SPA at
  a different route. This is non-negotiable: `Player.js` is Proxy-wrapped and
  auto-persists every property write to `localStorage` (`store/plugins/`), and its
  `_setIntervals` writes `playerCurrentTrackTime` every second. Two SPA instances =
  two Player instances fighting over the same localStorage keys + double audio loading.
  The mini entry imports **no Vuex, no router, no i18n, no Player.js**.
- State flows renderer(main) → main process (cached) → mini. Commands flow mini →
  main process → renderer(main), reusing the command channels the tray and MPRIS
  already use (`play`, `next`, `previous`, `like`, `setPosition`, …).

Why not piggyback on the existing MPRIS state channels: every useful send in
`src/utils/Player.js` (`metadata`, `playerCurrentTrackTime`, `seeked`) is gated on
`isCreateMpris` (**Linux only**, `src/utils/platform.js`). Cassette ships Windows builds
too, so the mini player gets its own ungated channel.

---

# Part I — Design Spec

## 1. Feature summary

A palm-sized cassette deck on the desktop. The user glances at it to see what's playing
and how far along the tape is; they reach for it to skip, pause, like, or wind. It lives
on top of other windows in peripheral vision, so it must be *quiet*: no pulsing, no
glow, no attention-seeking. Motion exists only where the machine is genuinely moving.

## 2. Primary user action

Glance → confirm what's playing → (sometimes) press a key. One-click prev/play/next
without finding the main window. Everything else (queue, search, browse) is explicitly
NOT here — the ⤢ key returns to the full app for that.

## 3. Design direction

- **Color strategy: Committed.** The widget as a whole is the now-playing event
  detached from the app shell, so it carries the Spotlight: the label strip wears
  full-bleed Tape Orange-Red. The shell and tape window stay housing graphite. Orange
  coverage ≈ 27% of the widget face — within the Spotlight Rule cap.
- **Scene sentence**: the same 11pm warm-2700K desk as shape-brief §3, but the widget
  floats over an IDE at full screen; it must read as *hardware sitting on glass* —
  opaque, massy, dark-first. (Light theme: out of scope for v1; the widget is
  graphite in both app themes, like real hardware doesn't re-skin.)
- **Anchor references**: Teenage Engineering OP-1 face (flat color-block modules);
  a TDK SA-90 cassette (label stripe + reel window topology); 网易云 mini bar
  (interaction envelope only, not the look).
- **On literal reels**: shape-brief resolved-decision #2 dropped reels *from the in-app
  tape compartment*. That scoping stands. The mini widget is the one surface where the
  literal object IS the product ask (user: "真的变成一个磁带播放器那样"), and its reels
  are instruments, not decoration: **spool radius measures progress, rotation states
  playback**. They pass the "meters must measure" rule. Do not "fix" this by removing
  them, and do not re-add reels to the in-app compartment.

## 4. Scope

- **Fidelity**: production-ready. This ships in the AppImage/NSIS builds.
- **Breadth**: one window + its wiring (entry button in the tape compartment, tray
  behavior, window lifecycle).
- **Interactivity**: fully interactive; every affordance below implemented.
- **Out of scope for v1**: light-theme variant, buffering indicator, queue access,
  volume slider UI (wheel gesture only), Windows-specific tuning beyond "it works",
  showing album artwork (deliberate — a real cassette shows a written label, not art;
  this also keeps the mini window from doing any network fetches).

## 5. Layout — the object

Logical size **320×148**, frameless, transparent window so the 10px-radius shell is a
real rounded object. Shell: `--housing-elev` fill, 1px `--housing-hairline` border.

```
╭──────────────────────────────────────────────╮
│ ████████████████████████████████████████████ │  LABEL STRIP · 40px
│ █  Track Name Goes Here              ······█ │  bg --tape-orange
│ █  Artist · Artist                         █ │  drag handle / dblclick=expand
│ ┌──────────────────────────────────────────┐ │
│ │   ◉╌╌╌╌╌╌╌╌╌  02:34 / 04:50  ╌╌╌╌╌╌╌╌◎   │ │  TAPE WINDOW · 68px
│ │  (full reel)     mono        (empty reel)│ │  bg --housing-base inset
│ └──────────────────────────────────────────┘ │  click/drag = seek ("wind")
│ ┌────────┬──────────┬────────┬──────┬──────┐ │
│ │   ⏮    │   ▶ / ⏸  │   ⏭    │  ♡   │  ⤢  │ │  KEY ROW · 40px
│ └────────┴──────────┴────────┴──────┴──────┘ │  flat mechanical keys
╰──────────────────────────────────────────────╯
```

### Label strip (40px)
- Background `--tape-orange`; horizontal padding 14px; vertically centered 2-line stack.
- **Title**: Barlow 600, 15px, color `--tape-orange-ink`, single line, `text-overflow:
  ellipsis`. On hover, if overflowing, one slow scroll pass (CSS animation ~6s linear,
  back to ellipsis) — none under reduced motion.
- **Artist line**: Barlow 500, 12px, single line ellipsis. Color must NOT be a
  transparent white (washed-out gray-on-color ban): add token
  `--tape-orange-ink-dim: oklch(27% 0.06 38)` — a dark ink of the orange's own hue,
  ≥4.5:1 on the 64%-L orange. Add it next to the other tape tokens in the token file.
- The strip is the **drag region** (`-webkit-app-region: drag`). Double-click → expand
  back to the main window.

### Tape window (68px)
- Inset plane: `--housing-base` fill, 1px `--housing-hairline` border, 6px radius,
  10px margin from shell edges.
- **Two reels** (inline SVG, one component used twice, mirrored):
  - Fixed **hub**: 28px outer ring, stroke `--ink-soft`, with 3 hub notches (small
    rects rotated 120° apart) so rotation is visible.
  - **Spool** disc behind the hub: fill `--ink-faint`. Radius maps to tape remaining:
    left reel `r = 14 − 8·progressRatio` px, right reel `r = 6 + 8·progressRatio` px.
    Radius changes get `transition: r 1s linear` (matches the 1 Hz state feed; SVG
    `r` is animatable via CSS on Chromium — set it as a CSS custom property or
    presentation attribute style).
  - **Rotation**: the whole reel group spins `2s linear infinite` while `playing`;
    `animation-play-state: paused` otherwise. Under `prefers-reduced-motion`:
    `animation: none` (radii still measure — the instrument still works).
- **Timecode** centered between reels: `--font-mono`, 12px,
  `<elapsed>` in `--ink-strong` + ` / <total>` in `--ink-soft`. (JetBrains Mono is not
  bundled — the `--font-mono` stack falls back to system mono; acceptable.)
- **Seek**: the whole tape window is a seek surface — pointer-down + drag maps x →
  progress ("winding the tape"); on release, send one seek command. While dragging,
  timecode shows the scrub target and reels' radii preview the target. Cursor:
  `ew-resize`. `-webkit-app-region: no-drag`.

### Key row (40px)
Five flat keys in one row, separated by 1px `--housing-hairline` verticals, with a
hairline across the top of the row (the key bed). Grid columns `1fr 1.4fr 1fr 1fr 1fr`
(play/pause is the wide key, like real decks). All keys `no-drag`.

- Icons 16px, reuse path data from `src/assets/icons/`: `previous.svg`, `play.svg`,
  `pause.svg`, `next.svg`, `heart.svg`, `heart-solid.svg`, `fullscreen.svg` (⤢).
  Inline the SVGs in the component — do NOT pull in `virtual:svg-icons-register` or
  `SvgIcon.vue` (keeps the entry tiny and decoupled).
- Default: icon `--ink-mid` on transparent. Hover: bg `--housing-divider`. Active
  (pressed): bg `--housing-divider` + `translateY(1px)` — a key press, not a glow.
  Focus-visible: 1px inset ring `--tape-orange`.
- **Play key**: shows ⏸ while playing, and while playing its icon is `--tape-orange`
  (the transport is the active event). Paused: ▶ in `--ink-strong`.
- **Like key**: liked → `heart-solid` in `--tape-orange`; not liked → `heart` in
  `--ink-mid`.
- **⤢ key**: returns to the main window (exits mini mode).
- Transitions: `--motion-fast` `--ease-out` on background/color only.

## 6. Key states

| State | Treatment |
|---|---|
| **Playing** | Full-saturation label, reels spin, timecode advances, ⏸ shown. |
| **Paused** | Label stays saturated (consistent with in-app compartment), reels frozen, ▶ shown. |
| **Idle** (nothing loaded: `enabled: false` or `track: null`) | Label strip drops to ~50% chroma (overlay `--housing-elev` at 55% opacity on the strip, or a dedicated desaturated var); title replaced by mono stamp `PICK A TRACK`; artist line empty; reels static at equal mid radius (10px); timecode `--:-- / --:--`; transport + like keys disabled (`--ink-faint`, no hover); ⤢ stays live. |
| **Disconnected** (no state received yet after open) | Same as Idle. The cached-state push on open (Part II §3) makes this a <100ms flash at worst. |
| **Reduced motion** | No reel rotation, no marquee. Radii/timecode still update. All `--motion-*` tokens already collapse to 0ms globally. |

No loading spinners, no skeletons — the widget is state-driven from a live feed.

## 7. Interaction model (complete)

| Gesture | Result |
|---|---|
| Drag label strip (or any shell dead-zone) | Move window |
| Double-click label strip | Exit mini mode (main window back) |
| ⏮ / ▶⏸ / ⏭ / ♡ / ⤢ keys | previous / play-pause / next / like / exit mini |
| Click or drag in tape window | Seek |
| Scroll wheel anywhere on widget | Volume ± (existing `increaseVolume` / `decreaseVolume` channels, 10% steps) |
| `Space` (window focused) | play/pause |
| `←` / `→` | previous / next |
| `Esc` | Exit mini mode |
| WM close (Alt+F4) on the widget | Exit mini mode — **never** quits the app |

Entering mini mode: a new key in the main window's tape compartment (right control
cluster). Exiting always = destroy mini window + `mainWindow.show()`.

## 8. Content requirements

- Mono stamps: `PICK A TRACK`, `--:-- / --:--`, `MM:SS / MM:SS`.
- Tooltips (`title` attr) on keys reuse existing locale keys where they exist; new key
  `player.miniMode` ("Mini mode" / "迷你模式" / "迷你模式" / "Mini mod") added to all
  four locales `src/locale/lang/{en,zh-CN,zh-TW,tr}.js` for the tape-compartment
  entry button. The widget itself has no translatable copy (stamps are silkscreen
  English by the CJK-labels resolved decision in shape-brief §10.1).

---

# Part II — Engineering Plan

## 1. IPC protocol (all new channels prefixed `mini:`)

### State: renderer(main) → main process → mini

Channel `mini:player-state` (renderer → main), relayed as `mini:state` (main → mini).
Fire-and-forget, ~1 Hz + event-driven; main process **always caches the latest
snapshot** and pushes it to the mini window on `did-finish-load`.

```js
{
  playing: boolean,
  enabled: boolean,          // Player._enabled — false ⇒ Idle state
  progress: number,          // seconds
  duration: number,          // seconds (Player.currentTrackDuration)
  isLiked: boolean,
  repeatMode: 'off'|'on'|'one',   // carried for future use, not shown in v1
  shuffle: boolean,               // carried for future use, not shown in v1
  volume: number,            // 0..1, not shown in v1
  track: { id, name, artists /* 'A / B' joined string */, album } | null
}
```

### Commands: mini → main process → renderer(main)

Channel `mini:command`, payload `{ action, value? }`. The main process relays onto the
**existing** channels already handled in `src/electron/ipcRenderer.js:24-79`:

| action | relayed as (`mainWindow.webContents.send`) |
|---|---|
| `play` | `'play'` |
| `next` | `'next'` |
| `previous` | `'previous'` |
| `like` | `'like'` |
| `seek` (value: seconds) | `'setPosition', value` |
| `volumeUp` / `volumeDown` | `'increaseVolume'` / `'decreaseVolume'` |
| `expand` | handled in main process: exit mini mode |

### Mode toggle

Channel `mini:toggle` (renderer → main): enter/exit mini mode. Sent by the new tape
compartment button; exit is also triggered by `expand`, Esc, dblclick, WM-close.

## 2. Files to create

### `mini.html` (repo root, sibling of `index.html`)
Minimal shell: `<meta name="viewport">`, `html,body{background:transparent;margin:0;
overflow:hidden}`, `<div id="mini"></div>`, `<script type="module"
src="/src/mini/main.js">`. No fonts/CSS links (the entry imports its own SCSS).

### `src/mini/main.js`
```js
import { createApp } from 'vue';
import MiniPlayer from './MiniPlayer.vue';
import './mini.scss';
createApp(MiniPlayer).mount('#mini');
```
Nothing else. No store, no router, no i18n, no Player.

### `src/mini/MiniPlayer.vue`
The whole widget (Options API, per project convention). Talks to
`window.electronAPI` (the generic `send`/`on` bridge from `src/preload.js` — reused
as-is, no preload changes needed). Subscribes to `mini:state` on created; local `state`
object drives everything. Keyboard handlers on `window`. Wheel handler throttled
(~150ms) → volume commands. Null-safe: renders Idle until the first snapshot lands.

### `src/mini/mini.scss`
Imports the shared token partial (below), sets `body { background: transparent }`,
widget-local styles. Uses only existing tokens + the new `--tape-orange-ink-dim`.

### `src/assets/css/_tokens.scss` (extraction refactor)
Move from `global.scss` into this partial: the three needed `@font-face` blocks
(Barlow Regular/Medium/SemiBold — leave Bold/ExtraBold/Black in global.scss or move
all six, implementer's call), the whole `:root { … }` token block
(`global.scss:50-99`), the `--shell-pad-x` media query, and the reduced-motion
override (`global.scss:102-112`). `global.scss` then `@import './tokens';` at the
top — **zero visual diff for the main app** (verify with a build). `mini.scss`
imports the same partial. Add `--tape-orange-ink-dim: oklch(27% 0.06 38)` here.

### `src/electron/miniPlayer.js` (main process)
```js
export function initMiniPlayer(getMainWindow, store) { … returns { toggle, exit, destroy, isOpen } }
```
Owns: window creation/destruction, mode switching, state cache + relay, position
persistence, and its own `ipcMain.on` registrations (`mini:player-state`,
`mini:toggle`, `mini:command`).

BrowserWindow options:
```js
{
  width: 320, height: 148, useContentSize: true,
  frame: false, transparent: true, hasShadow: false,
  resizable: false, maximizable: false, minimizable: false,
  fullscreenable: false, skipTaskbar: true,
  alwaysOnTop: true,             // set level via win.setAlwaysOnTop(true, 'floating')
  show: false,                   // show on ready-to-show
  title: 'Cassette Mini',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),   // same preload as main window
    nodeIntegration: false, contextIsolation: true,
    backgroundThrottling: false,
  },
}
```
- Load `${process.env.VITE_DEV_SERVER_URL}/mini.html` in dev, else
  `http://localhost:27232/mini.html` (the Express static server in
  `background.js:170-190` serves it from `dist/`; the SPA fallback never triggers
  because the file exists). Do not auto-open devtools for this window.
- Position: restore from `store.get('miniPlayer.x'/'miniPlayer.y')`; validate against
  `screen.getAllDisplays()` bounds (mirror the pattern at `background.js:218-255`);
  default = primary display `workArea` bottom-right minus 24px margins. Persist on
  `'moved'`.
- Enter mini: create window; on `ready-to-show` → `miniWin.show()` then
  `mainWindow.hide()` (in that order — no flash of empty desktop). Push cached state
  on `did-finish-load`.
- Exit mini: `mainWindow.show()` then destroy mini window.
- Mini `'close'` event (WM close): `preventDefault` is unnecessary — intercept via
  `close` → if app not quitting, treat as exit-mini (restore main first, then let it
  close). Guard a `isAppQuitting` flag set from `before-quit` so app shutdown isn't
  blocked.
- Relay `mini:command` per the table in §1. Unknown actions: ignore.

## 3. Files to modify

| File | Change |
|---|---|
| `vite.config.js` | Add `build.rollupOptions.input = { main: resolve('index.html'), mini: resolve('mini.html') }`. Web build gains an unused `mini.html` — harmless. |
| `src/background.js` | (a) Add `backgroundThrottling: false` to the main window `webPreferences` (`:210-214`) so the hidden renderer keeps its 1 Hz pump honest. (b) After `initIpcMain(...)` (`:410`), call `this.miniPlayer = initMiniPlayer(() => this.window, this.store)`. (c) In the quit path(s), `this.miniPlayer.destroy()` / set the quitting flag. (d) Tray "show main window" action while mini is open should route through `miniPlayer.exit()` — find the tray's toggle-window click in `src/electron/tray.js` and guard it. |
| `src/utils/Player.js` | Add `_sendMiniState()` building the §1 snapshot (guard `process.env.IS_ELECTRON !== true` → return; null-guard `currentTrack`). Call it from: the 1 Hz tick in `_setIntervals` (`:215-229`); `sendSelfToIpcMain()` (`:874-882` — already fires ungated on play/pause/like); after metadata update in `_updateMediaSessionMetaData` (`:640-645`, **outside** the `isCreateMpris` gate); `switchRepeatMode` / `switchShuffle` (`:884-901`, outside their gates); `set volume` (`:136`). Artists: join from `track.ar ?? track.artists` names with `' / '`. |
| `src/components/Player.vue` | New key in the RIGHT control cluster (near `.ctl-lyrics`, `:182-186`): `v-if="isElectron"`, `:title="$t('player.miniMode')"`, inline or sprite icon (`fullscreen-exit` reads well as "shrink"), click → `window.electronAPI?.send('mini:toggle')`. Match the existing `.ctl.ctl-aux` styling exactly. |
| `src/locale/lang/{en,zh-CN,zh-TW,tr}.js` | Add `player.miniMode`. |

No changes needed to: `preload.js` (generic bridge), `electron-builder.yml`
(`dist/**/*` already ships `mini.html` + the mini chunks), `scripts/build-electron.js`
(main-process esbuild follows the import graph from `background.js`).

## 4. Edge cases & hazards (read before coding)

1. **localStorage double-writer** — the reason for the separate entry. If you find
   yourself importing `@/store` or `@/utils/Player` from `src/mini/**`, stop; that
   path is forbidden.
2. **Transparent window on Linux**: fine on Pop!_OS X11 (compositor present). Keep
   `hasShadow: false` (transparent+shadow artifacts). If transparency ever fails,
   the widget degrades to square corners — acceptable, don't build a fallback.
3. **Hidden-window throttling**: audio-playing renderers aren't throttled, but a
   hidden+paused renderer is — hence `backgroundThrottling: false` on the main
   window. Without it, resume-from-mini can lag.
4. **Don't gate the new sends on `isCreateMpris`/`isCreateTray`** — that's the exact
   trap that made existing state Linux-only.
5. **Seek echo**: after sending `seek`, the next 1 Hz snapshot may still carry the
   old progress. Mini should optimistically show the target and let the following
   snapshot win. No debounce war — one send per drag release.
6. **Window recreation on macOS activate**: always go through `getMainWindow()`,
   never capture the window reference at init.
7. **Vue Options API + Prettier config** (single quotes, no semicolon omission,
   2-space, LF) — run `yarn prettier` before finishing.

## 5. Verification checklist

- [ ] `yarn build` (web) and `yarn build:electron` both pass; `dist/mini.html` exists.
- [ ] Main app renders pixel-identical after the `_tokens.scss` extraction.
- [ ] `yarn electron:dev`: tape-compartment key → main hides, Deck appears bottom-right.
- [ ] Keys: ⏮ ▶⏸ ⏭ ♡ all work; ♡ reflects like state within 1s; play key icon swaps.
- [ ] Reels: spin while playing, freeze on pause, left shrinks / right grows over a
      track; `prefers-reduced-motion` kills rotation but radii still move.
- [ ] Seek by dragging the tape window; timecode scrubs; audio jumps on release.
- [ ] Scroll wheel changes volume (verify in main window after expanding).
- [ ] Drag the label strip to move; position survives exit/re-enter and app restart.
- [ ] Dblclick label, ⤢ key, Esc, and WM-close all restore the main window; app never
      quits from the widget.
- [ ] Idle state: fresh profile (no track) shows `PICK A TRACK`, disabled transport.
- [ ] Track with CJK title ellipsizes; hover-marquee scrolls once.
- [ ] Tray interactions while in mini mode restore the main window cleanly.
- [ ] `yarn lint` clean. Then `ypm-update --no-pull` to install and smoke-test the
      AppImage (per CLAUDE.md workflow).

## 6. Future (explicitly deferred — do not build now)

Buffering stamp (needs a Howler load-state signal Player.js doesn't expose yet),
repeat/shuffle indicators on the widget, volume slider popover, opacity-on-hover
"ghost mode", light-theme shell, Windows acrylic checks, global shortcut for toggle.

---

# Addendum 2026-08-06 — Lyric strip ("the VFD display")

**Status**: ✅ approved + implemented. An optional fourth row showing the current
lyric line, styled like the fluorescent display on a real deck.

## Design

- **Geometry**: toggling lyrics on grows the deck 148 → **178px** (+30px = 24px
  panel + 6px gap), inserted between the tape window and the key row. The
  **top edge never moves** — the label strip and tape window stay put and the
  transport bay slides down, like a drawer opening. (Originally bottom-fixed
  with the body lifting; changed 2026-08-06 because X11 move+resize combos
  flash the old frame at the new origin — a visible spring bounce. A resize
  that keeps the top-left corner fixed repaints cleanly.)
- **Panel**: same inset plane as the tape window (`--housing-base`, 1px
  `--housing-hairline`, 6px radius, `margin: 0 10px`). One line, `--font-mono`
  11px `--ink-strong`, centered, ellipsis on overflow. Mono stamps (10px,
  0.16em tracking, `--ink-faint`): `NO LYRICS` (track has no lrc), `· · ·`
  (interlude / before first line / lyrics still loading / idle).
- **Toggle**: a silkscreen `LRC` stamp in the tape window's bottom-right corner
  (`--ink-faint`, hover `--ink-mid`, active `--tape-orange`), plus a right-click
  context menu (Lyrics checkbox / Back to Cassette). Persisted as
  `miniPlayer.lyricsOn`; window is created at the right height next time.
- **Motion**: open/close animate deck height and slot height together,
  `--motion-base` with a component-local `--ease-door:
  cubic-bezier(0.4, 0, 0.2, 1)` — a symmetric motor-driven settle; the
  front-loaded `--ease-out` read as spring-ejected here. No bounce. Line
  changes crossfade (`--motion-fast`, Vue transition out-in). Reduced motion:
  all collapse to 0ms via the token overrides.

## Engineering

- **Window bounds can't animate smoothly (X11), but the window is transparent**,
  so bounds always jump in one frame while CSS animates inside them:
  - *Open*: main process grows bounds instantly (new pixels transparent),
    persists, then sends `mini:lyrics-mode {on:true, animate:true}` → renderer
    waits until `window.innerHeight` actually reaches the open height (rAF
    poll, 250ms deadline) before playing the expand — starting early would
    animate clipped inside the old viewport and pop when the resize lands.
  - *Close*: main sends `mini:lyrics-mode {on:false, animate:true}` → renderer
    collapses, then replies `mini:command {action:'lyricsCollapsed'}` → main
    shrinks bounds. Fallback shrink timer (600ms) if the reply never comes; the
    renderer reads its real `transitionDuration` so reduced-motion closes
    immediately.
  - Both directions keep `y` (the top edge) fixed; growing only shifts `y` up
    when the display's workArea bottom forces a clamp. `resizable:false` is
    toggled around `setBounds` (`applyBounds`) because some platforms block
    programmatic resizes otherwise.
- **Data**: `Player.js#_sendMiniLyrics(track)` (called from
  `_updateMediaSessionMetaData`, ungated like the rest of the mini feed) fetches
  via the Dexie-cached `getLyric`, parses with `lyricParser`, and sends
  `mini:lyrics {id, lines: [{time, content}]}`. The id guards against a slow
  fetch labeling a later track. Main process caches the latest payload and
  replays it (plus `mini:lyrics-mode {animate:false}`) on `did-finish-load`.
- **Current line**: the renderer interpolates a local clock
  (`progress + elapsed-since-snapshot` while playing, 250ms ticker only while
  the strip is open) and binary-searches the last line with `time <= t` — line
  switches land within ~100ms instead of the 1 Hz snapshot granularity.
  Scrubbing the tape window previews the line at the scrub target.
