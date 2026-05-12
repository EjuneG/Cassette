<template>
  <div class="tape-compartment" :class="{ idle: !hasTrack }">
    <div class="seek-rail" @click.stop>
      <vue-slider
        v-model="player.progress"
        :min="0"
        :max="player.currentTrackDuration"
        :interval="1"
        :drag-on-click="true"
        :duration="0"
        :dot-size="10"
        :height="2"
        :tooltip-formatter="formatTrackTime"
        :lazy="true"
        :silent="true"
      ></vue-slider>
    </div>

    <div class="compartment-row">
      <!-- LEFT: cover + track info -->
      <div class="block-now" @click.stop>
        <button
          class="cover-thumb"
          :title="$t('player.lyrics')"
          @click="toggleLyrics"
        >
          <img
            v-if="currentTrack.al && currentTrack.al.picUrl"
            :src="resizeImage(currentTrack.al && currentTrack.al.picUrl, 224)"
            loading="lazy"
          />
          <span v-else class="cover-empty mono-stamp">A·B</span>
        </button>
        <div v-if="hasTrack" class="track-meta" :title="audioSource">
          <div
            :class="['track-name', { linkable: hasList() }]"
            @click="hasList() && goToList()"
            >{{ currentTrack.name }}</div
          >
          <div class="track-line">
            <span
              v-for="(ar, index) in currentTrack.ar"
              :key="ar.id"
              class="artist-link"
              :class="{ linkable: ar.id }"
              @click="ar.id && goToArtist(ar.id)"
              >{{ ar.name
              }}<span v-if="index !== currentTrack.ar.length - 1"
                >,
              </span></span
            >
            <span v-if="currentTrack.al && currentTrack.al.name" class="dot-sep"
              >·</span
            >
            <span
              v-if="currentTrack.al && currentTrack.al.name"
              class="album-link"
              :class="{ linkable: currentTrack.al.id }"
              @click="goToAlbum"
              >{{ currentTrack.al.name }}</span
            >
          </div>
        </div>
        <div v-else class="track-meta">
          <div class="track-name idle-prompt">{{
            $t('player.idlePrompt')
          }}</div>
          <div class="track-line">
            <span class="mono-stamp">CASSETTE LOADED</span>
          </div>
        </div>
      </div>

      <!-- CENTER: transport + timecode -->
      <div class="block-transport" @click.stop>
        <div class="transport">
          <button
            class="ctl"
            :title="$t('player.previous')"
            @click="playPrevTrack"
          >
            <svg-icon icon-class="previous" />
          </button>
          <button
            class="ctl ctl-play"
            :title="$t(player.playing ? 'player.pause' : 'player.play')"
            @click="playOrPause"
          >
            <svg-icon :icon-class="player.playing ? 'pause' : 'play'" />
          </button>
          <button class="ctl" :title="$t('player.next')" @click="playNextTrack">
            <svg-icon icon-class="next" />
          </button>
        </div>
        <div class="timecode mono-stamp">
          <span>{{ formatTrackTime(player.progress) || '0:00' }}</span>
          <span class="time-sep">/</span>
          <span>{{
            formatTrackTime(player.currentTrackDuration) || '0:00'
          }}</span>
        </div>
      </div>

      <!-- RIGHT: like + queue + repeat + shuffle + volume + lyrics -->
      <div class="block-aux" @click.stop>
        <button
          class="ctl ctl-aux"
          :title="
            player.isCurrentTrackLiked ? $t('player.unlike') : $t('player.like')
          "
          @click="likeATrack(player.currentTrack.id)"
        >
          <svg-icon
            :icon-class="player.isCurrentTrackLiked ? 'heart-solid' : 'heart'"
          />
        </button>
        <button
          class="ctl ctl-aux"
          :class="{ active: $route.name === 'next' }"
          :title="$t('player.nextUp')"
          @click="goToNextTracksPage"
        >
          <svg-icon icon-class="list" />
        </button>
        <button
          class="ctl ctl-aux"
          :class="{ active: player.repeatMode !== 'off' }"
          :title="
            player.repeatMode === 'one'
              ? $t('player.repeatTrack')
              : $t('player.repeat')
          "
          @click="switchRepeatMode"
        >
          <svg-icon v-show="player.repeatMode !== 'one'" icon-class="repeat" />
          <svg-icon
            v-show="player.repeatMode === 'one'"
            icon-class="repeat-1"
          />
        </button>
        <button
          class="ctl ctl-aux"
          :class="{ active: player.shuffle }"
          :title="$t('player.shuffle')"
          @click="switchShuffle"
        >
          <svg-icon icon-class="shuffle" />
        </button>
        <button
          v-if="settings.enableReversedMode"
          class="ctl ctl-aux"
          :class="{ active: player.reversed }"
          :title="$t('player.reversed')"
          @click="switchReversed"
        >
          <svg-icon icon-class="sort-up" />
        </button>
        <div class="volume">
          <button class="ctl ctl-aux" :title="$t('player.mute')" @click="mute">
            <svg-icon v-show="volume > 0.5" icon-class="volume" />
            <svg-icon v-show="volume === 0" icon-class="volume-mute" />
            <svg-icon
              v-show="volume <= 0.5 && volume !== 0"
              icon-class="volume-half"
            />
          </button>
          <div class="volume-bar">
            <vue-slider
              v-model="volume"
              :min="0"
              :max="1"
              :interval="0.01"
              :drag-on-click="true"
              :duration="0"
              tooltip="none"
              :dot-size="10"
              :height="2"
            ></vue-slider>
          </div>
        </div>
        <button
          class="ctl ctl-aux ctl-lyrics"
          :title="$t('player.lyrics')"
          @click="toggleLyrics"
        >
          <svg-icon icon-class="arrow-up" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import '@/assets/css/slider.css';

