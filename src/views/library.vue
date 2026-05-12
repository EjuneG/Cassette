<template>
  <div v-show="show" ref="library" class="library-page">
    <!-- ========== SIDE A — fast entries ========== -->
    <header class="region-header">
      <span class="region-label">Side A</span>
    </header>

    <section class="side-a">
      <!-- Liked Songs entry — the headline tape -->
      <button class="entry entry-liked" @click="goToLikedSongsList">
        <div class="entry-top">
          <span class="entry-tag mono-stamp">A1</span>
          <span class="entry-count mono-stamp"
            >{{ liked.songs.length }} TRACKS</span
          >
        </div>
        <div class="entry-foot">
          <span class="entry-cta mono-stamp">PLAY</span>
          <span
            class="play-icon"
            :title="$t('common.play')"
            @click.stop="openPlayModeTabMenu"
          >
            <svg-icon icon-class="play" />
          </span>
        </div>
      </button>

      <!-- Recently Played entry — links to dedicated page -->
      <button class="entry entry-recent" @click="goToPlayHistory">
        <div class="entry-top">
          <span class="entry-tag mono-stamp">A2</span>
          <span class="entry-count mono-stamp">{{ recentCount }} TRACKS</span>
        </div>
        <div class="entry-foot">
          <span class="entry-cta mono-stamp">VIEW LOG</span>
          <span class="chevron">→</span>
        </div>
      </button>
    </section>

    <!-- ========== SIDE B — the library proper ========== -->
    <header class="region-header region-header--side-b">
      <span class="region-label">Side B</span>
    </header>

    <section class="side-b">
      <div class="drawer-tabs">
        <button
          class="drawer-tab"
          :class="{ on: currentTab === 'playlists' }"
          @click="updateCurrentTab('playlists')"
        >
          <span class="drawer-tab-text">{{ $t('library.playlists') }}</span>
          <span
            v-if="currentTab === 'playlists'"
            class="drawer-tab-filter mono-stamp"
            @click.stop="openPlaylistTabMenu"
          >
            {{
              {
                all: $t('contextMenu.allPlaylists'),
                mine: $t('contextMenu.minePlaylists'),
                liked: $t('contextMenu.likedPlaylists'),
              }[playlistFilter]
            }}
            <svg-icon icon-class="dropdown" />
          </span>
        </button>
        <button
          class="drawer-tab"
          :class="{ on: currentTab === 'albums' }"
          @click="updateCurrentTab('albums')"
        >
          <span class="drawer-tab-text">{{ $t('library.albums') }}</span>
        </button>
        <button
          class="drawer-tab"
          :class="{ on: currentTab === 'artists' }"
          @click="updateCurrentTab('artists')"
        >
          <span class="drawer-tab-text">{{ $t('library.artists') }}</span>
        </button>

        <div class="drawer-tabs-spacer"></div>

        <button
          v-show="currentTab === 'playlists'"
          class="drawer-action"
          @click="openAddPlaylistModal"
        >
          <svg-icon icon-class="plus" />
          <span>{{ $t('library.newPlayList') }}</span>
        </button>
      </div>

      <div v-show="currentTab === 'playlists'" class="drawer-body">
        <CoverRow
          v-if="liked.playlists.length > 1"
          :items="filterPlaylists"
          type="playlist"
          sub-text="creator"
          :show-play-button="true"
          :column-number="6"
          gap="28px 18px"
          sub-text-font-size="13px"
        />
        <div v-else class="empty-block">
          <span class="mono-stamp">No playlists.</span>
        </div>
      </div>

      <div v-show="currentTab === 'albums'" class="drawer-body">
        <CoverRow
          v-if="liked.albums && liked.albums.length > 0"
          :items="liked.albums"
          type="album"
          sub-text="artist"
          :show-play-button="true"
          :column-number="6"
          gap="28px 18px"
          sub-text-font-size="13px"
        />
        <div v-else class="empty-block">
          <span class="mono-stamp">No albums.</span>
        </div>
      </div>

      <div v-show="currentTab === 'artists'" class="drawer-body">
        <CoverRow
          v-if="liked.artists && liked.artists.length > 0"
          :items="liked.artists"
          type="artist"
          :show-play-button="true"
          :column-number="6"
          gap="28px 18px"
          sub-text-font-size="13px"
        />
        <div v-else class="empty-block">
          <span class="mono-stamp">No artists.</span>
        </div>
      </div>
    </section>

    <ContextMenu ref="playlistTabMenu">
      <div class="item" @click="changePlaylistFilter('all')">{{
        $t('contextMenu.allPlaylists')
      }}</div>
      <hr />
      <div class="item" @click="changePlaylistFilter('mine')">{{
        $t('contextMenu.minePlaylists')
      }}</div>
      <div class="item" @click="changePlaylistFilter('liked')">{{
        $t('contextMenu.likedPlaylists')
      }}</div>
    </ContextMenu>

    <ContextMenu ref="playModeTabMenu">
      <div class="item" @click="playLikedSongs">{{
        $t('library.likedSongs')
      }}</div>
      <hr />
      <div class="item" @click="playIntelligenceList">{{
        $t('contextMenu.cardiacMode')
      }}</div>
    </ContextMenu>
  </div>
