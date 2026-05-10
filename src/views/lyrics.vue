<template>
  <transition name="slide-up">
    <div class="lyrics-page" :class="{ 'no-lyric': noLyric }">
      <!-- Top bar — cover thumb + meta + close -->
      <header class="lyrics-top">
        <div class="lyrics-id">
          <button class="cover-thumb" :title="album.name" @click="goToAlbum">
            <img v-if="imageUrl" :src="imageUrl" loading="lazy" />
          </button>
          <div class="lyrics-meta">
            <div class="lyrics-track">
              <router-link
                v-if="hasList()"
                :to="`${getListPath()}`"
                @click="toggleLyrics"
                >{{ currentTrack.name }}</router-link
              >
              <span v-else>{{ currentTrack.name }}</span>
            </div>
            <div class="lyrics-sub">
              <router-link
                v-if="artist.id !== 0"
                :to="`/artist/${artist.id}`"
                @click="toggleLyrics"
                >{{ artist.name }}</router-link
              >
              <span v-else>{{ artist.name }}</span>
              <span v-if="album.id !== 0" class="dot-sep">·</span>
              <router-link
                v-if="album.id !== 0"
                :to="`/album/${album.id}`"
                :title="album.name"
                @click="toggleLyrics"
                >{{ album.name }}</router-link
              >
            </div>
          </div>
        </div>
        <div class="lyrics-stamps mono-stamp">
          <span>{{ formatTrackTime(player.progress) || '0:00' }}</span>
          <span class="time-sep">/</span>
          <span>{{
            formatTrackTime(player.currentTrackDuration) || '0:00'
          }}</span>
        </div>
        <div class="lyrics-actions">
          <button
            class="action-btn"
            :title="$t('player.like')"
            @click="likeATrack(player.currentTrack.id)"
          >
            <svg-icon
              :icon-class="player.isCurrentTrackLiked ? 'heart-solid' : 'heart'"
            />
          </button>
          <button
            class="action-btn"
            :title="$t('contextMenu.addToPlaylist')"
            @click="addToPlaylist"
          >
            <svg-icon icon-class="plus" />
          </button>
          <button class="action-btn" :title="'Fullscreen'" @click="fullscreen">
            <svg-icon v-if="isFullscreen" icon-class="fullscreen-exit" />
            <svg-icon v-else icon-class="fullscreen" />
          </button>
          <button class="action-btn" :title="'Close'" @click="toggleLyrics">
            <svg-icon icon-class="arrow-down" />
          </button>
        </div>
      </header>

      <!-- Region label, sits like a silkscreen tag -->
      <div class="lyrics-region">
        <span class="region-label region-label--lone">Lyrics</span>
      </div>

      <!-- Lyrics column -->
      <div class="lyrics-column">
        <div
          v-if="!noLyric"
          ref="lyricsContainer"
          class="lyrics-container"
          :style="lyricFontSize"
        >
          <div id="line-1" class="line line-spacer"></div>
          <div
            v-for="(line, index) in lyricToShow"
            :id="`line${index}`"
            :key="index"
            class="line"
            :class="{
              highlight: highlightLyricIndex === index,
              passed: highlightLyricIndex > index,
            }"
            @click="clickLyricLine(line.time)"
            @dblclick="clickLyricLine(line.time, true)"
          >
            <div class="content">
              <span
                v-if="line.contents[0]"
                @click.right="openLyricMenu($event, line, 0)"
                >{{ line.contents[0] }}</span
              >
              <span
                v-if="
                  line.contents[1] &&
                  $store.state.settings.showLyricsTranslation
                "
                class="translation"
                @click.right="openLyricMenu($event, line, 1)"
                >{{ line.contents[1] }}</span
              >
            </div>
          </div>
          <ContextMenu v-if="!noLyric" ref="lyricMenu">
            <div class="item" @click="copyLyric(false)">{{
              $t('contextMenu.copyLyric')
            }}</div>
            <div
              v-if="
                rightClickLyric &&
                rightClickLyric.contents[1] &&
                $store.state.settings.showLyricsTranslation
              "
              class="item"
              @click="copyLyric(true)"
              >{{ $t('contextMenu.copyLyricWithTranslation') }}</div
            >
          </ContextMenu>
        </div>
        <div v-else class="lyrics-empty">
          <span class="region-label region-label--lone">No lyrics</span>
          <p class="empty-prompt">{{
            $t('lyrics.empty') || 'No lyrics for this track.'
          }}</p>
        </div>
      </div>

      <!-- Lyric type switch (translation / pronunciation) -->
      <button
        v-show="
          isShowLyricTypeSwitch && $store.state.settings.showLyricsTranslation
        "
        class="lyric-type-toggle mono-stamp"
        :title="
          lyricType === 'translation'
            ? $t('player.translationLyric')
            : $t('player.PronunciationLyric')
        "
        @click="switchLyricType"
      >
        {{ lyricType === 'translation' ? '译' : '音' }}
      </button>
    </div>
  </transition>
