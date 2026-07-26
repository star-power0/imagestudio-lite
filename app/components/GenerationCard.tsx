'use client';

import { ChangeEvent, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { RATIOS, SIZES } from '../lib/constants';
import type { GeneratedImage, ImageFormat, Quality, Ratio, Resolution, Settings } from '../lib/types';

export type GenerationCardHandle = {
  generate: () => void;
  hasPrompt: () => boolean;
};

type Props = {
  index: number;
  settings: Settings;
  canRemove: boolean;
  onRemove: () => void;
  onGenerated: (image: GeneratedImage, prompt: string, resolution: Resolution, ratio: Ratio, quality: Quality) => void;
};

function getImageSize(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = dataUrl;
  });
}

const GenerationCard = forwardRef<GenerationCardHandle, Props>(function GenerationCard(
  { index, settings, canRemove, onRemove, onGenerated },
  ref,
) {
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [quality, setQuality] = useState<Quality>('auto');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const size = SIZES[resolution][ratio];

  const chooseSourceImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && !file.type.startsWith('image/')) {
      setError('请选择图片文件。');
      return;
    }
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourceImage(file);
    setSourcePreview(file ? URL.createObjectURL(file) : null);
  };

  const clearSourceImage = () => {
    if (sourcePreview) URL.revokeObjectURL(sourcePreview);
    setSourceImage(null);
    setSourcePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generate = async () => {
    if (!prompt.trim()) {
      setError('请输入图片提示词。');
      return;
    }
    if (!settings.apiBaseUrl || !settings.apiKey || !settings.model) {
      setError('请先完成连接设置。');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('apiBaseUrl', settings.apiBaseUrl);
      formData.append('apiKey', settings.apiKey);
      formData.append('model', settings.model);
      formData.append('prompt', prompt);
      formData.append('size', size);
      formData.append('ratio', ratio);
      formData.append('resolution', resolution);
      formData.append('quality', quality);
      formData.append('outputFormat', format);
      if (sourceImage) formData.append('image', sourceImage);

      const response = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '图片生成失败。');

      const dimensions = await getImageSize(data.image);
      const generated: GeneratedImage = { dataUrl: data.image, ...dimensions, format };
      setResult(generated);
      onGenerated(generated, prompt, resolution, ratio, quality);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '图片生成失败。');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    generate: () => { void generate(); },
    hasPrompt: () => prompt.trim().length > 0,
  }));

  const downloadImage = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = `imagestudio-${Date.now()}.${result.format}`;
    link.click();
  };

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium tracking-wide text-cyan-300">任务 {index + 1}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{sourceImage ? '图生图' : '文生图'}</span>
          {canRemove && (
            <button type="button" onClick={onRemove} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition hover:border-red-400 hover:text-red-300">
              移除
            </button>
          )}
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="描述画面、主体、材质、光线和构图..."
        className="h-32 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 text-base leading-7 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400"
      />

      <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={chooseSourceImage} />
      {sourcePreview ? (
        <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70">
          <img src={sourcePreview} alt="参考图预览" className="aspect-[4/3] w-full object-cover" />
          <button type="button" onClick={clearSourceImage} className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white transition hover:bg-red-500">移除</button>
        </div>
      ) : (
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-24 w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/70 px-4 text-center text-sm text-zinc-400 transition hover:border-cyan-400 hover:text-cyan-200">
          上传参考图（可选）
        </button>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">分辨率</label>
          <div className="grid grid-cols-3 gap-2">
            {(['1K', '2K', '4K'] as Resolution[]).map((item) => (
              <button key={item} type="button" onClick={() => setResolution(item)} className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${resolution === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">画幅</label>
          <div className="grid grid-cols-4 gap-2">
            {RATIOS.map((item) => (
              <button key={item} type="button" onClick={() => setRatio(item)} className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition ${ratio === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-500">请求尺寸：{size}</p>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-zinc-300">
            质量
            <select value={quality} onChange={(event) => setQuality(event.target.value as Quality)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/70 p-2.5 text-sm text-white outline-none focus:border-cyan-400">
              <option value="auto">自动</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            格式
            <select value={format} onChange={(event) => setFormat(event.target.value as ImageFormat)} className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/70 p-2.5 text-sm text-white outline-none focus:border-cyan-400">
              <option value="png">PNG</option>
              <option value="jpeg">JPEG</option>
              <option value="webp">WebP</option>
            </select>
          </label>
        </div>
      </div>

      {error && <p className="rounded-lg border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">{error}</p>}

      <button type="button" disabled={loading} onClick={() => void generate()} className="w-full rounded-xl bg-cyan-400 px-5 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/40 border-t-zinc-950" />
            正在生成...
          </span>
        ) : sourceImage ? '编辑图片' : '生成图片'}
      </button>

      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        {result ? (
          <div className="w-full">
            <img src={result.dataUrl} alt="生成结果" className="max-h-[360px] w-full rounded-lg object-contain" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
              <span>{result.width} x {result.height}</span>
              <button type="button" onClick={downloadImage} className="rounded-lg border border-cyan-400/60 bg-cyan-400/10 px-3 py-1.5 font-medium text-cyan-200 transition hover:bg-cyan-400 hover:text-zinc-950">
                下载 {result.format.toUpperCase()}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">等待生成</p>
        )}
      </div>
    </div>
  );
});

export default GenerationCard;
