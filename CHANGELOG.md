# Changelog

## Unreleased

- Fixed model refresh error visibility inside the settings modal.
- Added multi-profile connection settings with create/switch/delete support and migration from the previous single-config format.
- Hardened `/api/models` with base URL normalization, clearer network errors, and broader response parsing.
- Replaced hardcoded image API configuration with browser-local connection settings.
- Added model discovery through the configured OpenAI-compatible `/models` endpoint without replacing the selected model automatically.
- Added separate text-to-image and image-edit request paths, persistent in-session result restoration, actual returned-dimension display, and image download support.
- Added common landscape and portrait ratios including 16:9, 9:16, 4:3, and 3:4.
- Disabled the Next.js development indicator and removed the previously committed local API key file.
