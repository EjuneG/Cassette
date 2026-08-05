import { createApp } from 'vue';
import MiniPlayer from './MiniPlayer.vue';
import './mini.scss';

// Deliberately bare: no Vuex, no router, no i18n, no Player.js. The mini
// window is a dumb terminal driven by `mini:state` from the main process —
// importing the store here would spin up a second Player instance that
// fights the main renderer over localStorage. See
// .impeccable/mini-player-brief.md §0.
createApp(MiniPlayer).mount('#mini');
