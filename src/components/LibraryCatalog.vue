<template>
  <ul class="catalog" :class="`catalog--${type}`">
    <li v-for="(item, i) in items" :key="item.id" class="cat-row">
      <span class="cat-index mono-stamp">{{ pad(i + 1) }}</span>

      <span class="cat-main">
        <router-link class="cat-name" :to="`/${type}/${item.id}`">{{
          item.name
        }}</router-link>
        <span v-if="subText(item)" class="cat-sub">{{ subText(item) }}</span>
      </span>

      <span class="cat-end">
        <span v-if="metaText(item)" class="cat-meta mono-stamp">{{
          metaText(item)
        }}</span>
        <button
          class="cat-play"
          :title="$t('common.play')"
          :aria-label="$t('common.play')"
          @click="play(item)"
        >
          <svg-icon icon-class="play" />
        </button>
      </span>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'LibraryCatalog',
  props: {
    items: { type: Array, required: true },
    type: {
      type: String,
      required: true,
      validator: v => ['playlist', 'album', 'artist'].includes(v),
    },
  },
  computed: {
    pad2() {
      return String(this.items.length).length;
    },
  },
  methods: {
    pad(n) {
      return String(n).padStart(Math.max(2, this.pad2), '0');
    },
    subText(item) {
      if (this.type === 'playlist') {
        return item.creator ? 'by ' + item.creator.nickname : null;
      }
      if (this.type === 'album') {
        if (item.artist && item.artist.name) return item.artist.name;
        if (item.artists && item.artists.length) return item.artists[0].name;
        return null;
      }
      return null; // artist rows stay single-line
    },
    metaText(item) {
      if (this.type === 'playlist') return item.trackCount || null;
      if (this.type === 'album') return item.size || null;
      if (this.type === 'artist') return item.albumSize || null;
      return null;
    },
    play(item) {
      const player = this.$store.state.player;
      const actions = {
        album: player.playAlbumByID,
        playlist: player.playPlaylistByID,
        artist: player.playArtistByID,
      };
      actions[this.type].bind(player)(item.id);
    },
  },
};
</script>

<style lang="scss" scoped>
.catalog {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 10px;
  row-gap: 2px;
}

@media (max-width: 1280px) {
  .catalog {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .catalog {
    grid-template-columns: minmax(0, 1fr);
  }
}

.cat-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 9px 12px 9px 10px;
  border-radius: 7px;
  transition: background-color var(--motion-fast) var(--ease-out);

  &:hover {
    background: var(--housing-elev);
  }
}

.cat-index {
  flex: none;
  width: auto;
  min-width: 1.6em;
  color: var(--ink-faint);
  letter-spacing: 0.08em;
  transition: color var(--motion-fast) var(--ease-out);
}

.cat-row:hover .cat-index,
.cat-row:focus-within .cat-index {
  color: var(--tape-orange);
}

.cat-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.cat-name {
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--ink-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* stretched-link: the whole row navigates, but the play button (z-index 1)
     sits above this overlay and keeps its own click. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  &:hover {
    text-decoration: none;
  }

  &:focus-visible {
    outline: 2px solid var(--tape-orange);
    outline-offset: 2px;
    border-radius: 3px;
  }
}

.cat-sub {
  font-size: 12px;
  line-height: 1.3;
  color: var(--ink-mid);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Right slot: the count sits here at rest; the play button overlays the same
   spot and swaps in on hover, so the row width never shifts. */
.cat-end {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 26px;
  height: 26px;
}

.cat-meta {
  color: var(--ink-mid);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  transition: opacity var(--motion-fast) var(--ease-out);
}

.cat-row:hover .cat-meta,
.cat-row:focus-within .cat-meta {
  /* fade the count out so the play affordance reads as the active control */
  opacity: 0;
}

.cat-play {
  position: absolute;
  right: 0;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: var(--tape-orange);
  color: var(--tape-orange-ink);
  opacity: 0;
  transform: scale(0.85);
  pointer-events: none;
  transition: opacity var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out),
    background-color var(--motion-fast) var(--ease-out);

  :deep(.svg-icon) {
    width: 10px;
    height: 10px;
    margin-left: 2px;
  }

  &:hover {
    background: var(--tape-orange-bright);
  }

  &:active {
    transform: scale(0.92);
  }

  /* global `button:focus { outline: none }` strips the keyboard ring; restore
     it here. Orange button → use an ink ring so it stays visible. */
  &:focus-visible {
    outline: 2px solid var(--ink-strong);
    outline-offset: 2px;
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }
}

.cat-row:hover .cat-play,
.cat-row:focus-within .cat-play {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

/* Artist rows carry no sub line; center the single line cleanly. */
.catalog--artist .cat-main {
  justify-content: center;
}
</style>
