'use client';

import { ChangeEvent, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { isNaiModel, NAI_DEFAULT_PARAMS, NAI_FREE_MAX_STEPS, NAI_SIZE_PRESETS, RATIOS, SIZES } from '../lib/constants';
import NaiParamsPanel from './NaiParamsPanel';
import type { GeneratedImage, GenerationMeta, ImageFormat, NaiParams, Quality, Ratio, Resolution, Settings } from '../lib/types';

export type GenerationCardHandle = {
  generate: () => void;
  hasPrompt: () => boolean;
};

type Props = {
  index: number;
  settings: Settings;
  canRemove: boolean;
  onRemove: () => void;
  onGenerated: (image: GeneratedImage, meta: GenerationMeta) => void;
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
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegative, setShowNegative] = useState(false);
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [quality, setQuality] = useState<Quality>('auto');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [naiParams, setNaiParams] = useState<NaiParams>(NAI_DEFAULT_PARAMS);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NovelAI 只出 PNG，且尺寸来自它自己的预设表，不走 分辨率 x 画幅 的组合。
  const isNai = isNaiModel(settings.model);
  const size = isNai ? naiParams.size : SIZES[resolution][ratio];
  const outputFormat: ImageFormat = isNai ? 'png' : format;
  const isNaiFree = naiParams.steps <= NAI_FREE_MAX_STEPS
    && (NAI_SIZE_PRESETS.find((preset) => preset.value === naiParams.size)?.free ?? false);

  const patchNaiParams = (patch: Partial<NaiParams>) => {
    setNaiParams((current) => ({ ...current, ...patch }));
  };

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
    // NovelAI 超出免费档的组合会真实扣 Gems，生成前先确认一次。
    if (isNai && !isNaiFree && !window.confirm(
      `当前设置超出免费档，本次生成会消耗 Gems（29 步一张实测约 60 Gems）。\n\n尺寸 ${naiParams.size} · ${naiParams.steps} 步\n\n确认继续？`,
    )) return;

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
      formData.append('outputFormat', outputFormat);
      if (negativePrompt.trim()) formData.append('negativePrompt', negativePrompt.trim());
      if (isNai) {
        formData.append('naiSteps', String(naiParams.steps));
        formData.append('naiScale', String(naiParams.scale));
        formData.append('naiSampler', naiParams.sampler);
        formData.append('naiNoiseSchedule', naiParams.noiseSchedule);
        formData.append('naiUcPreset', String(naiParams.ucPreset));
        formData.append('naiQualityToggle', String(naiParams.qualityToggle));
      }
      if (sourceImage) formData.append('image', sourceImage);

      const response = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '图片生成失败。');

      const dimensions = await getImageSize(data.image);
      const generated: GeneratedImage = { dataUrl: data.image, ...dimensions, format: outputFormat };
      setResult(generated);
      onGenerated(generated, {
        prompt,
        negativePrompt: negativePrompt.trim() || undefined,
        ...(isNai ? { nai: naiParams } : { resolution, ratio, quality }),
      });
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tracking-wide text-cyan-300">任务 {index + 1}</span>
          {isNai && (
            <span className="rounded-md border border-violet-400/40 bg-violet-400/10 px-2 py-0.5 text-[11px] font-medium text-violet-200">
              NovelAI
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{!isNai && sourceImage ? '图生图' : '文生图'}</span>
          {canRemove && (
            <button type="button" onClick={onRemove} className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 transition hover:border-red-400 hover:text-red-300">
              移除
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={isNai ? '描述画面，或直接堆叠 1girl, long_hair 这类标签...' : '描述画面、主体、材质、光线和构图...'}
          className="h-32 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 text-base leading-7 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400"
        />

        {showNegative || negativePrompt ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">负面提示词</label>
              <button
                type="button"
                onClick={() => { setNegativePrompt(''); setShowNegative(false); }}
                className="text-xs text-zinc-500 transition hover:text-red-300"
              >
                收起并清空
              </button>
            </div>
            <textarea
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              placeholder="不希望出现的内容，例如 lowres, bad anatomy"
              className="h-20 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900/70 p-3.5 text-sm leading-6 outline-none transition placeholder:text-zinc-500 focus:border-rose-400"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNegative(true)}
            className="text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            + 添加负面提示词
          </button>
        )}
      </div>

      <input ref={fileInputRef} className="hidden" type="file" accept="image/*" onChange={chooseSourceImage} />
      {/* NovelAI 的图生图要走它自己的低层 native 接口，不在这条 OpenAI 兼容路径上。 */}
      {isNai ? null : sourcePreview ? (
        <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/70">
          <img src={sourcePreview} alt="参考图预览" className="aspect-[4/3] w-full object-cover" />
          <button type="button" onClick={clearSourceImage} className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-1.5 text-sm text-white transition hover:bg-red-500">移除</button>
        </div>
      ) : (
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-24 w-full items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/70 px-4 text-center text-sm text-zinc-400 transition hover:border-cyan-400 hover:text-cyan-200">
          上传参考图（可选）
        </button>
      )}

      {isNai ? (
        <NaiParamsPanel params={naiParams} onChange={patchNaiParams} />
      ) : (
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
      )}

      {error && <p className="rounded-lg border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">{error}</p>}

      <button type="button" disabled={loading} onClick={() => void generate()} className="w-full rounded-xl bg-cyan-400 px-5 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/40 border-t-zinc-950" />
            正在生成...
          </span>
        ) : !isNai && sourceImage ? '编辑图片' : '生成图片'}
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
