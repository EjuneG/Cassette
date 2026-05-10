# Product

## Register

product

## Users

A single primary user — an indie game developer running this Electron client as their daily desktop music player on Pop!_OS. Two dominant contexts:

1. **Coding companion** — afternoon and evening. The window is in a side workspace or behind the IDE. The player is *background*, but the act of opening it should feel like picking up a well-built object.
2. **Late-night, alone** — writing, browsing, decompressing. Backlight is dim. The user is the only person in the room. The interface is a quiet co-occupant of the desk.

There is no second user. No onboarding flow, no "new user" hints, no marketing surface to design. Trust the operator. Default to expert ergonomics.

## Product Purpose

A NetEase Cloud Music client that doesn't feel like NetEase Cloud Music. The original mimicked Apple Music; we have stripped the navigation down to a single library page, and the UI scaffold no longer fits. The redesign exists because the software is now part of the user's daily life, and daily-use objects deserve character.

Success looks like the user opening the app and feeling *"interesting — a bit different"* instead of feeling nothing. The functional bar (play, queue, like, search, lyrics) is a baseline, not the goal.

## Brand Personality

Three words: **grounded, considered, characterful.**

- **Grounded** — visual weight. Saturated color blocks anchored on muted neutrals. Buttons that look like they would click. No floating ethereal glass.
- **Considered** — every element earns its place. The interface is small enough that it can be precise.
- **Characterful** — the cassette-shaped Relx vape analogy: same function as the slim version, but the shape is the experience. Function alone is not enough; the *object* must feel chosen.

Voice: matter-of-fact, single-user. Labels are short. No "Welcome back, friend!" copy. No empty-state cheerleading.

## Anti-references

What this must **not** become:

1. **Another Apple Music clone.** Backdrop-blur navbar, sky-blue accent, sans-serif large headings, generic frosted secondary backgrounds. This is the trap we are crawling out of.
2. **AI SaaS slop.** Purple-to-blue gradients, Inter for everything, cards nested in cards, rounded-square icon tiles above every heading, gray text on colored backgrounds. The Spotify "consultancy black + neon green" template falls in here too — too market-default, no personal signal.
3. **Overwrought "gamer" UI.** Multi-layered glowing borders, neon scanlines, decorative meters that don't measure anything. The product plays music; it is not a cyberpunk dashboard cosplay.

## Design Principles

1. **Object before chrome.** The screen should feel like a virtual instrument panel, not a thin window over a backend. Borrow the visual logic of dedicated music hardware — Teenage Engineering OP-1, vintage cassette decks, iPod nano, classic rack gear — without literal skeuomorphism. Mass, alignment, and color blocks do the work.
2. **Earned color.** Color is rationed. A small palette of saturated tones (orange-red, deep navy) lives against tinted-warm-gray neutrals. Saturated areas are deliberate inserts — a spine, a control, a now-playing surface — not background noise. No gradient text, no rainbow-on-rainbow.
3. **Quiet by default, loud on intent.** The app spends most of its life in peripheral vision; it must not strobe or blink for attention. But when the user *looks*, the layout should reward looking — typography hierarchy, considered gaps, a confident composition.
4. **Single-operator ergonomics.** This is one person's tool. Skip explanatory copy. Trust keyboard shortcuts and small targets where appropriate. Density is allowed; this is not a kiosk.
5. **Night-resilient.** Late-evening use is a first-class scenario. Never pure `#000` or `#fff`; tint every neutral toward a warm hue so the screen reads softer in dim light. Light theme should still be usable but is the secondary mode.

## Accessibility & Inclusion

- **Contrast: WCAG AA minimum** for body text and controls (≥ 4.5:1). Decorative chrome may go below; functional text never.
- **Reduced motion respected.** Honor `prefers-reduced-motion`. No requirement for elaborate transitions; motion is a flourish, not a load-bearing feature.
- **Backlight-tolerant.** Both themes are designed to be readable in low ambient light without eye fatigue. No pure-white surfaces in the dark theme; no pure-black surfaces in the light theme either.
- Single-user product, so there is no broad accessibility mandate beyond these — but the contrast and reduced-motion rules apply unconditionally.
