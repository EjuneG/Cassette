<template>
  <div v-show="show" class="play-history-page">
    <header class="page-head">
      <div class="page-head-label">
        <span class="region-label region-label--lone">Recently Played</span>
      </div>
      <div class="history-toggle">
        <button
          :class="{ on: playHistoryMode === 'week' }"
          @click="playHistoryMode = 'week'"
          >{{ $t('library.playHistory.week') }}</button
        >
        <button
          :class="{ on: playHistoryMode === 'all' }"
          @click="playHistoryMode = 'all'"
          >{{ $t('library.playHistory.all') }}</button
        >
      </div>
    </header>

    <h1 class="page-title">{{ $t('library.playHistory.title') }}</h1>
    <p v-if="trackCount > 0" class="page-meta mono-stamp">
      {{ trackCount }} TRACKS
    </p>

    <TrackList
      v-if="playHistoryList.length > 0"
      :tracks="playHistoryList"
      :column-number="1"
      type="tracklist"
    />
    <div v-else class="empty-block">
      <span class="region-label region-label--lone">No history</span>
      <p class="empty-prompt mono-stamp">Play a track to start the log.</p>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import NProgress from 'nprogress';
import TrackList from '@/components/TrackList.vue';

export default {
  name: 'PlayHistory',
  components: { TrackList },
  data() {
    return {
      show: false,
      playHistoryMode: 'week',
    };
  },
  computed: {
    ...mapState(['liked']),
    playHistoryList() {
      if (this.playHistoryMode === 'week') {
        return this.liked.playHistory.weekData || [];
      }
      return this.liked.playHistory.allData || [];
    },
    trackCount() {
      return this.playHistoryList.length;
    },
  },
  created() {
    setTimeout(() => {
      if (!this.show) NProgress.start();
    }, 600);
    this.$store.dispatch('fetchPlayHistory').finally(() => {
      NProgress.done();
      this.show = true;
    });
  },
};
</script>

<style lang="scss" scoped>
.play-history-page {
  padding-top: 8px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--ink-strong);
  margin: 0;
}

.page-meta {
  margin-top: 6px;
  margin-bottom: 28px;
  color: var(--ink-soft);
}

.history-toggle {
  display: flex;
  gap: 2px;
  background: var(--housing-elev);
  border-radius: 6px;
  padding: 2px;

  button {
    padding: 4px 12px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
    transition: background-color var(--motion-fast) var(--ease-out),
      color var(--motion-fast) var(--ease-out);

    &:hover {
      color: var(--ink-strong);
    }

    &.on {
      background: var(--housing-base);
      color: var(--ink-strong);
    }
  }
}

.empty-block {
  margin-top: 64px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .empty-prompt {
    color: var(--ink-soft);
  }
}
</style>
