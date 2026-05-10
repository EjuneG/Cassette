<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: YesPlayMusic
description: A daily-use NetEase Cloud Music client that feels like a hand-built object on the desk.
---

# Design System: YesPlayMusic

## 1. Overview

**Creative North Star: "The Studio Cassette"**

A music player that lives on a developer's desk like a piece of dedicated audio gear — a Teenage Engineering OP-1 sitting next to the keyboard. It is not a chrome-less window into a backend. It is an *object*: composed of muted neutral planes the eye reads as housing, with one saturated block of color where the action is happening — like the bright tape compartment of a cassette deck or the SYNTH section of an OP-1.

The system is committed but not loud. The bulk of the interface is tinted-warm neutral, calm enough to live in peripheral vision while code is being written. But anything *currently in motion* — the now-playing surface, the active row, the focused control — wears color as a uniform, not as a decoration. Color signals event, not aesthetic mood.

This system explicitly rejects: backdrop-blur navbars and sky-blue accents (Apple Music clone), purple-to-blue gradients with Inter-everywhere and cards-inside-cards (AI SaaS slop), multi-layered glowing borders and neon scanlines (overwrought "gamer" UI), and the choreographed bloom-cover-into-UI move that turns every Apple Music play screen into the same lava lamp.

**Key Characteristics:**
- Composed of mass, not chrome: surfaces are planes, not panels stacked on panels.
- Color is a uniform worn by the active region; everything else is neutral housing.
- Typography is two voices: a technical sans for prose, mono for data.
- Motion is response, never performance.
- Density is welcome. This is one operator's tool, not a kiosk.

## 2. Colors: The Tape-Compartment Palette

A two-pole system: tinted warm neutrals as the housing, one saturated block as the event. Hex values land during implementation; canonical hue references below are anchors, not literals.

### Primary

- **Tape Orange-Red** *(`[to be resolved during implementation]` — anchor: warm orange-red around the OP-1 SYNTH block, OKLCH ~ `oklch(64% 0.18 38)`)*: The single saturated voice. Lives on the now-playing surface, the play affordance when active, and the focus ring. **Used as a block, not a tint.**

### Secondary (sparing)

- **Deep Tape Navy** *(`[to be resolved during implementation]` — anchor: deep grounded navy with low chroma)*: A second functional color used only on a small set of secondary action surfaces (e.g., queue spine, lyrics handoff). Held back enough that "the orange one" remains the system's signature voice.

### Neutral

- **Housing Cream** *(light theme background, `[to be resolved]` — warm gray tinted toward orange, OKLCH ~ `oklch(95% 0.005 60)`)*: Primary surface in light mode. Never `#fff`.
- **Housing Graphite** *(dark theme background, `[to be resolved]` — warm dark gray, OKLCH ~ `oklch(20% 0.005 60)`)*: Primary surface in dark mode. Never `#000`.
- **Ash** *(secondary surfaces, dividers, low-emphasis text)*: A muted mid-tone that sits between housing and ink, used for the minor parts.
- **Ink** *(primary text)*: A near-black tinted toward the orange family in light mode; a near-white tinted the same way in dark mode. Always tested for ≥4.5:1 contrast on the housing it sits on.

### Named Rules

**The Spotlight Rule.** Tape Orange-Red appears only on a region representing *the currently active event* — what is now playing, what is now focused, what is now selected. It is not a brand color sprinkled across the UI. If a region wears the spotlight color, that region *is* the event; if it does not, it is housing. There is no in-between. Cap Orange-Red at ~30–40% of any single screen, and most often well below.

**The No-Pure-Black-Or-White Rule.** Every neutral is tinted toward the warm hue family (chroma 0.005–0.01). Pure `#000` and `#fff` are forbidden anywhere — surfaces, text, borders, scrollbar tracks. Late-night use is a first-class scenario; pure values strain the eyes against dim ambient light.

**The Cover-Stays-In-The-Frame Rule.** Album cover art appears as artwork inside dedicated frames. It is not blurred, color-pulled, sampled, or used as a tint that bleeds into the surrounding UI. The rest of the interface stays its tape-compartment self while the cover is the cover. (This is the explicit anti-Apple-Music stance.)

## 3. Typography

**Display / Body Font:** *[Technical sans, to be chosen at implementation]* — anchor candidates: Söhne, Inter Display, Geist, Suisse Int'l. Latin glyphs only; CJK pairs to a clean modern grotesque (PingFang SC / Source Han Sans Medium / HarmonyOS Sans).

**Label / Mono Font:** *[Monospace, to be chosen at implementation]* — anchor candidates: JetBrains Mono, Berkeley Mono, IBM Plex Mono, Commit Mono. Used only on numeric and tag content; CJK never typeset in mono.

**Character.** Two voices, never four. The sans is the speaking voice — confident, slightly technical, but not cold; meant to be lived in. The mono is the equipment voice — used like the gear-stamping on a piece of audio hardware: timecodes, counts, BPM, bitrate, status indicators.

### Hierarchy

