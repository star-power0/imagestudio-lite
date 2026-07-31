# Changelog

## Unreleased

- Added Grok Imagine support: `/api/generate` now detects `grok-imagine*` models and switches to xAI's native image protocol (`aspect_ratio` + `resolution`, JSON body, data-URL inline image for edits) while the existing gpt-image-2 path is untouched.
- Added a standalone `/video` page and `VideoGenerationCard` component for Grok Imagine Video (text-to-video / image-to-video), backed by new `/api/videos/generate` (submits the async job) and `/api/videos/status` (polls xAI's `GET /v1/videos/{request_id}`) routes. Video results are streamed as a provider URL only, not re-encoded to base64 or persisted server-side, since Vercel serverless responses cap at ~4.5MB.
- Verified against the user's third-party relay (`api2.wahuiliyi.cn`): the relay exposes `grok-imagine-image/-video` in `/v1/models` but currently rejects them with "该模型未定价，暂不可用" on images, and returns "unknown endpoint" for `/v1/videos/generations` — the relay's `GROK - SUPER` group description overstates what's actually wired up server-side. Confirmed via curl that both new routes forward requests correctly and surface the relay's real error; this is a relay-side gap, not a client bug.
- Renamed the repo to `imagestudio-lite`, added MIT license and favicon, published to GitHub at `star-power0/imagestudio-lite`, and deployed to Vercel with zero required env vars. Current production domain: `https://imagestudio-lite.vercel.app/`; custom subdomain: `https://img.starroute.me/` (recommended). The root domain `starroute.me` and `www.starroute.me` are not bound to ImageStudio; `api.starroute.me` remains reserved for the existing API relay. The older `imagestudio-lite-3wtabg7zn-star-power0s-projects.vercel.app` URL is a historical deployment and should not be used.
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
