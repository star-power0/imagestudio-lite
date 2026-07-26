export type ImageFormat = 'png' | 'jpeg' | 'webp';
export type Quality = 'auto' | 'low' | 'medium' | 'high';
export type Resolution = '1K' | '2K' | '4K';
export type Ratio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '3:2' | '2:3';

export type Settings = { apiBaseUrl: string; apiKey: string; model: string };
export type Profile = Settings & { id: string; name: string };
export type ConnectionStore = { profiles: Profile[]; activeId: string };

export type GeneratedImage = { dataUrl: string; width: number; height: number; format: ImageFormat };

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

export type HistoryEntry = GeneratedImage & {
  id?: number;
  prompt: string;
  resolution: Resolution;
  ratio: Ratio;
  quality: Quality;
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
