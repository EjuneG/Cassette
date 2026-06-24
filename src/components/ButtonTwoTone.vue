<template>
  <button :style="buttonStyle" :class="color">
    <svg-icon
      v-if="iconClass !== null"
      :icon-class="iconClass"
      :style="{ marginRight: iconButton ? '0px' : '8px' }"
    />
    <slot></slot>
  </button>
</template>

<script>
export default {
  name: 'ButtonTwoTone',
  props: {
    iconClass: {
      type: String,
      default: null,
    },
    iconButton: {
      type: Boolean,
      default: false,
    },
    horizontalPadding: {
      type: Number,
      default: 16,
    },
    color: {
      type: String,
      default: 'grey',
    },
    shape: {
      type: String,
      default: 'square',
    },
  },
  computed: {
    buttonStyle() {
      return {
        borderRadius: this.shape === 'round' ? '50%' : '8px',
        padding: `8px ${this.horizontalPadding}px`,
        width: this.shape === 'round' ? '38px' : 'auto',
      };
    },
  },
};
</script>

<style lang="scss" scoped>
button {
  height: 40px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 18px;
  font-weight: 600;
  background-color: var(--housing-elev);
  color: var(--ink-strong);
  margin-right: 12px;
  transition: background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out);
  user-select: none;
  .svg-icon {
    width: 16px;
    height: 16px;
  }
  &:active {
    transform: scale(0.94);
  }
}
button.orange {
  background-color: var(--tape-orange-soft);
  color: var(--tape-orange);
  &:hover {
    background-color: oklch(64% 0.18 38 / 0.28);
    color: var(--tape-orange-bright);
  }
}
button.grey {
  background-color: var(--color-secondary-bg);
  color: var(--color-text);
  opacity: 0.78;
  &:hover {
    background-color: var(--housing-divider);
    opacity: 1;
  }
}
button.transparent {
  background-color: transparent;
  &:hover {
    background-color: var(--housing-elev);
  }
}
</style>
