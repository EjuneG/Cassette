<br />
<p align="center">
  <img src="images/logo.png" alt="Logo" width="156" height="156">
  <h2 align="center" style="font-weight: 600">Cassette</h2>

  <p align="center">
    一台放在桌上的"录音棚磁带机" —— 第三方网易云音乐播放器
  </p>
</p>

## About

**Cassette** 是基于 [qier222/YesPlayMusic](https://github.com/qier222/YesPlayMusic) 的硬分叉（hard fork）。原项目已归档停更，Cassette 在其基础上独立演进，专注于个人日常使用与 UI 重塑。

设计北极星 —— **"The Studio Cassette"**：一台开发者桌面上的专用音频设备。中性的哑光机身，只有当前激活区域（底部 88px 的"磁带仓"）被一抹饱和的 **Tape Orange-Red** 点亮。双声部字体（sans 说话、mono 计量），暗色优先，动效是回应而非表演。

技术栈：**Vue 3 + Vuex 4 + Vue Router 4 + Howler.js + Vite + Electron 41**

> 设计系统文档见 [`PRODUCT.md`](PRODUCT.md) / [`DESIGN.md`](DESIGN.md) / [`.impeccable/shape-brief.md`](.impeccable/shape-brief.md)。

## 开发

```bash
# 安装依赖（用 yarn，不要用 npm）
yarn install

# 创建本地环境变量
cp .env.example .env

# 运行（网页端 Vite dev server）
yarn dev

# 运行（Electron 桌面端）
yarn electron:dev

# 单独运行 Netease API 服务（网页端开发时需要）
yarn netease_api:run
```

Node.js 版本要求：>= 18。

## 构建

```bash
yarn build              # 网页端生产构建
yarn build:electron     # Electron 渲染进程构建
yarn electron:build-main # Electron 主进程构建
```

Linux 本地安装：`ypm-update` 会构建 AppImage 并替换 `~/Applications/YesPlayMusic.AppImage`。

## 📜 License

基于 [MIT License](https://opensource.org/licenses/MIT) 开源。

- 原项目 **YesPlayMusic** 由 [@qier222](https://github.com/qier222) 开发（Copyright © 2020-2023）。
- **Cassette** 分叉与维护：[@EjuneG](https://github.com/EjuneG)（Copyright © 2026）。
- 音乐 API 来自 [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi)。
