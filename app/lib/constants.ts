import type { NaiParams, Ratio, Resolution, Settings, VideoRatio, VideoResolution } from './types';

export const DEFAULT_SETTINGS: Settings = { apiBaseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-image-2' };

export const RATIOS: Ratio[] = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

export const SIZES: Record<Resolution, Record<Ratio, string>> = {
  '1K': { '1:1': '1024x1024', '16:9': '1536x864', '9:16': '864x1536', '4:3': '1216x912', '3:4': '912x1216', '3:2': '1344x896', '2:3': '896x1344' },
  '2K': { '1:1': '2048x2048', '16:9': '2560x1440', '9:16': '1440x2560', '4:3': '2432x1824', '3:4': '1824x2432', '3:2': '2688x1792', '2:3': '1792x2688' },
  '4K': { '1:1': '2880x2880', '16:9': '3840x2160', '9:16': '2160x3840', '4:3': '3320x2490', '3:4': '2490x3320', '3:2': '3504x2336', '2:3': '2336x3504' },
};

export const MAX_SLOTS = 3;
export const MAX_HISTORY = 20;
export const MAX_VIDEO_HISTORY = 10;

// ---- NovelAI ----
// NovelAI 不接受任意分辨率：只有下面前四档属于站点的免费/标准计费区间，
// 更大的尺寸会按 Anlas 公式换算，单张成本高得多，所以在界面上明确标出来。
export const NAI_SIZE_PRESETS: { value: string; label: string; free: boolean }[] = [
  { value: '832x1216', label: '竖版 832×1216', free: true },
  { value: '1216x832', label: '横版 1216×832', free: true },
  { value: '1024x1024', label: '方形 1024×1024', free: true },
  { value: '512x512', label: '小图 512×512', free: true },
  { value: '1024x1536', label: '大竖版 1024×1536', free: false },
  { value: '1536x1024', label: '大横版 1536×1024', free: false },
];

export const NAI_SAMPLERS: { value: string; label: string }[] = [
  { value: 'k_euler_ancestral', label: 'Euler Ancestral（推荐）' },
  { value: 'k_dpmpp_2m', label: 'DPM++ 2M（推荐）' },
  { value: 'k_euler', label: 'Euler' },
  { value: 'k_dpmpp_2s_ancestral', label: 'DPM++ 2S Ancestral' },
  { value: 'k_dpmpp_sde', label: 'DPM++ SDE' },
];

export const NAI_NOISE_SCHEDULES: { value: string; label: string }[] = [
  { value: 'karras', label: 'Karras（推荐）' },
  { value: 'exponential', label: 'Exponential' },
  { value: 'polyexponential', label: 'Polyexponential' },
];

// 官方 Undesired Content 预设。编号来自 NovelAI 接口定义，不要按界面顺序重排。
export const NAI_UC_PRESETS: { value: number; label: string }[] = [
  { value: 3, label: 'Human Focus · 人物向' },
  { value: 0, label: 'Heavy · 重度' },
  { value: 1, label: 'Light · 轻度' },
  { value: 2, label: 'Furry Focus · 兽人向' },
  { value: 4, label: 'None · 不注入' },
];

// 实测：28 步收费 0 Gems，29 步就跳到 60 Gems，边界很硬。
export const NAI_FREE_MAX_STEPS = 28;

// 实测 seed 在中转站的 OpenAI 兼容层和 YesNAI 原生层都会被丢弃：
// 同一 seed 连续两次请求返回不同图像。等中转站修好再放开这个输入。
export const NAI_SEED_SUPPORTED = false;

export const NAI_DEFAULT_PARAMS: NaiParams = {
  size: '832x1216',
  steps: 28,
  scale: 5,
  sampler: 'k_euler_ancestral',
  noiseSchedule: 'karras',
  ucPreset: 3,
  qualityToggle: true,
};

export function isNaiModel(model: string) {
  return model.startsWith('nai-diffusion');
}

export const VIDEO_RATIOS: VideoRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
export const VIDEO_RESOLUTIONS: VideoResolution[] = ['480p', '720p', '1080p'];
export const VIDEO_MODEL = 'grok-imagine-video';
export const MAX_VIDEO_DURATION = 15;
export const DEFAULT_VIDEO_DURATION = 6;
