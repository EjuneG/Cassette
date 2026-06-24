# Design Brief: Cassette — App Shell Redesign

**Status**: ✅ Approved 2026-05-10. Open Questions resolved (see Section 10). Hand-off-able to `/impeccable craft`.

**Source documents**: [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md). All decisions in this brief are consistent with those — anywhere they diverge, this brief is wrong and they win.

**Visual probe**: skipped — Claude Code has no native image generation. Direction is communicated via ASCII wireframes + named reference links.

---

## 1. Feature Summary

Redesign the entire Cassette app shell — Navbar, Library home, detail pages (Playlist / Album / Artist), Lyrics fullscreen, Settings (token-swap only) — to swap the Apple Music–derived visual language for the **Studio Cassette** aesthetic established in `DESIGN.md`. The defining architectural move is replacing the current bottom-bar Player with a **compact "tape compartment"** — a slim ~88px region wearing the saturated Tape Orange-Red across the full width. **Mass and color carry the cassette metaphor**, not literal reel imagery. The Library home is reorganized around a "Side A / Side B" cassette metaphor and trimmed of unused tabs.

## 2. Primary User Action

Open the app, see at a glance **what is currently playing** and **what is in the queue**, and either (a) keep that going — passive listening, the 80% case — or (b) pick a new track from Liked Songs / Recently Played / a known playlist. The interface must reward both modes equally; passive listening is not a degenerate state, it is the dominant one.

## 3. Design Direction

- **Color strategy**: Committed (per `DESIGN.md`). Warm-tinted neutral housing across ~70% of surface; saturated Tape Orange-Red worn by the tape compartment region exclusively. The Spotlight Rule from `DESIGN.md` is enforced everywhere.

- **Theme scene sentence**: *"An indie game developer at their desk on Pop!_OS at 11pm; ambient light is a warm 2700K bulb behind the monitor, IDE on the main display, YPM on a side display ~30° offset. Both light and dark themes must work, but **dark is the default** and the optimization target."*
  → This forces dark-first design. The tape compartment must read as the visual anchor against a warm-graphite housing.

