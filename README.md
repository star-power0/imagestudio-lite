# ImageStudio Lite

一个轻量、自带 API Key 的 AI 图片生成工具。基于 Next.js，兼容 OpenAI 图片生成协议（`/images/generations`、`/images/edits`），可直接对接官方 API 或任意兼容中转站。

## 功能

- **文生图 / 图生图**：上传参考图即自动切换到编辑模式
- **并行生成**：最多同时开 3 个独立卡片，各自设置不同提示词、分辨率、画幅、质量、格式，并行发起请求
- **多套连接配置**：可保存多个 API Key / Base URL / 模型组合，随时切换
- **本地历史画廊**：最近 20 张生成结果自动保存在浏览器本地（IndexedDB），支持查看参数、单张下载、删除
- **隐私优先**：API Key 只保存在你自己的浏览器里，图片和历史记录也只存在本地，不经过任何第三方服务器落盘

## 快速开始（本地开发）

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，在页面右上角「连接设置」里填入你的 API Base URL 和 API Key 即可使用。

## 一键部署到 Vercel

本项目的两个接口（`/api/generate`、`/api/models`）是标准的 Next.js Serverless Function，Vercel 原生支持，**部署不需要配置任何环境变量**——API Key 由使用者在页面里自行填写。

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
