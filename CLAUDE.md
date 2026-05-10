# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YesPlayMusic — a third-party Netease Cloud Music (网易云音乐) player. Runs as both a web app and an Electron desktop client (macOS/Windows/Linux). Built with Vue 3 + Vuex 4 + Vue Router 4 + Howler.js + Vite + Electron 41.

## Design Context

UI work is governed by these root files (read before any visual change):

- [`PRODUCT.md`](PRODUCT.md) — strategic: register=`product`, users, brand personality, anti-references, design principles.
- [`DESIGN.md`](DESIGN.md) — visual system: **currently SEEDED** (placeholder tokens). Re-run `/impeccable document` once real tokens land in code to capture them.
- [`.impeccable/shape-brief.md`](.impeccable/shape-brief.md) — **approved app-shell redesign brief** (Studio Cassette). Mid-fi spec, ASCII wireframes, token plan, interactions. **Ready for `/impeccable craft` implementation.**

**Creative North Star**: *"The Studio Cassette"* — a piece of dedicated audio gear on a developer's desk. Muted neutral housing with a single saturated **Tape Orange-Red** block worn by the currently-active region (the bottom 88px tape compartment). Two-voice type (sans speaks, mono measures). No pure `#000` / `#fff`. Motion is response, not performance. Dark-first.

**Anti-references**: Apple Music clone (backdrop-blur navbar, sky-blue accent), AI SaaS slop (purple gradients + Inter + nested cards), overwrought gamer UI (glow borders, scanlines).

**Active redesign scope** (per shape-brief): Navbar (drop central tab), Library (drop "*** 的音乐库" title; reorganize into Side A / Side B; trim MV + CloudDisk + PlayHistory tabs), detail pages, Lyrics fullscreen (no more Apple Music–style backdrop blur), Settings (token-swap only). Personal FM removal: ✅ done. Next step: `/impeccable craft library` (or `/impeccable craft app-shell` for the full sandwich).

For design tasks prefer `/impeccable <command>` — `craft`, `critique`, `polish`, `bolder`, `quieter`, etc. — so PRODUCT.md and DESIGN.md auto-load.

## Commands

```bash
# Install dependencies (use yarn, not npm)
yarn install

# Copy .env.example to .env before first run
cp .env.example .env

# Development
yarn dev                   # Web dev server (Vite)
yarn electron:dev          # Electron dev
yarn netease_api:run       # Run Netease API server standalone (needed for web dev)

# Build
yarn build                 # Web production build (Vite, history router)
yarn build:electron        # Renderer build for Electron (hash router, IS_ELECTRON=true)
yarn electron:build-main   # Electron main process build (esbuild → dist-electron/main.js)

# Local install (Linux) — build AppImage and replace ~/Applications/YesPlayMusic.AppImage
ypm-update                 # git pull + build:electron + electron:build-main + electron-builder + install
ypm-update --no-pull       # build current working tree without pulling
# Script lives at ~/.local/bin/ypm-update; runs `npx electron-builder --linux AppImage`.
# After finishing a feature/fix that should land in the desktop app, run `ypm-update`
# (or `ypm-update --no-pull` if changes are still uncommitted) so the installed AppImage
# picks up the new code on next launch.

# Code quality
yarn lint                  # ESLint (vue/recommended + prettier)
yarn prettier              # Format all src/ with Prettier
```

Node.js version requirement: >=18 (`engines` field in package.json). Electron 41 bundles Node 24 internally.

## Architecture

### Entry Points
- **Web:** `src/main.js` → mounts Vue app
- **Electron main process:** `src/background.js` → creates BrowserWindow, starts embedded API server on port 10754, sets up IPC/tray/menu/shortcuts

### Core Layers

| Layer | Location | Notes |
|-------|----------|-------|
| Views (pages) | `src/views/` | Lazy-loaded route components |
| Components | `src/components/` | Reusable UI (Player, Navbar, TrackList, Modals) |
| Router | `src/router/index.js` | Hash mode for Electron, history for web. Meta flags: `keepAlive`, `savePosition`, `requireLogin`, `requireAccountLogin` |
| State (Vuex) | `src/store/` | `state.js`, `mutations.js`, `actions.js`. Plugins in `store/plugins/` persist to localStorage and sync to Electron main process |
| API | `src/api/` | One module per domain: `track.js`, `playlist.js`, `user.js`, `auth.js`, `artist.js`, `album.js`, `lastfm.js`, `others.js` |
| Player engine | `src/utils/Player.js` | ~1000-line class using Howler.js. Manages queue, shuffle/repeat, Personal FM mode. Wrapped in Proxy for auto-persistence to localStorage |
| Electron IPC | `src/electron/` | `ipcMain.js` / `ipcRenderer.js` for cross-process communication; `tray.js`, `menu.js`, `mpris.js` (Linux), `globalShortcut.js` |
| Data cache | `src/utils/db.js` | Dexie (IndexedDB) for caching track details & lyrics |
| HTTP client | `src/utils/request.js` | Axios instance, injects `MUSIC_U` cookie, 15s timeout |

### State Shape (Vuex store)

Key top-level state sections:
- `settings` — user preferences (language, theme, music quality, shortcuts, etc.)
- `data.user` — logged-in user info
- `liked` — user's liked songs/playlists/albums/artists/MVs/cloudDisk
- `player` — the Player.js instance (Proxy-wrapped)

### Authentication
Three login methods: phone, email, QR code. Cookie-based (`MUSIC_U`). Two auth levels: loose login (guest/phone) vs account login (full account). Managed in `src/utils/auth.js` and `src/api/auth.js`.

### Path Alias
`@/` maps to `src/` (configured in `jsconfig.json` and `vite.config.js`).

## Code Style

- Prettier: single quotes, trailing commas (es5), 2-space indent, no semicolons omission, arrow parens "avoid", LF line endings
- ESLint: `plugin:vue/recommended` + `@vue/prettier`
- Vue 3 Options API throughout (no Composition API)