</template>

<script>
import { mapActions, mapMutations, mapState } from 'vuex';
import { dailyTask } from '@/utils/common';
import { isAccountLoggedIn } from '@/utils/auth';
import NProgress from 'nprogress';
import { locale } from '@/locale';

import ContextMenu from '@/components/ContextMenu.vue';
import CoverRow from '@/components/CoverRow.vue';
import SvgIcon from '@/components/SvgIcon.vue';

export default {
  name: 'Library',
  components: { SvgIcon, CoverRow, ContextMenu },
  inject: ['scrollToMain', 'restoreScrollPosition'],
  data() {
    return {
      show: false,
      currentTab: 'playlists',
    };
  },
  computed: {
    ...mapState(['data', 'liked']),
    playlistFilter() {
      return this.data.libraryPlaylistFilter || 'all';
    },
    filterPlaylists() {
      const playlists = this.liked.playlists.slice(1);
      const userId = this.data.user.userId;
      if (this.playlistFilter === 'mine') {
        return playlists.filter(p => p.creator.userId === userId);
      } else if (this.playlistFilter === 'liked') {
        return playlists.filter(p => p.creator.userId !== userId);
      }
      return playlists;
    },
    recentCount() {
      return (this.liked.playHistory.weekData || []).length;
    },
  },
  created() {
    setTimeout(() => {
      if (!this.show) NProgress.start();
    }, 1000);
  },
  activated() {
    this.restoreScrollPosition();
    this.loadData();
    dailyTask();
  },
  methods: {
    ...mapActions(['showToast']),
    ...mapMutations(['updateModal', 'updateData']),
    loadData() {
      if (this.liked.songsWithDetails.length > 0) {
        NProgress.done();
        this.show = true;
      } else {
        this.$store.dispatch('fetchLikedSongsWithDetails').then(() => {
          NProgress.done();
          this.show = true;
        });
      }
      this.$store.dispatch('fetchLikedSongs');
      this.$store.dispatch('fetchLikedPlaylist');
      this.$store.dispatch('fetchLikedAlbums');
      this.$store.dispatch('fetchLikedArtists');
      this.$store.dispatch('fetchPlayHistory');
    },
    playLikedSongs() {
      this.$store.state.player.playPlaylistByID(
        this.liked.playlists[0].id,
        'first',
        true
      );
    },
    playIntelligenceList() {
      this.$store.state.player.playIntelligenceListById(
        this.liked.playlists[0].id,
        'first',
        true
      );
    },
    updateCurrentTab(tab) {
      if (!isAccountLoggedIn() && tab !== 'playlists') {
        this.showToast(locale.t('toast.needToLogin'));
        return;
      }
      this.currentTab = tab;
    },
    goToLikedSongsList() {
      this.$router.push({ path: '/library/liked-songs' });
    },
    goToPlayHistory() {
      this.$router.push({ path: '/library/play-history' });
    },
    openAddPlaylistModal() {
      if (!isAccountLoggedIn()) {
        this.showToast(locale.t('toast.needToLogin'));
        return;
      }
      this.updateModal({
        modalName: 'newPlaylistModal',
        key: 'show',
        value: true,
      });
    },
    openPlaylistTabMenu(e) {
      this.$refs.playlistTabMenu.openMenu(e);
    },
    openPlayModeTabMenu(e) {
      this.$refs.playModeTabMenu.openMenu(e);
    },
    changePlaylistFilter(type) {
      this.updateData({ key: 'libraryPlaylistFilter', value: type });
    },
  },
};
</script>

