<template>
  <div ref="contextMenu" class="context-menu">
    <div
      v-if="showMenu"
      ref="menu"
      class="menu"
      tabindex="-1"
      :style="{ top: top, left: left }"
      @blur="closeMenu"
      @click="closeMenu"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ContextMenu',
  data() {
    return {
      showMenu: false,
      top: '0px',
      left: '0px',
    };
  },
  methods: {
    setMenu(top, left) {
      // Leave room for the 88px tape compartment.
      const heightOffset = 96;
      const largestHeight =
        window.innerHeight - this.$refs.menu.offsetHeight - heightOffset;
      const largestWidth = window.innerWidth - this.$refs.menu.offsetWidth - 24;
      if (top > largestHeight) top = largestHeight;
      if (left > largestWidth) left = largestWidth;
      this.top = top + 'px';
      this.left = left + 'px';
    },

    closeMenu() {
      this.showMenu = false;
      this.$emit('close-menu');
      this.$store.commit('enableScrolling', true);
    },

    openMenu(e) {
      this.showMenu = true;
      this.$nextTick(
        function () {
          this.$refs.menu.focus();
          this.setMenu(e.y, e.x);
        }.bind(this)
      );
      e.preventDefault();
      this.$store.commit('enableScrolling', false);
    },
  },
};
</script>

<style lang="scss" scoped>
.context-menu {
  width: 100%;
  height: 100%;
  user-select: none;
}

.menu {
  position: fixed;
  min-width: 184px;
  max-width: 280px;
  list-style: none;
  background: var(--housing-elev);
  border: 1px solid var(--housing-divider);
  border-radius: 8px;
  box-shadow: 0 12px 32px -12px oklch(0% 0 0 / 0.32),
    0 2px 4px -2px oklch(0% 0 0 / 0.18);
  padding: 6px;
  box-sizing: border-box;
  z-index: 1000;
  -webkit-app-region: no-drag;

  &:focus {
    outline: none;
  }
}

/* Slot-content styles must reach across scoped boundary with :deep(). */

.menu :deep(.item) {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  color: var(--ink-strong);
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);

  .svg-icon {
    height: 14px;
    width: 14px;
    color: var(--ink-soft);
  }

  &:hover {
    background: var(--housing-elev);
    color: var(--ink-strong);

    .svg-icon {
      color: var(--ink-strong);
    }
  }

  &:active {
    background: var(--housing-divider);
  }
}

.menu :deep(hr) {
  margin: 4px 6px;
  height: 1px;
  background: var(--housing-divider);
  border: none;
  opacity: 0.6;
}

/* The track-preview header that some menus put at the top. */
.menu :deep(.item-info) {
  padding: 8px 10px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ink-strong);
  cursor: default;
  user-select: none;

  img {
    height: 44px !important;
    width: 44px !important;
    border-radius: 4px;
    object-fit: cover;
    border: 1px solid var(--housing-hairline);
    flex-shrink: 0;
  }

  .info {
    min-width: 0;
    flex: 1;
  }

  .title {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-strong);
    line-height: 1.25;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    word-break: break-all;
  }

  .subtitle {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--ink-soft);
    letter-spacing: 0.04em;
    margin-top: 2px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    overflow: hidden;
    word-break: break-all;
  }
}
</style>
