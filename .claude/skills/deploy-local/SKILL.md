---
name: deploy-local
description: Build Electron app and replace local /opt/YesPlayMusic installation. Use when user wants to build, package, or deploy locally.
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash
---

# Deploy YesPlayMusic to Local Installation

Build the Electron app and replace the local installation at `/opt/YesPlayMusic/`.

## Current state

- **Running processes:** !`pgrep -c -f '/opt/YesPlayMusic/yesplaymusic' 2>/dev/null || echo "0"` process(es)
- **Installed version:** !`dpkg -s yesplaymusic 2>/dev/null | grep Version || echo "unknown"`
- **Package version:** !`node -e "console.log(require('./package.json').version)"`

## Steps

1. **Build renderer + main process in parallel:**
   - `yarn build:electron` (Vite renderer with IS_ELECTRON=true)
   - `yarn electron:build-main` (esbuild main + preload)

2. **Package AppImage:**
   - `npx electron-builder --linux AppImage`

3. **Kill running YesPlayMusic** (if any):
   - `pkill -9 -f '/opt/YesPlayMusic/yesplaymusic'`
   - Wait 1s, verify all processes are gone

4. **Replace installation** - this needs sudo, so tell the user to run:
   ```
   ! sudo cp -a ~/Workspace/YesPlayMusic/dist_electron/linux-unpacked/* /opt/YesPlayMusic/
   ```

5. **Done** - tell user they can launch YesPlayMusic from the app menu.

## Important

- Always run build steps in parallel where possible (renderer + main process).
- The sudo copy step CANNOT be run by Claude directly. Instruct the user to run it with the `!` prefix.
- Do NOT skip the electron-builder step - the unpacked output is needed for the replacement.