<style lang="scss" scoped>
.library-page {
  padding-top: 8px;
}

.region-header {
  display: flex;
  align-items: center;
  margin: 6px 0 18px;

  &--side-b {
    margin-top: 40px;
  }
}

/* ============================== SIDE A ============================== */

.side-a {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

@media (max-width: 900px) {
  .side-a {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.entry {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  padding: 18px 22px 16px;
  height: 138px;
  background: var(--housing-elev);
  border: 1px solid var(--housing-hairline);
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: border-color var(--motion-base) var(--ease-out),
    transform var(--motion-base) var(--ease-out);

  &:hover {
    border-color: var(--housing-divider);
    background: var(--housing-elev);
    transform: translateY(-1px);
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .entry-tag {
    color: var(--ink-soft);
    letter-spacing: 0.18em;
  }
  .entry-count {
    color: var(--ink-soft);
  }
}

.entry-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.entry-cta {
  color: var(--ink-soft);
  letter-spacing: 0.16em;
}

.entry-liked {
  .play-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    background: var(--tape-orange);
    color: var(--tape-orange-ink);
    transition: transform var(--motion-fast) var(--ease-out),
      box-shadow var(--motion-fast) var(--ease-out);

    :deep(.svg-icon) {
      width: 12px;
      height: 12px;
      margin-left: 2px;
    }

    &:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 16px -6px var(--tape-orange);
    }
  }
}

.entry-recent .chevron {
  color: var(--ink-soft);
  font-size: 20px;
  line-height: 1;
  transition: transform var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.entry-recent:hover .chevron {
  color: var(--ink-strong);
  transform: translateX(2px);
}

/* ============================== SIDE B ============================== */

.side-b {
  margin-top: 4px;
  min-height: 200px;
}

.drawer-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--housing-hairline);
}

.drawer-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 6px;
  margin-right: 18px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--ink-soft);
  background: transparent;
  border-radius: 0;
  cursor: pointer;
  transition: color var(--motion-fast) var(--ease-out);

  .drawer-tab-text {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 13px;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: var(--ink-strong);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--motion-base) var(--ease-out);
  }

  &:hover {
    color: var(--ink-strong);
  }

  &.on {
    color: var(--ink-strong);

    &::after {
      transform: scaleX(1);
    }
  }
}

.drawer-tab-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--housing-elev);
  color: var(--ink-mid);
  padding: 3px 6px 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-size: 0.625rem;

  :deep(.svg-icon) {
    width: 10px;
    height: 10px;
  }

  &:hover {
    color: var(--ink-strong);
  }
}

.drawer-tabs-spacer {
  flex: 1;
}

.drawer-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-mid);
  background: transparent;
  transition: background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);

  :deep(.svg-icon) {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: var(--housing-elev);
    color: var(--ink-strong);
  }
}

.drawer-body {
  padding-top: 4px;
}

/* Tighten the CoverRow text and shrink covers slightly to match the
   Studio Cassette density. Reaching across the scoped border with :deep().
   The CoverRow's columnNumber prop controls grid; here we trim text size
   and meta opacity for visual consistency with the new tokens. */
.drawer-body :deep(.cover-row) {
  .text {
    margin-top: 8px;
  }
  .title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--ink-strong);
  }
  .info {
    font-size: 11px;
    color: var(--ink-soft);
    opacity: 1;
  }
}

.empty-block {
  padding: 28px 0;
  text-align: center;
  color: var(--ink-soft);
  border: 1px dashed var(--housing-hairline);
  border-radius: 8px;
}
</style>