</template>

<script>
import { mapState, mapMutations, mapActions } from 'vuex';
import ContextMenu from '@/components/ContextMenu.vue';
import { formatTrackTime } from '@/utils/common';
import { getLyric } from '@/api/track';
import { lyricParser, copyLyric } from '@/utils/lyrics';
import { isAccountLoggedIn } from '@/utils/auth';
import { hasListSource, getListSourcePath } from '@/utils/playList';
import { locale } from '@/locale';

export default {
  name: 'Lyrics',
  components: {
    ContextMenu,
  },
  data() {
    return {
      lyricsInterval: null,
      lyric: [],
      tlyric: [],
      romalyric: [],
      lyricType: 'translation',
      highlightLyricIndex: -1,
      isFullscreen: !!document.fullscreenElement,
      rightClickLyric: null,
    };
  },
  computed: {
    ...mapState(['player', 'settings', 'showLyrics']),
    currentTrack() {
      return this.player.currentTrack;
    },
    imageUrl() {
      const url = this.player.currentTrack?.al?.picUrl;
      return url ? url + '?param=256y256' : '';
    },
    isShowLyricTypeSwitch() {
      return this.romalyric.length > 0 && this.tlyric.length > 0;
    },
    lyricToShow() {
      return this.lyricType === 'translation'
        ? this.lyricWithTranslation
        : this.lyricWithRomaPronunciation;
    },
    lyricWithTranslation() {
      let ret = [];
      const lyricFiltered = this.lyric.filter(({ content }) =>
        Boolean(content)
      );
      if (lyricFiltered.length) {
        lyricFiltered.forEach(l => {
          const { rawTime, time, content } = l;
          const lyricItem = { time, content, contents: [content] };
          const sameTimeTLyric = this.tlyric.find(
            ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
          );
          if (sameTimeTLyric) {
            const { content: tLyricContent } = sameTimeTLyric;
            if (content) {
              lyricItem.contents.push(tLyricContent);
            }
          }
          ret.push(lyricItem);
        });
      }
      return ret;
    },
    lyricWithRomaPronunciation() {
      let ret = [];
      const lyricFiltered = this.lyric.filter(({ content }) =>
        Boolean(content)
      );
      if (lyricFiltered.length) {
        lyricFiltered.forEach(l => {
          const { rawTime, time, content } = l;
          const lyricItem = { time, content, contents: [content] };
          const sameTimeRomaLyric = this.romalyric.find(
            ({ rawTime: tLyricRawTime }) => tLyricRawTime === rawTime
          );
          if (sameTimeRomaLyric) {
            const { content: romaLyricContent } = sameTimeRomaLyric;
            if (content) {
              lyricItem.contents.push(romaLyricContent);
            }
          }
          ret.push(lyricItem);
        });
      }
      return ret;
    },
    lyricFontSize() {
      return {
        fontSize: `${this.$store.state.settings.lyricFontSize || 28}px`,
      };
    },
    noLyric() {
      return this.lyric.length == 0;
    },
    artist() {
      return this.currentTrack?.ar
        ? this.currentTrack.ar[0]
        : { id: 0, name: 'unknown' };
    },
    album() {
      return this.currentTrack?.al || { id: 0, name: 'unknown' };
    },
  },
  watch: {
    currentTrack() {
      this.getLyric();
    },
    showLyrics(show) {
      if (show) {
        this.setLyricsInterval();
        this.$store.commit('enableScrolling', false);
      } else {
        clearInterval(this.lyricsInterval);
        this.$store.commit('enableScrolling', true);
      }
    },
  },
  created() {
    this.getLyric();
    document.addEventListener('keydown', e => {
      if (e.key === 'F11') {
        e.preventDefault();
        this.fullscreen();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
  },
  unmounted() {
    clearInterval(this.lyricsInterval);
  },
  methods: {
    ...mapMutations(['toggleLyrics', 'updateModal']),
    ...mapActions(['likeATrack']),
    formatTrackTime(value) {
      return formatTrackTime(value);
    },
    fullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    },
    addToPlaylist() {
      if (!isAccountLoggedIn()) {
        this.showToast(locale.t('toast.needToLogin'));
        return;
      }
      this.$store.dispatch('fetchLikedPlaylist');
      this.updateModal({
        modalName: 'addTrackToPlaylistModal',
        key: 'show',
        value: true,
      });
      this.updateModal({
        modalName: 'addTrackToPlaylistModal',
        key: 'selectedTrackID',
        value: this.currentTrack?.id,
      });
    },
    goToAlbum() {
      if (this.album.id === 0) return;
      this.toggleLyrics();
      this.$router.push({ path: '/album/' + this.album.id });
    },
    getLyric() {
      if (!this.currentTrack.id) return;
      return getLyric(this.currentTrack.id).then(data => {
        if (!data?.lrc?.lyric) {
          this.lyric = [];
          this.tlyric = [];
          this.romalyric = [];
          return false;
        } else {
          let { lyric, tlyric, romalyric } = lyricParser(data);
          lyric = lyric.filter(
            l => !/^作(词|曲)\s*(:|：)\s*无$/.exec(l.content)
          );
          let includeAM =
            lyric.length <= 10 &&
            lyric.map(l => l.content).includes('纯音乐，请欣赏');
          if (includeAM) {
            let reg = /^作(词|曲)\s*(:|：)\s*/;
            let author = this.currentTrack?.ar[0]?.name;
            lyric = lyric.filter(l => {
              let regExpArr = l.content.match(reg);
              return (
                !regExpArr || l.content.replace(regExpArr[0], '') !== author
              );
            });
          }
          if (lyric.length === 1 && includeAM) {
            this.lyric = [];
            this.tlyric = [];
            this.romalyric = [];
            return false;
          } else {
            this.lyric = lyric;
            this.tlyric = tlyric;
            this.romalyric = romalyric;
            if (tlyric.length * romalyric.length > 0) {
              this.lyricType = 'translation';
            } else {
              this.lyricType =
                lyric.length > 0 ? 'translation' : 'romaPronunciation';
            }
            return true;
          }
        }
      });
    },
    switchLyricType() {
      this.lyricType =
        this.lyricType === 'translation' ? 'romaPronunciation' : 'translation';
    },
    clickLyricLine(value, startPlay = false) {
      let jumpFlag = false;
      this.lyric.filter(function (item) {
        if (item.content == '纯音乐，请欣赏') {
          jumpFlag = true;
        }
      });
      if (window.getSelection().toString().length === 0 && !jumpFlag) {
        this.player.seek(value);
      }
      if (startPlay === true) {
        this.player.play();
      }
    },
    openLyricMenu(e, lyric, idx) {
      this.rightClickLyric = { ...lyric, idx };
      this.$refs.lyricMenu.openMenu(e);
      e.preventDefault();
    },
    copyLyric(withTranslation) {
      if (this.rightClickLyric) {
        const idx = this.rightClickLyric.idx;
        if (!withTranslation) {
          copyLyric(this.rightClickLyric.contents[idx]);
        } else {
          copyLyric(this.rightClickLyric.contents.join(' '));
        }
      }
    },
    setLyricsInterval() {
      this.lyricsInterval = setInterval(() => {
        const progress = this.player.seek(null, false) ?? 0;
        let oldHighlightLyricIndex = this.highlightLyricIndex;
        this.highlightLyricIndex = this.lyric.findIndex((l, index) => {
          const nextLyric = this.lyric[index + 1];
          return (
            progress >= l.time && (nextLyric ? progress < nextLyric.time : true)
          );
        });
        if (oldHighlightLyricIndex !== this.highlightLyricIndex) {
          const el = document.getElementById(`line${this.highlightLyricIndex}`);
          if (el)
            el.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
        }
      }, 50);
    },
    hasList() {
      return hasListSource();
    },
    getListPath() {
      return getListSourcePath();
    },
  },
};
</script>

<style lang="scss" scoped>
.lyrics-page {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  background: var(--housing-base);
  color: var(--ink-strong);
  display: grid;
  grid-template-rows: auto auto 1fr;
  /* Anti-Apple-Music: no backdrop blur, no color extraction, no aurora. */
}

/* ------------ TOP BAR ------------ */
.lyrics-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 24px;
  padding: 18px 5vw 16px;
  border-bottom: 1px solid var(--housing-hairline);
  -webkit-app-region: drag;
}

.lyrics-id {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  -webkit-app-region: no-drag;
}

.cover-thumb {
  width: 56px;
  height: 56px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--housing-elev);
  padding: 0;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform var(--motion-fast) var(--ease-out);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    transform: scale(1.04);
  }
}

