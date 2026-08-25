# ImageStudio Lite

一个轻量、自带 API Key 的 AI 图片生成工具。基于 Next.js，兼容 OpenAI 图片生成协议（`/images/generations`、`/images/edits`），可直接对接官方 API 或任意兼容中转站。

## 功能

- **文生图 / 图生图**：上传参考图即自动切换到编辑模式
- **Grok Imagine 图片**：模型名以 `grok-imagine` 开头时自动切换到 xAI 原生协议（`aspect_ratio` + `resolution`），无需额外配置
- **Grok Imagine 视频**：独立的「视频生成」页面，文生视频 / 图生视频，异步任务轮询进度
- **NovelAI 图片**：模型名以 `nai-diffusion` 开头时自动切换到 NovelAI 参数面板，详见下文
- **正负面提示词**：所有模型都可展开负面提示词输入框，内容随生成记录一起保存
- **并行生成**：最多同时开 3 个独立卡片，各自设置不同提示词、分辨率、画幅、质量、格式，并行发起请求
- **多套连接配置**：可保存多个 API Key / Base URL / 模型组合，随时切换
- **本地历史画廊**：最近 20 张生成结果自动保存在浏览器本地（IndexedDB），支持查看参数、单张下载、删除
- **隐私优先**：API Key 只保存在你自己的浏览器里，图片和历史记录也只存在本地，不经过任何第三方服务器落盘。视频生成例外：结果是服务商返回的临时链接，不落盘转存，请及时下载

## NovelAI 说明

模型名以 `nai-diffusion` 开头时，卡片会换成 NovelAI 专用参数面板：

- **画布尺寸**：NovelAI 只接受固定几档尺寸，所以这里用预设按钮代替「分辨率 × 画幅」组合。带琥珀色圆点的尺寸超出免费档，会按 Anlas 公式计费
- **高级参数**（默认折叠）：采样器、噪声调度、步数、引导强度、不良内容预设（Undesired Content）、质量标签。默认值取官方推荐：`k_euler_ancestral` + `karras` + 28 步 + Scale 5
- **步数与计费**：实测 28 步计 0 Gems，**29 步就跳到 60 Gems**，边界没有过渡。滑块超过 28 会变琥珀色，且生成前会弹确认框
- **不出现的控件**：质量、格式（NovelAI 只返回 PNG）、参考图上传（图生图需要走中转站的低层 native 接口，本项目未接）
- **暂不支持种子**：实测所用中转站在 OpenAI 兼容层和 YesNAI 原生层都会丢弃 `seed`，同一 seed 出图仍然不同，因此没有提供种子输入框以免误导

## 快速开始（本地开发）

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，在页面右上角「连接设置」里填入你的 API Base URL 和 API Key 即可使用。

> 若 `npm run dev` 启动后页面能显示但点击无反应，且日志里出现 Turbopack `Next.js package not found` panic，改用 `npm run build && npm start` 验证。这是本地 Turbopack 缓存问题，与业务代码无关。

## 当前在线地址

- [https://img.starroute.me/](https://img.starroute.me/)（自定义子域名，推荐）
- [https://imagestudio-lite.vercel.app/](https://imagestudio-lite.vercel.app/)（Vercel 备用地址）

`starroute.me` 根域名和 `api.starroute.me` 不属于本项目：前者未绑定到 ImageStudio，后者继续用于原有 API 中转服务。

## 一键部署到 Vercel

本项目的接口（`/api/generate`、`/api/models`、`/api/videos/generate`、`/api/videos/status`）都是标准的 Next.js Serverless Function，Vercel 原生支持，**部署不需要配置任何环境变量**——API Key 由使用者在页面里自行填写。

1. Fork 本仓库到你自己的 GitHub 账号下（或直接使用本仓库）
2. 点击下面的按钮，选择仓库完成部署：

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/star-power0/imagestudio-lite)

3. 部署完成后，Vercel 会给你一个形如 `https://your-project.vercel.app` 的公开地址，任何人（包括你自己）打开即可使用，无需再启动本地开发服务器。

## 技术栈

- [Next.js](https://nextjs.org) 16 (App Router)
- [Tailwind CSS](https://tailwindcss.com) 4
- 浏览器 IndexedDB（历史记录本地存储）

## License

[MIT](./LICENSE)
