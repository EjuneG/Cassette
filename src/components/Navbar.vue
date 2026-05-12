<template>
  <div>
    <nav :class="{ 'has-custom-titlebar': hasCustomTitlebar }">
      <Win32Titlebar v-if="enableWin32Titlebar" />
      <LinuxTitlebar v-if="enableLinuxTitlebar" />
      <div class="nav-left">
        <button-icon
          class="nav-button"
          :title="$t('nav.back')"
          @click="go('back')"
          ><svg-icon icon-class="arrow-left"
        /></button-icon>
        <button-icon
          class="nav-button"
          :title="$t('nav.forward')"
          @click="go('forward')"
          ><svg-icon icon-class="arrow-right"
        /></button-icon>
      </div>

      <div class="nav-right">
        <div class="search-box" :class="{ active: inputFocus }">
          <svg-icon icon-class="search" />
          <input
            ref="searchInput"
            v-model="keywords"
            type="search"
            :placeholder="$t('nav.search')"
            @keydown.enter="doSearch"
            @focus="inputFocus = true"
            @blur="inputFocus = false"
          />
          <span v-if="!inputFocus" class="search-hint mono-stamp">/</span>
        </div>
        <button class="avatar-button" @click="showUserProfileMenu">
          <img class="avatar" :src="avatarUrl" loading="lazy" />
        </button>
      </div>
    </nav>

    <ContextMenu ref="userProfileMenu">
      <div class="item" @click="toSettings">
        <svg-icon icon-class="settings" />
        {{ $t('library.userProfileMenu.settings') }}
      </div>
      <div v-if="!isLooseLoggedIn" class="item" @click="toLogin">
        <svg-icon icon-class="login" />
        {{ $t('login.login') }}
      </div>
      <div v-if="isLooseLoggedIn" class="item" @click="logout">
        <svg-icon icon-class="logout" />
        {{ $t('library.userProfileMenu.logout') }}
      </div>
      <hr />
      <div class="item" @click="toGitHub">
        <svg-icon icon-class="github" />
        {{ $t('nav.github') }}
      </div>
    </ContextMenu>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { isLooseLoggedIn, doLogout } from '@/utils/auth';
import { resizeImage } from '@/utils/filters';

import 'vscode-codicons/dist/codicon.css';

import Win32Titlebar from '@/components/Win32Titlebar.vue';
import LinuxTitlebar from '@/components/LinuxTitlebar.vue';
import ContextMenu from '@/components/ContextMenu.vue';
import ButtonIcon from '@/components/ButtonIcon.vue';

export default {
  name: 'Navbar',
  components: {
    Win32Titlebar,
    LinuxTitlebar,
    ButtonIcon,
    ContextMenu,
  },
  data() {
    return {
      inputFocus: false,
      keywords: '',
      enableWin32Titlebar: false,
      enableLinuxTitlebar: false,
    };
  },
  computed: {
    ...mapState(['settings', 'data']),
    isLooseLoggedIn() {
      return isLooseLoggedIn();
    },
    avatarUrl() {
      return this.data?.user?.avatarUrl && this.isLooseLoggedIn
        ? resizeImage(this.data.user.avatarUrl, 64)
        : resizeImage(
            'http://s4.music.126.net/style/web2/img/default/default_avatar.jpg',
            64
          );
    },
    hasCustomTitlebar() {
      return this.enableWin32Titlebar || this.enableLinuxTitlebar;
    },
  },
  created() {
    if (process.platform === 'win32') {
      this.enableWin32Titlebar = true;
    } else if (
      process.platform === 'linux' &&
      this.settings.linuxEnableCustomTitlebar
    ) {
      this.enableLinuxTitlebar = true;
    }
    window.addEventListener('keydown', this.handleGlobalKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleGlobalKeydown);
  },
  methods: {
    go(where) {
      if (where === 'back') this.$router.go(-1);
      else this.$router.go(1);
    },
    doSearch() {
      if (!this.keywords) return;
      if (
        this.$route.name === 'search' &&
        this.$route.params.keywords === this.keywords
      ) {
        return;
      }
      this.$router.push({
        name: 'search',
        params: { keywords: this.keywords },
      });
    },
    showUserProfileMenu(e) {
      this.$refs.userProfileMenu.openMenu(e);
    },
    logout() {
      if (!confirm('确定要退出登录吗？')) return;
      doLogout();
      this.$router.push({ name: 'library' });
    },
    toSettings() {
      this.$router.push({ name: 'settings' });
    },
    toGitHub() {
      window.open('https://github.com/qier222/YesPlayMusic');
    },
    toLogin() {
      if (process.env.IS_ELECTRON === true) {
        this.$router.push({ name: 'loginAccount' });
      } else {
        this.$router.push({ name: 'login' });
      }
    },
    handleGlobalKeydown(e) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        this.$refs.searchInput?.focus();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--shell-top);
  padding: 0 var(--shell-pad-x);
  background-color: var(--housing-base);
  border-bottom: 1px solid var(--housing-hairline);
  z-index: 100;
  -webkit-app-region: drag;
}

nav.has-custom-titlebar {
  padding-top: 20px;
  height: calc(var(--shell-top) + 20px);
  -webkit-app-region: no-drag;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
}

.nav-left {
  gap: 4px;
}

.nav-button {
  -webkit-app-region: no-drag;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  transition: background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);

  &:hover {
    background: var(--housing-elev);
    color: var(--ink-strong);
  }

  :deep(.svg-icon) {
    width: 16px;
    height: 16px;
  }
}

.nav-right {
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  width: 220px;
  background: var(--housing-elev);
  border: 1px solid transparent;
  border-radius: 6px;
  -webkit-app-region: no-drag;
  transition: border-color var(--motion-fast) var(--ease-out),
    background-color var(--motion-fast) var(--ease-out);

  :deep(.svg-icon) {
    width: 13px;
    height: 13px;
    color: var(--ink-soft);
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-strong);
    width: 100%;

    &::placeholder {
      color: var(--ink-soft);
      font-weight: 500;
    }
  }

  .search-hint {
    color: var(--ink-faint);
    background: var(--housing-base);
    padding: 1px 6px;
    border-radius: 3px;
    border: 1px solid var(--housing-hairline);
    font-size: 0.6875rem;
    line-height: 1;
  }

  &.active {
    background: var(--housing-elev);
    border-color: var(--housing-divider);

    :deep(.svg-icon) {
      color: var(--ink-strong);
    }
  }
}

.avatar-button {
  -webkit-app-region: no-drag;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--motion-fast) var(--ease-out);

  .avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--housing-hairline);
    -webkit-user-drag: none;
    user-select: none;
  }

  &:hover {
    transform: scale(1.06);
  }
}
</style>
