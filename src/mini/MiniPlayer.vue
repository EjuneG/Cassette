<template>
  <div
    class="deck"
    :class="{ idle: !canControl, 'lyrics-open': lyricsOn, anim: panelAnim }"
    @wheel.prevent="onWheel"
  >
    <!-- ── LABEL STRIP ─────────────────────────────────────────────── -->
    <div class="label-strip" @dblclick="expand">
      <template v-if="canControl">
        <div
          class="title"
          :style="titleStyle"
          :class="{ scrollable: titleOverflow > 0 }"
        >
          <span ref="title" class="title-text">{{ trackTitle }}</span>
        </div>
        <div class="artist">{{ trackArtists }}</div>
      </template>
      <div v-else class="stamp">PICK A TRACK</div>
    </div>

    <!-- ── TAPE WINDOW ─────────────────────────────────────────────── -->
    <div
      ref="tape"
      class="tape-window"
      :class="{ scrubbing: seeking }"
      @pointerdown="onSeekDown"
      @pointermove="onSeekMove"
      @pointerup="onSeekUp"
      @pointercancel="onSeekCancel"
    >
      <svg
        v-for="reel in reels"
        :key="reel.id"
        class="reel"
        :class="{ spinning: state.playing }"
        viewBox="0 0 40 40"
        width="40"
        height="40"
        aria-hidden="true"
      >
        <g class="reel-spin" :style="{ animationDelay: reel.delay }">
          <circle class="spool" cx="20" cy="20" :r="reel.radius" />
          <circle class="hub-ring" cx="20" cy="20" r="14" />
          <circle class="hub-core" cx="20" cy="20" r="4.5" />
          <rect
            v-for="angle in [0, 120, 240]"
            :key="angle"
            class="notch"
            x="19"
            y="10.4"
            width="2"
            height="5.6"
            rx="0.6"
            :transform="`rotate(${angle} 20 20)`"
          />
        </g>
      </svg>

      <div class="timecode">
        <span class="elapsed">{{ elapsedStamp }}</span>
        <span class="sep"> / </span>
        <span class="total">{{ totalStamp }}</span>
      </div>

      <button
        class="lrc-stamp"
        :class="{ on: lyricsOn }"
        title="Lyrics"
        @pointerdown.stop
        @click.stop="send('toggleLyrics')"
      >
        LRC
      </button>
    </div>

    <!-- ── LYRIC STRIP (flips open between tape window and keys) ────── -->
    <div ref="lyricSlot" class="lyric-slot">
      <div class="lyric-panel">
        <transition name="lyric-swap" mode="out-in">
          <span
            :key="lyricDisplay.key"
            class="lyric-line"
            :class="{ stamp: lyricDisplay.stamp }"
            >{{ lyricDisplay.text }}</span
          >
        </transition>
      </div>
    </div>

    <!-- ── KEY ROW ─────────────────────────────────────────────────── -->
    <div class="key-row">
      <button
        class="key"
        title="Previous"
        :disabled="!canControl"
        @click="send('previous')"
      >
        <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
          <path
            d="M64 468V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12v176.4l195.5-181C352.1 22.3 384 36.6 384 64v384c0 27.4-31.9 41.7-52.5 24.6L136 292.7V468c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12z"
          />
        </svg>
      </button>

      <button
        class="key key-play"
        :class="{ live: state.playing }"
        :title="state.playing ? 'Pause' : 'Play'"
        :disabled="!canControl"
        @click="send('play')"
      >
        <svg
          v-if="state.playing"
          viewBox="0 0 448 512"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"
          />
        </svg>
        <svg
          v-else
          viewBox="0 0 448 512"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"
          />
        </svg>
      </button>

      <button
        class="key"
        title="Next"
        :disabled="!canControl"
        @click="send('next')"
      >
        <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
          <path
            d="M384 44v424c0 6.6-5.4 12-12 12h-48c-6.6 0-12-5.4-12-12V291.6l-195.5 181C95.9 489.7 64 475.4 64 448V64c0-27.4 31.9-41.7 52.5-24.6L312 219.3V44c0-6.6 5.4-12 12-12h48c6.6 0 12 5.4 12 12z"
          />
        </svg>
      </button>

      <button
        class="key key-like"
        :class="{ live: state.isLiked }"
        :title="state.isLiked ? 'Unlike' : 'Like'"
        :disabled="!canControl"
        @click="send('like')"
      >
        <svg
          v-if="state.isLiked"
          viewBox="0 0 30 30"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M15,26c-0.21,0-0.42-0.066-0.597-0.198C13.938,25.456,3,17.243,3,11c0-3.859,3.141-7,7-7c2.358,0,4.062,1.272,5,2.212 C15.938,5.272,17.642,4,20,4c3.859,0,7,3.14,7,7c0,6.243-10.938,14.456-11.403,14.803C15.42,25.934,15.21,26,15,26z"
          />
        </svg>
        <svg v-else viewBox="0 0 30 30" fill="currentColor" aria-hidden="true">
          <path
            d="M 9.5449219 3 C 5.3895807 3 2 6.3895806 2 10.544922 C 2 14.283156 4.9005496 18.084723 7.6601562 21.119141 C 10.419763 24.153558 13.171875 26.369141 13.171875 26.369141 A 1.0001 1.0001 0 0 0 13.197266 26.388672 C 13.517448 26.630481 13.956962 26.684854 14.369141 26.785156 A 1.0001 1.0001 0 0 0 15 27 A 1.0001 1.0001 0 0 0 15.630859 26.785156 C 16.043038 26.684854 16.482552 26.630481 16.802734 26.388672 A 1.0001 1.0001 0 0 0 16.828125 26.369141 C 16.828125 26.369141 19.580237 24.153558 22.339844 21.119141 C 25.099451 18.084722 28 14.283156 28 10.544922 C 28 6.3895806 24.610419 3 20.455078 3 C 17.450232 3 15.833405 4.5910542 15 5.5664062 C 14.166595 4.5910543 12.549768 3 9.5449219 3 z M 9.5449219 5 C 12.372924 5 14.069642 7.4290597 14.126953 7.5117188 A 1.0001 1.0001 0 0 0 14.910156 8.0078125 A 1.0001 1.0001 0 0 0 15.003906 8.0117188 A 1.0001 1.0001 0 0 0 15.019531 8.0117188 A 1.0001 1.0001 0 0 0 15.042969 8.0097656 A 1.0001 1.0001 0 0 0 15.119141 8.0039062 A 1.0001 1.0001 0 0 0 15.871094 7.5136719 C 15.925786 7.4347249 17.624838 5 20.455078 5 C 23.529737 5 26 7.4702629 26 10.544922 C 26 13.147688 23.499768 16.870104 20.859375 19.773438 C 18.227966 22.666891 15.607768 24.780451 15.589844 24.794922 C 15.414236 24.925626 15.219097 25 15 25 C 14.780903 25 14.585764 24.925626 14.410156 24.794922 C 14.392232 24.780451 11.772034 22.66689 9.140625 19.773438 C 6.5002316 16.870105 4 13.147688 4 10.544922 C 4 7.4702629 6.470263 5 9.5449219 5 z"
          />
        </svg>
      </button>

      <button class="key" title="Back to Cassette" @click="expand">
        <svg viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path
            d="M1 9C0.45 9 0 9.45 0 10L0 13C0 13.55 0.45 14 1 14L4 14C4.55 14 5 13.55 5 13C5 12.45 4.55 12 4 12L2 12L2 10C2 9.45 1.55 9 1 9ZM9 1C9 1.54 9.45 2 10 2L12 2L12 4C12 4.54 12.45 5 13 5C13.55 5 14 4.54 14 4L14 1C14 0.45 13.55 0 13 0L10 0C9.45 0 9 0.45 9 1Z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
