'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { DEFAULT_VIDEO_DURATION, MAX_VIDEO_DURATION, VIDEO_MODEL, VIDEO_RATIOS, VIDEO_RESOLUTIONS } from '../lib/constants';
import type { Settings, VideoRatio, VideoResolution, VideoTask } from '../lib/types';

type Props = { settings: Settings };

const POLL_INTERVAL_MS = 5000;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VideoGenerationCard({ settings }: Props) {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(DEFAULT_VIDEO_DURATION);
  const [ratio, setRatio] = useState<VideoRatio>('16:9');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [task, setTask] = useState<VideoTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const stopPolling = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  };

  const pollStatus = (requestId: string) => {
    const tick = async () => {
      try {
        const params = new URLSearchParams({ apiBaseUrl: settings.apiBaseUrl, apiKey: settings.apiKey, requestId });
        const response = await fetch(`/api/videos/status?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '查询视频状态失败。');

        if (data.status === 'done') {
          setTask({ requestId, status: 'done', progress: 100, url: data.url, errorMessage: null });
          return;
        }
        if (data.status === 'failed') {
          setTask({ requestId, status: 'failed', progress: null, url: null, errorMessage: data.errorMessage || '视频生成失败。' });
          return;
        }
        setTask({ requestId, status: 'pending', progress: data.progress, url: null, errorMessage: null });
        pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
      } catch (requestError) {
        setTask({
          requestId,
          status: 'failed',
          progress: null,
          url: null,
          errorMessage: requestError instanceof Error ? requestError.message : '查询视频状态失败。',
        });
      }
    };
    void tick();
  };

  const generate = async () => {
    if (!prompt.trim()) {
      setError('请输入视频描述。');
      return;
    }
    if (!settings.apiBaseUrl || !settings.apiKey) {
      setError('请先完成连接设置。');
      return;
    }

    stopPolling();
    setSubmitting(true);
    setError('');
    setTask(null);
    try {
      const sourceImageDataUrl = sourceImage ? await fileToDataUrl(sourceImage) : '';
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiBaseUrl: settings.apiBaseUrl,
          apiKey: settings.apiKey,
          model: VIDEO_MODEL,
          prompt,
          duration,
          aspectRatio: ratio,
          resolution,
          sourceImage: sourceImageDataUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '提交视频生成任务失败。');

      setTask({ requestId: data.requestId, status: 'pending', progress: 0, url: null, errorMessage: null });
      pollStatus(data.requestId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '提交视频生成任务失败。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-2xl p-6">
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="描述画面、运镜、动作..."
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
          上传参考图（图生视频，可选）
        </button>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">画幅</label>
          <div className="grid grid-cols-4 gap-2">
            {VIDEO_RATIOS.map((item) => (
              <button key={item} type="button" onClick={() => setRatio(item)} className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition ${ratio === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">分辨率</label>
          <div className="grid grid-cols-3 gap-2">
            {VIDEO_RESOLUTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setResolution(item)} className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition ${resolution === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm text-zinc-300">
          时长（{duration} 秒，最长 {MAX_VIDEO_DURATION} 秒）
          <input
            type="range"
            min={1}
            max={MAX_VIDEO_DURATION}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="themed-range mt-2 w-full"
            style={{
              background: `linear-gradient(to right, #22d3ee ${((duration - 1) / (MAX_VIDEO_DURATION - 1)) * 100}%, rgba(255,255,255,0.1) ${((duration - 1) / (MAX_VIDEO_DURATION - 1)) * 100}%)`,
            }}
          />
        </label>
      </div>

      {error && <p className="rounded-lg border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">{error}</p>}

      <button type="button" disabled={submitting || task?.status === 'pending'} onClick={() => void generate()} className="w-full rounded-xl bg-cyan-400 px-5 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
        {submitting ? '正在提交...' : task?.status === 'pending' ? '生成中...' : sourceImage ? '生成视频（图生视频）' : '生成视频'}
      </button>

      <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        {task?.status === 'pending' && (
          <div className="flex flex-col items-center gap-3 text-sm text-zinc-400">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-cyan-400" />
            <span>生成中{task.progress !== null ? `（${task.progress}%）` : ''}，视频任务通常需要数十秒到数分钟。</span>
          </div>
        )}
        {task?.status === 'failed' && <p className="text-sm text-red-300">{task.errorMessage}</p>}
        {task?.status === 'done' && task.url && (
          <div className="w-full">
            <video src={task.url} controls className="max-h-[360px] w-full rounded-lg" />
            <p className="mt-3 text-xs text-zinc-500">视频链接来自服务商，有效期有限，请及时下载保存。</p>
          </div>
        )}
        {!task && <p className="text-sm text-zinc-500">等待生成</p>}
      </div>
    </div>
  );
}