- **Anchor references** (concrete, not adjectives):
  1. **Teenage Engineering OP-1 face** ([teenage.engineering](https://teenage.engineering)) — for the modular color-block organization, where each functional region wears its own block of saturation.
  2. **Doppler iOS** (search "Doppler music app" on Mobbin) — for warm-neutral list density, mono timecodes, and the calm of a player that is not trying to entertain you.
  3. **Marvis Pro Player** (search "Marvis" on Mobbin) — for info-rich rows on cool neutral backgrounds and the willingness to be dense without feeling cramped.

## 4. Scope

- **Fidelity**: **Mid-fi spec** — ASCII wireframes + token values + key interactions. Hand-offable to `/impeccable craft` for actual Vue/SCSS implementation. Not production code at this stage.
- **Breadth**: whole app shell. **In scope**: Navbar, Library home, Playlist detail, Album detail, Artist detail, Lyrics fullscreen, Settings. **Out of scope** (will reuse existing structure with new tokens, no shape work): MV viewer, login flows, Personal FM, search results page, dailyTracks.
- **Interactivity**: described, not prototyped. Code lands in craft.
- **Time intent**: thorough but not perfectionist; goal is a brief good enough to ship from, not a decorative deliverable.

## 5. Layout Strategy

The app shell is a **vertical sandwich** of three named regions:

```
┌─────────────────────────────────────────────────────────┐
│  TOP STRIP        ← slim, ~48px                          │  ← housing
│  〈 〉  [⌕ search]                              ◉ avatar  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  MIDDLE PLANE     ← the active surface                   │  ← housing
│  (Library / Playlist / Album / Artist / Settings)        │
│  Marvis-density (~64px rows)                             │
│                                                          │
│  ...                                                     │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████████████ │  ← spotlight
│ █ ▣  Track Name              ━━━━━━━━━━━━━━━━━━━━━━━━━ █ │     (Tape
│ █    Artist · Album    〈〈  ▶  〉〉    ▼ Q  〇 vol  ⛯ ⤡ █ │      Orange-
│ ████████████████████████████████████████████████████████ │      Red) ~88px
└─────────────────────────────────────────────────────────┘
```

**Why this works**:
- The eye reads this as housing-housing-event — exactly the Spotlight Rule.
- The tape compartment is *always* the visually heaviest element; it doesn't compete with content above it for attention.
- Top strip stays thin because there's no central nav (single-tab app).

### Library home — Side A / Side B reorganization

```
┌──────────────────────────────────────────────────────────┐
│ ─── SIDE A ─────────────────────────────────────────────│ ← labeled
│                                                          │   silkscreen
│ ┌──────── Liked Songs ────────┐  ┌── Recently Played ──┐│
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │ ░ Track 1   02:34   ││
│ │ ░ rotating lyric snippet ░  │  │ ░ Track 2   03:12   ││ ← Marvis
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │ ░ Track 3   04:01   ││   density
│ │ 142 TRACKS · 8h 24m   ▶     │  │ ░ Track 4   02:48   ││
│ └─────────────────────────────┘  └─────────────────────┘│
│                                                          │
│ ─── SIDE B ─────────────────────────────────────────────│
│                                                          │
│ [Playlists]  Albums   Artists      ← drawer pull tabs    │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│ │░░░░│ │░░░░│ │░░░░│ │░░░░│ │░░░░│                     │
│ │░░░░│ │░░░░│ │░░░░│ │░░░░│ │░░░░│                     │
│ └────┘ └────┘ └────┘ └────┘ └────┘                     │
│  Name   Name   Name   Name   Name                        │
└──────────────────────────────────────────────────────────┘
```

- **Side A** = high-frequency surface: Liked Songs hero (left ~55%) + Recently Played (right ~45%). Always visible at the top of the page.
- **Side B** = library proper: a labeled drawer-pull row [Playlists] / Albums / Artists. Only one drawer's content shows at a time. Default = Playlists.
- **Trimmed**: MV, CloudDisk are **dropped** from the Library shell. PlayHistory **promoted** into Recently Played in Side A (consolidates its function).
- The current `library.vue` `<h1>{nickname}的音乐库</h1>` title is **deleted**. Single-page apps don't need their own title.

### Detail pages (Playlist / Album / Artist)

```
┌──────────────────────────────────────────────────────────┐
│ ┌────────┐  Playlist Title                               │
│ │░░░░░░░░│  By Artist · Updated 2026-04-15               │ ← cover
│ │ COVER  │  142 TRACKS · 8h 24m · FLAC · 1411kbps        │   stays in
│ │░░░░░░░░│  ╔═══════╗  [♡ liked]  [⋯]                   │   its frame
│ └────────┘  ║ ▶ PLAY ║                                   │
│                                                          │
│ 01  Track Name                  Artist          02:34    │
│ 02  Track Name                  Artist          03:12    │ ← tracklist
│ 03  Track Name                  Artist          04:01    │   Marvis
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

- Cover art lives in a **fixed 192×192 frame**. **Never** blurred into the background, **never** sampled to color the surrounding UI. The Cover-Stays-In-The-Frame Rule is enforced.
- Mono stamps for metadata (track count, duration, codec).
- One primary action button (PLAY) wears Tape Orange-Red — an exception to the "spotlight only on tape compartment" because this *is* an active intent moment. Cap one orange button per page above the fold.
- Tracklist same density and shape as Recently Played in Library.

### Lyrics fullscreen

```
┌──────────────────────────────────────────────────────────┐
│ ┌────┐  Track Name                          02:34/04:50  │ ← mono
│ │COVR│  Artist                                    ─ ╳    │   timecode
│ └────┘                                                    │
│                                                          │
│         line of lyrics that just played                  │
│         line of lyrics that just played                  │
│                                                          │
│      ████ CURRENT LINE OF LYRICS, BIGGER ████            │ ← wears
│                                                          │   Spotlight
│         line of lyrics coming next                       │
│         line of lyrics coming next                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Fullscreen takeover (existing pattern) but **no backdrop blur**, **no color extraction from cover**, **no aurora background**. Housing graphite background, lyrics in housing-cream text, current line in saturated Tape Orange-Red.
- Cover art is a small fixed frame top-left (~64×64), not a giant centerpiece.
- The current line is the spotlight; everything else is muted housing context.

### Settings

- Keep current structure (categories list + control panels).
- Token swap: backgrounds become tinted warm neutrals; sliders use ash track + Tape Orange-Red filled portion; toggles use the same orange when on.
- No layout changes here.

## 6. Key States

### Library home

| State | Treatment |
|---|---|
| **Not logged in** | Centered ash housing block: "Sign in to load your library" + sign-in button. No skeleton, no decorative illustration. |
| **Loading** | Skeleton shimmer using ash neutral (housing tone shifted +5% lightness). No spinner. |
| **Empty (logged in but no liked songs)** | Liked Songs card shows "No tracks yet. Liked songs appear here." in body sans, ash text. Recently Played section hides entirely. Side B still renders (user may have playlists without liked songs). |
| **Error** | Inline ash housing block at the failed region: mono error code + "retry" link. Don't tank the whole page. |
| **Default** | As wireframed. |

### Tape compartment

| State | Treatment |
|---|---|
| **Idle (queue empty)** | Compartment chroma reduced ~50%, controls greyed, mono prompt "Pick a track" replaces the seek bar. Still visible — the cassette is "loaded but not running". |
| **Playing** | Full saturation. Seek bar advances. Play button shows pause icon. |
| **Paused** | Full saturation. Seek bar static. Play button shows play icon. |
| **Buffering** | Tiny mono `BUFFERING` stamp appears next to track name. Seek bar shows indeterminate ash shimmer. |
| **Reduced motion preference** | No additional treatment needed — there is no decorative motion in this design. Cross-fades reduce to instant when `prefers-reduced-motion` is set. |

### Lyrics

| State | Treatment |
|---|---|
| **No lyrics for this track** | Centered ash text: "No lyrics for this track." in body sans. |
| **Loading lyrics** | Skeleton lines (ash, ~3 visible) until lyrics arrive. |
| **Default** | As wireframed. |

### Detail pages

| State | Treatment |
|---|---|
| **Loading** | Cover frame is ash placeholder; metadata lines are skeleton bars; tracklist shows 5 skeleton rows. |
| **Empty playlist / album** | Header renders normally; tracklist area shows centered ash "No tracks." |
| **404 / not-found** | Replace whole content area with mono "TRACK 404 — playlist not found" + back link. No marketing 404 art. |

## 7. Interaction Model

### Navigation
- Click track row → plays it (replaces current track, queue rebuilt from context).
- Click cover thumbnail in track row → opens album detail.
- Click artist name in track row → opens artist detail.
- Click `[⋯]` on a row → context menu: add to queue, add to playlist, like, copy share link.

### Tape compartment
- Click play/pause button → toggle play/pause.
- Click seek bar (top of compartment) → seek (drag to scrub, click to jump).
- Click cover thumbnail → expand to lyrics fullscreen.
- Click `〈〈` / `〉〉` → previous/next track.
- Click queue icon (right edge) → opens queue drawer (slides up from below the compartment).
- Click volume icon → opens slim volume slider popover.

### Library Side A/B
- Click "SIDE B" drawer-pull tab labels (`Playlists` / `Albums` / `Artists`) → switches the visible drawer content. Only one shows at a time. Active label wears underline (1px ash) — no orange (orange is reserved for active *playback*, not active *tab*).
- Hover row → background tone shifts +3% lightness (no scale, no shadow).

### Keyboard
- `Space` → play/pause (existing).
- `←` / `→` (when no input focused) → previous / next track.
- `↑` / `↓` (when in tracklist) → navigate rows.
- `Enter` → play focused row.
- `/` → focus search.
- `L` → toggle lyrics fullscreen.

### Motion specifics
- All state transitions: **180–250ms ease-out**, never elastic, never bounce.
- Tape compartment idle → playing chroma transition: **300ms ease-out** color fade.
- Page transitions between routes: **none** — instant. (PRODUCT.md "quiet by default".)
- Lyrics fullscreen open/close: 240ms ease-out vertical slide.
- Queue drawer slide: 220ms ease-out.
- No decorative or ambient motion anywhere. With `prefers-reduced-motion`, all transitions collapse to instant.

## 8. Content Requirements

### Region labels (uppercase mono, letter-spacing 0.05em, ~0.75rem)
`NOW PLAYING`, `SIDE A`, `SIDE B`, `RECENTLY PLAYED`, `PLAYLISTS`, `ALBUMS`, `ARTISTS`, `LYRICS`, `SETTINGS`, `QUEUE`, `BUFFERING`.

### Empty / error copy (sans body, ash text)
- "Sign in to load your library."
- "No tracks yet. Liked songs appear here."
- "No lyrics for this track."
- "No tracks." (empty playlist/album)
- "TRACK 404 — playlist not found." (mono)
- "Connection lost — retry." (with retry affordance)

### Mono stamps
- Track counts: `142 TRACKS`
- Durations: `8h 24m`, `02:34 / 04:50`
- Codecs: `FLAC · 1411kbps` (when available)
- Bitrates: `320 kbps`, `LOSSLESS`

### i18n
Reuse existing `src/locale/lang/*.js` keys where possible. New keys needed: `library.sideA`, `library.sideB`, `library.signInPrompt`, `library.emptyState`, `lyrics.empty`, `player.idlePrompt`. Add to all four locales (en, zh-CN, zh-TW, tr) at craft time.

**CJK consideration**: Region labels are Latin-only by design (silkscreen aesthetic doesn't translate to CJK uppercase). For zh-CN and zh-TW, region labels stay in their English form ("NOW PLAYING", not "正在播放") — this is consistent with the equipment-stamp aesthetic. **Confirm this with user during shape confirmation.**

## 9. Recommended References

For the implementer (likely you, in `/impeccable craft`), load these reference files when working on the corresponding parts:

- **`spatial-design.md`** — for the three-region app shell, Marvis-style row density, and Side A/B grid composition.
- **`color-and-contrast.md`** — for the OKLCH tinted-neutral palette spec, Tape Orange-Red anchor (`oklch(64% 0.18 38)`-ish), dark-mode contrast pass.
- **`typography.md`** — for the two-voice sans+mono pairing, the Label-As-Silkscreen rule application, and CJK font-stack fallbacks.
- **`motion-design.md`** — for the reel rotation timing, ease-out curves, and reduced-motion behavior.
- **`interaction-design.md`** — for seek-by-drag, queue drawer, hover/focus states, and keyboard nav.

## 10. Resolved Decisions

User confirmed all open questions 2026-05-10:

1. **CJK region labels** → keep English silkscreen (`NOW PLAYING`, `SIDE A`) on all locales. Labels are equipment stamps, not translatable UI copy.
2. **Reels visualization** → dropped entirely. Mass + saturated color carry the cassette metaphor without literal imagery.
3. **Tape compartment height** → **88px**. Compact bar; frees the freed pixels for Library content.
4. **Side B drawers** → mutually exclusive. Only one of [Playlists] / Albums / Artists renders at a time.
5. **Settings** → out of scope for shape. Token swap only at craft time, no layout changes.
6. **Personal FM** → out of use. Spawn a separate cleanup task to remove it from `src/utils/Player.js`, the Lyrics page button, and any associated state. **Not part of this shape brief.**

---

## Status

**Brief approved 2026-05-10.** Ready for `/impeccable craft` implementation.

**Spawned follow-up work** (out of this brief):
- ✅ **Personal FM cleanup** — completed 2026-05-10. Removed all `personalFM` / `fmTrash` / `_isPersonalFM` references from `Player.js`, `Player.vue`, `lyrics.vue`, `playList.js`, `ipcRenderer.js`, `background.js`, `api/others.js`. Web build passes (`yarn build` → ✓ built in 972ms). Server-side route registrations in `src/ncmModDef.js` left intact (they declare the embedded API server's `/personal_fm` and `/fm_trash` endpoints; harmless and keep API completeness).