- **Display** (sans, weight 600–700, ~clamp 2rem to 3rem, line-height 1.05): Reserved for first-load identity moments. Most pages do not need a display tier.
- **Headline** (sans, weight 600, ~1.5–1.75rem, line-height 1.1): Section titles. Tracks the OP-1 module-label feel — short, declarative.
- **Title** (sans, weight 500, ~1.125rem, line-height 1.25): Card / row primary lines (track titles, playlist names).
- **Body** (sans, weight 400, ~0.9375rem, line-height 1.5, max 65–75ch): The default. Where prose lives.
- **Label** (sans, weight 500, uppercase, letter-spacing ~0.04em, ~0.75rem): Functional region tags ("NOW PLAYING", "QUEUE", "SIDE A"). Used like silkscreened labels on hardware.
- **Mono** (mono, weight 400–500, ~0.8125–0.875rem): Times, durations, track counts, file format tags, BPM. Never page copy.

### Named Rules

**The Two-Voice Rule.** Sans speaks. Mono measures. If text is reading content (a song name, a description, an artist bio, a setting label) it is sans. If text is a number, a tag, a status, or a stamp, it is mono. There is no third register.

**The Label-As-Silkscreen Rule.** Uppercase labels are functional silkscreens that name a region of the device, not headlines. They sit at small sizes with generous letter-spacing, used at most once per region. Do not promote them to headlines or use them to add "design energy" to a section that doesn't need a region label.

## 4. Elevation

The system is **flat-by-default with motion-driven response.** Surfaces sit on the same plane as the housing they're cut from. There is no global elevation system, no "card layer above content layer," no pervasive drop shadows.

Depth is conveyed by **mass and color**, not shadow. The now-playing block reads as foreground because it wears the saturated color, not because it's lifted. The selected row reads as active because its background tone shifts, not because it floats.

### Shadow Vocabulary (sparing)

- **Hover-lift** *(`[to be resolved]` — soft, low-spread, ~6–10px blur, low opacity)*: Applied only on directly interactive elements at hover (buttons, list rows). A response, not a default state.
- **Modal-anchor** *(`[to be resolved]`)*: One distinct shadow on dialogs / context menus to signal they are temporarily lifted from the housing surface. Used at most twice per screen.

There are no ambient resting shadows. Cards do not "float" by default. Glassmorphism is forbidden anywhere in the system.

### Named Rules

**The Flat-Object Rule.** Surfaces are flat planes carved out of the housing. If you find yourself reaching for a `box-shadow` to make something look like an object, the wrong tool is being used — pick mass (background tone), color (saturated insert), or border (1px ash hairline) instead.

**The Shadow-As-Response Rule.** Shadows appear only as a *response* to user state — hover, focus, drag. A shadow on an element at rest is a smell that elevation is being used to fake hierarchy that should be carried by mass and color.

## 5. Components

*(Components are not yet specified — the visual system is being seeded ahead of implementation. Re-run `/impeccable document` once components are built; the scan-mode pass will extract real shapes, paddings, hover treatments, and the `.impeccable/design.json` sidecar with live HTML/CSS snippets.)*

## 6. Do's and Don'ts

### Do

- **Do** treat the saturated orange-red as a uniform worn by the active region. The Spotlight Rule is the system's defining move; everything else flows from it.
- **Do** tint every neutral toward the warm hue family. Pure `#000` and `#fff` are forbidden — the dim-ambient late-night scenario depends on this.
- **Do** carry a two-voice typography stance: sans speaks, mono measures.
- **Do** use uppercase labels as silkscreen region tags ("NOW PLAYING", "SIDE A"), small and infrequent.
- **Do** keep motion under ~250ms ease-out for state transitions. Honor `prefers-reduced-motion` unconditionally.
- **Do** let cover art exist inside its frame and be itself. The UI stays its own thing.

### Don't

- **Don't** ship another Apple Music clone. Backdrop-blur navbars, sky-blue accents, blooming-cover color extraction, and sans-serif-large-heading-over-frosted-card are this project's primary anti-reference. The redesign exists to escape this lane.
- **Don't** ship AI SaaS slop. No purple-to-blue gradients, no Inter-for-everything, no rounded-square icon tile above every heading, no cards nested inside cards, no gray text on colored backgrounds. The "consultancy black + neon green" Spotify template falls in here too — too market-default to carry personal signal.
- **Don't** ship overwrought "gamer" UI. No multi-layered glowing borders, no decorative scanlines, no animated meters that don't measure anything. The product plays music; it is not a cyberpunk dashboard cosplay.
- **Don't** use gradient text (`background-clip: text` on a gradient). Solid color with weight or size for emphasis.
- **Don't** use side-stripe colored borders (`border-left` >1px as a colored accent on cards or rows). Rewrite with full borders, background tints, leading numbers, or nothing.
- **Don't** wrap things in cards by reflex. Most of this UI is mass on housing — not panels stacked on panels. Nested cards are always wrong.
- **Don't** add choreographed entrance animations or scroll-driven reveals. Motion is response, not performance. PRODUCT.md's "Quiet by default" is enforced here.
- **Don't** treat the saturated color as a brand sprinkle. If orange-red appears outside an active region, the Spotlight Rule has been broken — fix the cause, not the symptom.
- **Don't** typeset CJK in monospace. Mono is for Latin numerals and tags; CJK belongs in the sans pairing.
