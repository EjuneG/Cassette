<template>
  <div
    class="cover"
    :class="{ 'cover-hover': coverHover, 'is-focused': focus && coverHover }"
    @mouseover="focus = true"
    @mouseleave="focus = false"
    @click="clickCoverToPlay ? play() : goTo()"
  >
    <div class="cover-container" :class="{ artist: type === 'artist' }">
      <img :src="imageUrl" :style="imageStyles" loading="lazy" />
      <div class="shade">
        <button
          v-show="focus"
          class="play-button"
          :style="playButtonStyles"
          @click.stop="play()"
          ><svg-icon icon-class="play" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: { type: Number, required: true },
    type: { type: String, required: true },
    imageUrl: { type: String, required: true },
    fixedSize: { type: Number, default: 0 },
    playButtonSize: { type: Number, default: 22 },
    coverHover: { type: Boolean, default: true },
    alwaysShowPlayButton: { type: Boolean, default: true },
    alwaysShowShadow: { type: Boolean, default: false },
    clickCoverToPlay: { type: Boolean, default: false },
    shadowMargin: { type: Number, default: 12 },
    radius: { type: Number, default: 12 },
  },
  data() {
    return {
      focus: false,
    };
  },
  computed: {
    imageStyles() {
      let styles = {};
      if (this.fixedSize !== 0) {
        styles.width = this.fixedSize + 'px';
        styles.height = this.fixedSize + 'px';
      }
      if (this.type === 'artist') styles.borderRadius = '50%';
      return styles;
    },
    playButtonStyles() {
      let styles = {};
      styles.width = this.playButtonSize + '%';
      styles.height = this.playButtonSize + '%';
      return styles;
    },
  },
  methods: {
    play() {
      const player = this.$store.state.player;
      const playActions = {
        album: player.playAlbumByID,
        playlist: player.playPlaylistByID,
        artist: player.playArtistByID,
      };
      playActions[this.type].bind(player)(this.id);
    },
    goTo() {
      this.$router.push({ name: this.type, params: { id: this.id } });
    },
  },
};
</script>

<style lang="scss" scoped>
.cover {
  position: relative;
}
.cover-container {
  position: relative;
  border-radius: 0.75em;

  &.artist {
    border-radius: 50%;
  }
}

img {
  display: block;
  border-radius: 0.75em;
  width: 100%;
  user-select: none;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--housing-hairline);
  transition: filter var(--motion-fast) var(--ease-out);
}

.cover-hover {
  &:hover {
    cursor: pointer;
  }
}

.cover-hover.is-focused img {
  filter: brightness(0.82);
}

.shade {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.play-button {
  pointer-events: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--tape-orange-ink);
  background: var(--tape-orange);
  border: none;
  height: 22%;
  width: 22%;
  border-radius: 50%;
  cursor: pointer;
  transition: background var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out);

  .svg-icon {
    width: 44%;
    margin-left: 3px;
  }

  &:hover {
    background: var(--tape-orange-bright);
  }
  &:active {
    transform: scale(0.94);
  }
}
</style>