import VueSlider from 'vue-3-slider-component';
import { goToListSource, hasListSource } from '@/utils/playList';
import { formatTrackTime } from '@/utils/common';
import { resizeImage } from '@/utils/filters';

export default {
  name: 'Player',
  components: {
    VueSlider,
  },
  computed: {
    ...mapState(['player', 'settings', 'data']),
    currentTrack() {
      return this.player.currentTrack;
    },
    hasTrack() {
      return !!(this.currentTrack && this.currentTrack.id);
    },
    volume: {
      get() {
        return this.player.volume;
      },
      set(value) {
        this.player.volume = value;
      },
    },
    audioSource() {
      return this.player._howler?._src.includes('kuwo.cn')
        ? '音源来自酷我音乐'
        : '';
    },
  },
  mounted() {
    this.setupMediaControls();
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    ...mapMutations(['toggleLyrics']),
    ...mapActions(['showToast', 'likeATrack']),
    resizeImage,
    formatTrackTime,
    playPrevTrack() {
      this.player.playPrevTrack();
    },
    playOrPause() {
      this.player.playOrPause();
    },
    playNextTrack() {
      this.player.playNextTrack();
    },
    goToNextTracksPage() {
      this.$route.name === 'next'
        ? this.$router.go(-1)
        : this.$router.push({ name: 'next' });
    },
    hasList() {
      return hasListSource();
    },
    goToList() {
      goToListSource();
    },
    goToAlbum() {
      if (!this.player.currentTrack.al || this.player.currentTrack.al.id === 0)
        return;
      this.$router.push({ path: '/album/' + this.player.currentTrack.al.id });
    },
    goToArtist(id) {
      this.$router.push({ path: '/artist/' + id });
    },
    switchRepeatMode() {
      this.player.switchRepeatMode();
    },
    switchShuffle() {
      this.player.switchShuffle();
    },
    switchReversed() {
      this.player.switchReversed();
    },
    mute() {
      this.player.mute();
    },
    setupMediaControls() {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () =>
          this.playOrPause()
        );
        navigator.mediaSession.setActionHandler('pause', () =>
          this.playOrPause()
        );
        navigator.mediaSession.setActionHandler('previoustrack', () =>
          this.playPrevTrack()
        );
        navigator.mediaSession.setActionHandler('nexttrack', () =>
          this.playNextTrack()
        );
      }
    },
    handleKeydown(event) {
      switch (event.code) {
        case 'MediaPlayPause':
          this.playOrPause();
          break;
        case 'MediaTrackPrevious':
          this.playPrevTrack();
          break;
        case 'MediaTrackNext':
          this.playNextTrack();
          break;
        default:
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.tape-compartment {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  height: var(--shell-bottom);
  z-index: 100;
  background: var(--tape-orange);
  color: var(--tape-orange-ink);
  display: flex;
  flex-direction: column;
  transition: filter var(--motion-slow) var(--ease-out);

  &.idle {
    filter: saturate(0.55);
  }
}

/* Top-edge seek rail. The vue-slider is overlaid so the whole top 4px
   is clickable while the visible rail line is 2px tall. */
.seek-rail {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;

  :deep(.vue-slider) {
    width: 100% !important;
    height: 4px !important;
    padding: 0 !important;
    background: transparent;
  }

  :deep(.vue-slider-rail) {
    background: oklch(20% 0.04 38 / 0.35) !important;
    border-radius: 0 !important;
    height: 2px !important;
    margin-top: 1px;
  }

  :deep(.vue-slider-process) {
    background: var(--tape-orange-ink) !important;
    border-radius: 0 !important;
  }

  :deep(.vue-slider-dot) {
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-out);
  }

  :deep(.vue-slider-dot-handle) {
    background: var(--tape-orange-ink) !important;
    border: none !important;
    box-shadow: none !important;
  }

  &:hover :deep(.vue-slider-dot) {
    opacity: 1;
  }
}

.compartment-row {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  padding: 0 calc(var(--shell-pad-x) - 4vw);
  gap: 24px;
}

@media (max-width: 1336px) {
  .compartment-row {
    padding: 0 calc(var(--shell-pad-x) - 2vw);
  }
}

@media (max-width: 970px) {
  .compartment-row {
    padding: 0 16px;
    gap: 12px;
  }
}

/* ------ LEFT: now-playing block ------ */
.block-now {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.cover-thumb {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  background: oklch(20% 0.04 38 / 0.35);
  border: 1px solid oklch(96% 0.005 60 / 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  cursor: pointer;
  transition: transform var(--motion-fast) var(--ease-out);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-empty {
    color: var(--tape-orange-ink);
    opacity: 0.7;
    font-size: 0.7rem;
    letter-spacing: 0.18em;
  }

  &:hover {
    transform: scale(1.04);
  }
}

.track-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-name {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--tape-orange-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &.linkable {
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }

  &.idle-prompt {
    opacity: 0.7;
    font-weight: 500;
  }
}

.track-line {
  font-size: 0.8125rem;
  color: var(--tape-orange-ink);
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 6px;

  .dot-sep {
    opacity: 0.5;
  }

  .linkable {
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }

  .mono-stamp {
    color: var(--tape-orange-ink);
    opacity: 0.65;
    letter-spacing: 0.12em;
  }
}

/* ------ CENTER: transport ------ */
.block-transport {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  justify-self: center;
}

.transport {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ctl {
  background: transparent;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: var(--tape-orange-ink);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out),
    transform 90ms var(--ease-out);

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: oklch(20% 0.04 38 / 0.18);
  }

  &:active {
    transform: scale(0.92);
  }

  &.active {
    background: oklch(20% 0.04 38 / 0.22);
  }
}

.ctl-play {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: var(--tape-orange-ink);
  color: var(--tape-orange);

  :deep(.svg-icon) {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: var(--tape-orange-ink);
    transform: scale(1.04);
  }
}

.ctl-aux {
  width: 30px;
  height: 30px;

  :deep(.svg-icon) {
    width: 15px;
    height: 15px;
    opacity: 0.85;
  }

  &.active :deep(.svg-icon) {
    opacity: 1;
  }
}

.ctl-lyrics {
  margin-left: 4px;
}

.timecode {
  display: flex;
  gap: 4px;
  color: var(--tape-orange-ink);
  opacity: 0.7;
  font-size: 0.6875rem;
  letter-spacing: 0.04em;

  .time-sep {
    opacity: 0.5;
  }
}

/* ------ RIGHT: aux controls + volume ------ */
.block-aux {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  min-width: 0;
}

.volume {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 2px 0 6px;
}

.volume-bar {
  width: 70px;

  :deep(.vue-slider) {
    width: 70px !important;
  }

  :deep(.vue-slider-rail) {
    background: oklch(20% 0.04 38 / 0.3) !important;
  }

  :deep(.vue-slider-process) {
    background: var(--tape-orange-ink) !important;
  }

  :deep(.vue-slider-dot-handle) {
    background: var(--tape-orange-ink) !important;
    border: none !important;
    box-shadow: none !important;
  }
}

@media (max-width: 970px) {
  .volume-bar {
    display: none;
  }
}
</style>
