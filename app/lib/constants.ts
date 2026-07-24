import type { Ratio, Resolution, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = { apiBaseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-image-2' };

export const RATIOS: Ratio[] = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];

export const SIZES: Record<Resolution, Record<Ratio, string>> = {
  '1K': { '1:1': '1024x1024', '16:9': '1536x864', '9:16': '864x1536', '4:3': '1216x912', '3:4': '912x1216', '3:2': '1344x896', '2:3': '896x1344' },
  '2K': { '1:1': '2048x2048', '16:9': '2560x1440', '9:16': '1440x2560', '4:3': '2432x1824', '3:4': '1824x2432', '3:2': '2688x1792', '2:3': '1792x2688' },
  '4K': { '1:1': '2880x2880', '16:9': '3840x2160', '9:16': '2160x3840', '4:3': '3320x2490', '3:4': '2490x3320', '3:2': '3504x2336', '2:3': '2336x3504' },
};

export const MAX_SLOTS = 3;
export const MAX_HISTORY = 20;
