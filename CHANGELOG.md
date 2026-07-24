# Changelog

## Unreleased

- Renamed the repo to `imagestudio-lite`, added MIT license and favicon, published to GitHub at `star-power0/imagestudio-lite`, and deployed to Vercel (`imagestudio-lite-3wtabg7zn-star-power0s-projects.vercel.app`) with zero required env vars.
- Fixed an SSR/CSR hydration mismatch: the connection store is now initialized with a fixed default on first render and synced from `localStorage` only inside a post-mount `useEffect`.
- Redesigned the page background (`.studio-backdrop`) with a layered aurora gradient, dot texture, vignette, and SVG noise overlay; added `relative z-10` to the content wrapper to keep it above the new fixed noise layer.
- Renamed the page heading from "图片生成工作台" to "无限画布".
- Fixed model refresh error visibility inside the settings modal.
- Added multi-profile connection settings with create/switch/delete support and migration from the previous single-config format.
- Hardened `/api/models` with base URL normalization, clearer network errors, and broader response parsing.
- Replaced hardcoded image API configuration with browser-local connection settings.
- Added model discovery through the configured OpenAI-compatible `/models` endpoint without replacing the selected model automatically.
- Added separate text-to-image and image-edit request paths, persistent in-session result restoration, actual returned-dimension display, and image download support.
- Added common landscape and portrait ratios including 16:9, 9:16, 4:3, and 3:4.
- Disabled the Next.js development indicator and removed the previously committed local API key file.