const WHEEL_THROTTLE = 150;

// Spool radii, in the reel's 40×40 user-space units. Tape moves from the
// supply reel (left, shrinks) to the take-up reel (right, grows).
const R_FULL = 14;
const R_EMPTY = 6;
const R_IDLE = 10;

// Deck height with the lyric strip open — must match MINI_HEIGHT_LYRICS in
// src/electron/miniPlayer.js and the .deck.lyrics-open height below.
const DECK_OPEN_HEIGHT = 178;

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

export default {
  name: 'MiniPlayer',
  data() {
    return {
      state: {
        playing: false,
        enabled: false,
        progress: 0,
        duration: 0,
        isLiked: false,
        repeatMode: 'off',
        shuffle: false,
        volume: 1,
        track: null,
      },
      seeking: false,
      seekRatio: 0,
      titleOverflow: 0,
      lastWheelAt: 0,
      stateListener: null,
      lyricsListener: null,
      lyricsModeListener: null,
      // Lyric strip. `lyrics` is the full parsed track lyric; the current
      // line is derived locally from an interpolated clock, because the
      // 1 Hz snapshot alone would switch lines up to a second late.
      lyrics: [],
      lyricsTrackId: null,
      lyricsOn: false,
      panelAnim: false,
      lyricsModeSeq: 0,
      clockAt: 0,
      nowMs: 0,
      ticker: null,
      collapseTimer: null,
    };
  },
  computed: {
    canControl() {
      return this.state.enabled && !!this.state.track;
    },
    trackTitle() {
      return this.state.track?.name || '';
    },
    trackArtists() {
      return this.state.track?.artists || '';
    },
    duration() {
      return this.state.duration > 0 ? this.state.duration : 0;
    },
    displayProgress() {
      if (this.seeking) return this.seekRatio * this.duration;
      return this.state.progress;
    },
    progressRatio() {
      if (!this.canControl || this.duration <= 0) return 0;
      return Math.min(1, Math.max(0, this.displayProgress / this.duration));
    },
    reels() {
      if (!this.canControl) {
        return [
          { id: 'supply', radius: R_IDLE, delay: '0s' },
          { id: 'takeup', radius: R_IDLE, delay: '0s' },
        ];
      }
      const travel = R_FULL - R_EMPTY;
      return [
        {
          id: 'supply',
          radius: R_FULL - travel * this.progressRatio,
          delay: '0s',
        },
        {
          id: 'takeup',
          radius: R_EMPTY + travel * this.progressRatio,
          delay: '-0.6s',
        },
      ];
    },
    elapsedStamp() {
      return this.canControl ? formatTime(this.displayProgress) : '--:--';
    },
    totalStamp() {
      return this.canControl ? formatTime(this.duration) : '--:--';
    },
    titleStyle() {
      return { '--marquee-shift': `${-this.titleOverflow}px` };
    },
    tickerActive() {
      return this.lyricsOn && this.state.playing && this.canControl;
    },
    lyricTime() {
      if (this.seeking) return this.seekRatio * this.duration;
      if (!this.state.playing) return this.state.progress;
      return (
        this.state.progress + Math.max(0, (this.nowMs - this.clockAt) / 1000)
      );
    },
    lyricDisplay() {
      if (!this.canControl) return { key: 'idle', text: '· · ·', stamp: true };
      const trackId = this.state.track.id;
      if (this.lyricsTrackId !== trackId) {
        return { key: `wait-${trackId}`, text: '· · ·', stamp: true };
      }
      if (this.lyrics.length === 0) {
        return { key: `none-${trackId}`, text: 'NO LYRICS', stamp: true };
      }
      const index = this.lyricIndexAt(this.lyricTime);
      if (index < 0) {
        return { key: `pre-${trackId}`, text: '· · ·', stamp: true };
      }
      const content = (this.lyrics[index].content || '').trim();
      if (!content) return { key: `gap-${index}`, text: '· · ·', stamp: true };
      return { key: `${trackId}-${index}`, text: content, stamp: false };
    },
  },
  watch: {
    trackTitle() {
      this.$nextTick(this.measureTitle);
    },
    tickerActive: {
      immediate: true,
      handler(active) {
        clearInterval(this.ticker);
        this.ticker = null;
        if (active) {
          this.ticker = setInterval(() => {
            this.nowMs = performance.now();
          }, 250);
        }
      },
    },
  },
  created() {
    const api = window.electronAPI;
    if (!api) return;
    this.stateListener = api.on('mini:state', state => {
      if (!state) return;
      Object.assign(this.state, state);
      this.clockAt = performance.now();
      this.nowMs = this.clockAt;
    });
    this.lyricsListener = api.on('mini:lyrics', payload => {
      if (!payload) return;
      this.lyricsTrackId = payload.id;
      this.lyrics = Array.isArray(payload.lines) ? payload.lines : [];
    });
    this.lyricsModeListener = api.on('mini:lyrics-mode', payload => {
      if (payload) this.onLyricsMode(payload);
    });
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.measureTitle);
    this.measureTitle();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.measureTitle);
    clearInterval(this.ticker);
    clearTimeout(this.collapseTimer);
    const api = window.electronAPI;
    if (this.stateListener) {
      api?.removeListener('mini:state', this.stateListener);
    }
    if (this.lyricsListener) {
      api?.removeListener('mini:lyrics', this.lyricsListener);
    }
    if (this.lyricsModeListener) {
      api?.removeListener('mini:lyrics-mode', this.lyricsModeListener);
    }
  },
  methods: {
    send(action, value) {
      window.electronAPI?.send('mini:command', { action, value });
    },
    expand() {
      this.send('expand');
    },
    measureTitle() {
      const el = this.$refs.title;
      this.titleOverflow = el
        ? Math.max(0, el.scrollWidth - el.clientWidth)
        : 0;
    },

    /* ---- lyric strip ---- */
    lyricIndexAt(time) {
      // Last line whose timestamp has passed; -1 before the first line.
      const lines = this.lyrics;
      let low = 0;
      let high = lines.length - 1;
      let found = -1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (lines[mid].time <= time) {
          found = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      return found;
    },
    onLyricsMode({ on, animate }) {
      const seq = ++this.lyricsModeSeq;
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
      if (on === this.lyricsOn) return;
      if (!animate) {
        this.panelAnim = false;
        this.lyricsOn = on;
        return;
      }
      if (on) {
        // The main process has just grown the window, but on X11 the new
        // bounds land a frame or two later. Starting the expansion early
        // means it plays clipped inside the old viewport and pops when the
        // resize hits — wait until the pixels actually exist.
        this.awaitViewport(DECK_OPEN_HEIGHT, () => {
          if (seq !== this.lyricsModeSeq) return;
          this.panelAnim = true;
          this.lyricsOn = true;
        });
        return;
      }
      this.panelAnim = true;
      this.lyricsOn = false;
      // Closing: the window must not shrink until the collapse animation has
      // played out (0ms under reduced motion — read, don't hardcode).
      this.$nextTick(() => {
        this.collapseTimer = setTimeout(() => {
          this.send('lyricsCollapsed');
        }, this.slotTransitionMs() + 40);
      });
    },
    awaitViewport(minHeight, callback) {
      const deadline = performance.now() + 250;
      const check = () => {
        if (window.innerHeight >= minHeight || performance.now() > deadline) {
          callback();
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    },
    slotTransitionMs() {
      const el = this.$refs.lyricSlot;
      if (!el) return 0;
      const raw = getComputedStyle(el).transitionDuration || '0s';
      const value = parseFloat(raw) || 0;
      return raw.includes('ms') ? value : value * 1000;
    },

    /* ---- seek ("winding the tape") ---- */
    ratioFromEvent(event) {
      const rect = this.$refs.tape?.getBoundingClientRect();
      if (!rect || rect.width === 0) return 0;
      return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    },
    onSeekDown(event) {
      if (!this.canControl || this.duration <= 0) return;
      this.seeking = true;
      this.seekRatio = this.ratioFromEvent(event);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onSeekMove(event) {
      if (!this.seeking) return;
      this.seekRatio = this.ratioFromEvent(event);
    },
    onSeekUp(event) {
      if (!this.seeking) return;
      const target = Math.round(this.ratioFromEvent(event) * this.duration);
      this.seeking = false;
      // Optimistic: the next 1 Hz snapshot may still carry the pre-seek
      // position, so show the target now and let the snapshot after it win.
      this.state.progress = target;
      this.clockAt = performance.now();
      this.nowMs = this.clockAt;
      this.send('seek', target);
    },
    onSeekCancel() {
      this.seeking = false;
    },

    /* ---- volume wheel ---- */
    onWheel(event) {
      const now = performance.now();
      if (now - this.lastWheelAt < WHEEL_THROTTLE) return;
      if (event.deltaY === 0) return;
      this.lastWheelAt = now;
      this.send(event.deltaY < 0 ? 'volumeUp' : 'volumeDown');
    },

    /* ---- keyboard ---- */
    onKeydown(event) {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (this.canControl) this.send('play');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (this.canControl) this.send('previous');
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (this.canControl) this.send('next');
          break;
        case 'Escape':
          event.preventDefault();
          this.expand();
          break;
        default:
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
/* ==========================================================================
   The Deck — 320×148 always-on-top cassette widget.
   Hardware sitting on glass: opaque housing, one saturated label strip,
   flat mechanical keys. Motion only where the machine actually moves.
   ========================================================================== */

/* Top-anchored with an explicit height (not inset: 0): the window's bounds
   jump instantly when the lyric strip toggles (it's transparent, so that's
   invisible), while the deck body animates its height in CSS — the label
   strip and tape window stay put, the transport bay slides down to reveal
   the strip. Growing DOWN with the top edge fixed matters on X11: a resize
   that keeps the top-left corner still repaints cleanly, while a move+resize
   combo flashes the old frame at the new origin for a frame or two — the
   spring-loaded bounce this direction replaced. */
.deck {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  height: 148px;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: 40px 1fr auto 40px;
  border: 1px solid var(--housing-hairline);
  border-radius: 10px;
  background: var(--housing-elev);
  overflow: hidden;
  -webkit-app-region: drag;

  /* The door opens under motor power, not spring power: symmetric
     accelerate-then-settle, unlike the front-loaded --ease-out. */
  --ease-door: cubic-bezier(0.4, 0, 0.2, 1);

  &.lyrics-open {
    height: 178px;
  }

  &.anim {
    transition: height var(--motion-base) var(--ease-door);
  }
}

/* ------ label strip ------ */
.label-strip {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding: 0 14px;
  min-width: 0;
  background: var(--tape-orange);
  transition: filter var(--motion-slow) var(--ease-out);
  -webkit-app-region: drag;

  .deck.idle & {
    filter: saturate(0.5);
  }
}

.title {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.16;
  color: var(--tape-orange-ink);
}

.title-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (prefers-reduced-motion: no-preference) {
  .label-strip:hover .title.scrollable .title-text {
    overflow: visible;
    text-overflow: clip;
    animation: marquee 6s linear;
  }
}

@keyframes marquee {
  0%,
  10% {
    transform: translateX(0);
  }
  55%,
  65% {
    transform: translateX(var(--marquee-shift, 0));
  }
  100% {
    transform: translateX(0);
  }
}

.artist {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.16;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--tape-orange-ink-dim);
}

.stamp {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.16em;
  color: var(--tape-orange-ink);
}

/* ------ tape window ------ */
.tape-window {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 10px;
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid var(--housing-hairline);
  border-radius: 6px;
  background: var(--housing-base);
  cursor: ew-resize;
  -webkit-app-region: no-drag;
}

.reel {
  display: block;
  flex: none;
}

.reel-spin {
  transform-box: view-box;
  transform-origin: 20px 20px;
  animation: reel-spin 2s linear infinite;
  animation-play-state: paused;
}

.reel.spinning .reel-spin {
  animation-play-state: running;
}

@keyframes reel-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reel-spin {
    animation: none;
  }
}

.spool {
  fill: var(--ink-faint);
  transition: r 1s linear;
}

.tape-window.scrubbing .spool {
  transition: none;
}

.hub-ring {
  fill: none;
  stroke: var(--ink-soft);
  stroke-width: 1;
}

.hub-core {
  fill: var(--housing-base);
  stroke: var(--ink-soft);
  stroke-width: 1;
}

.notch {
  fill: var(--ink-soft);
}

.timecode {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  white-space: nowrap;
  pointer-events: none;

  .elapsed {
    color: var(--ink-strong);
  }

  .sep,
  .total {
    color: var(--ink-soft);
  }
}

.lrc-stamp {
  position: absolute;
  right: 5px;
  bottom: 3px;
  padding: 2px 3px;
  border: none;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.14em;
  color: var(--ink-faint);
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-out);

  &:hover {
    color: var(--ink-mid);
  }

  &.on {
    color: var(--tape-orange);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 1px var(--tape-orange);
  }
}

/* ------ lyric strip ------ */
/* Slot = the gap that opens in the housing; panel = the display inside it.
   Slot height (0 → 30px) and deck height (148 → 178px) share one duration
   and easing, so the label strip and tape window never change size. */
.lyric-slot {
  height: 0;
  overflow: hidden;

  .deck.lyrics-open & {
    height: 30px;
  }

  .deck.anim & {
    transition: height var(--motion-base) var(--ease-door);
  }
}

.lyric-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  margin: 0 10px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid var(--housing-hairline);
  border-radius: 6px;
  background: var(--housing-base);
}

.lyric-line {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ink-strong);

  &.stamp {
    font-size: 10px;
    letter-spacing: 0.16em;
    color: var(--ink-faint);
  }
}

.lyric-swap-enter-active,
.lyric-swap-leave-active {
  transition: opacity var(--motion-fast) var(--ease-out);
}

.lyric-swap-enter-from,
.lyric-swap-leave-to {
  opacity: 0;
}

/* ------ key row ------ */
.key-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr;
  border-top: 1px solid var(--housing-hairline);
  -webkit-app-region: no-drag;
}

.key {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-left: 1px solid var(--housing-hairline);
  background: transparent;
  color: var(--ink-mid);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);

  &:first-child {
    border-left: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover:not(:disabled) {
    background: var(--housing-divider);
  }

  &:active:not(:disabled) {
    background: var(--housing-divider);
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 1px var(--tape-orange);
  }

  &:disabled {
    color: var(--ink-faint);
    cursor: default;
  }
}

.key-play {
  color: var(--ink-strong);

  &.live {
    color: var(--tape-orange);
  }

  &:disabled {
    color: var(--ink-faint);
  }
}

.key-like.live {
  color: var(--tape-orange);
}
</style>