.lyrics-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lyrics-track {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--ink-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  a {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.lyrics-sub {
  font-size: 0.875rem;
  color: var(--ink-mid);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  .dot-sep {
    margin: 0 6px;
    opacity: 0.6;
  }

  a {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.lyrics-stamps {
  display: flex;
  gap: 6px;
  color: var(--ink-soft);
  letter-spacing: 0.06em;
  -webkit-app-region: no-drag;

  .time-sep {
    opacity: 0.5;
  }
}

.lyrics-actions {
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  background: transparent;
  transition: background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: var(--housing-elev);
    color: var(--ink-strong);
  }
}

/* ------------ REGION LABEL ------------ */
.lyrics-region {
  padding: 14px 5vw 0;
  display: flex;
  justify-content: center;
}

/* ------------ LYRICS COLUMN ------------ */
.lyrics-column {
  display: flex;
  justify-content: center;
  overflow: hidden;
  padding: 8px 5vw calc(var(--shell-bottom) + 24px);
}

.lyrics-container {
  width: min(720px, 90%);
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  text-align: center;

  &::-webkit-scrollbar {
    display: none;
  }
}

.line {
  margin: 14px 0;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color var(--motion-base) var(--ease-out);

  &:hover {
    background: var(--housing-elev);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    transition: transform var(--motion-base) var(--ease-out);

    span {
      color: var(--ink-strong);
      opacity: 0.32;
      font-weight: 500;
      line-height: 1.45;
      transition: opacity var(--motion-base) var(--ease-out),
        color var(--motion-base) var(--ease-out);
    }

    span.translation {
      font-size: 0.7em;
      opacity: 0.22;
    }
  }

  &.passed .content span {
    opacity: 0.18;
  }

  &.highlight {
    background: transparent;

    .content {
      transform: scale(1.04);
    }

    .content span {
      opacity: 1;
      color: var(--tape-orange);
    }

    .content span.translation {
      opacity: 0.7;
      color: var(--tape-orange);
    }
  }
}

.line.line-spacer {
  margin-top: 30vh;
  pointer-events: none;
  background: transparent !important;
  opacity: 0;
}

.lyrics-container > .line:last-child {
  margin-bottom: calc(40vh);
}

/* ------------ EMPTY STATE ------------ */
.lyrics-empty {
  width: min(720px, 90%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-top: 18vh;
  align-self: center;
  text-align: center;

  .empty-prompt {
    font-size: 0.9375rem;
    color: var(--ink-soft);
  }
}

/* ------------ LYRIC TYPE SWITCH ------------ */
.lyric-type-toggle {
  position: fixed;
  right: 24px;
  bottom: calc(var(--shell-bottom) + 16px);
  z-index: 210;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--housing-elev);
  color: var(--ink-mid);
  font-size: 13px;
  letter-spacing: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color var(--motion-fast) var(--ease-out),
    background-color var(--motion-fast) var(--ease-out);

  &:hover {
    color: var(--tape-orange);
    background: var(--tape-orange-soft);
  }
}

/* ------------ TRANSITION ------------ */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform var(--motion-slow) var(--ease-out);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
