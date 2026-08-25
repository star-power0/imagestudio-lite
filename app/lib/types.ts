export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type Quality = 'auto' | 'low' | 'medium' | 'high';
export type Resolution = '1K' | '2K' | '4K';
export type Ratio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

export type Settings = { apiBaseUrl: string; apiKey: string; model: string };
export type Profile = Settings & { id: string; name: string };
export type ConnectionStore = { profiles: Profile[]; activeId: string };

export type GeneratedImage = { dataUrl: string; width: number; height: number; format: ImageFormat };

/** NovelAI 专属参数。走 /images/generations 时整体放进请求体的 `nai` 扩展对象。 */
export type NaiParams = {
  size: string;
  steps: number;
  scale: number;
  sampler: string;
  noiseSchedule: string;
  ucPreset: number;
  qualityToggle: boolean;
};

/** 一次生成的参数快照。NAI 与 OpenAI/Grok 两条路径各只填自己那部分。 */
export type GenerationMeta = {
  prompt: string;
  negativePrompt?: string;
  resolution?: Resolution;
  ratio?: Ratio;
  quality?: Quality;
  nai?: NaiParams;
};

export type GenerationSlot = {
  id: string;
  prompt: string;
  resolution: Resolution;
  ratio: Ratio;
  quality: Quality;
  format: ImageFormat;
  sourceImage: File | null;
  sourcePreview: string | null;
  result: GeneratedImage | null;
  loading: boolean;
  error: string;
};

export type HistoryEntry = GeneratedImage & GenerationMeta & {
  id?: number;
  createdAt: number;
};

export type VideoResolution = '480p' | '720p' | '1080p';
export type VideoRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';
export type VideoStatus = 'pending' | 'done' | 'failed';

export type VideoTask = {
  requestId: string;
  status: VideoStatus;
  progress: number | null;
  url: string | null;
  errorMessage: string | null;
};

export type VideoHistoryEntry = {
  id?: number;
  prompt: string;
  duration: number;
  ratio: VideoRatio;
  resolution: VideoResolution;
  requestId: string;
  status: 'done' | 'failed';
  errorMessage: string | null;
  blob: Blob | null;
  createdAt: number;
};
