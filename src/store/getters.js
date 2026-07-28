export default {
  // liked.songs 动辄上千条，而每个 TrackListItem 都要判断自己是否被喜欢。
  // 逐条 Array.includes 是 O(n²)，渲染「我喜欢的音乐」时会成为首屏长任务的一部分。
  // 共享一个 Set，把单次判断降到 O(1)。
  likedSongIdSet(state) {
    return new Set(state.liked.songs);
  },
};
