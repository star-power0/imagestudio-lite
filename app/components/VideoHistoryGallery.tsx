'use client';

import { useEffect, useState } from 'react';
import { deleteVideoHistoryEntry } from '../lib/videoHistory';
import type { VideoHistoryEntry } from '../lib/types';

type Props = {
  entries: VideoHistoryEntry[];
  onDelete: (id: number) => void;
  onClear: () => void;
};

export default function VideoHistoryGallery({ entries, onDelete, onClear }: Props) {
  const [active, setActive] = useState<VideoHistoryEntry | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       展开历史时把 blob 转成 object URL 供 <video> 使用，关闭时回收。 */
    if (active?.blob) {
      const url = URL.createObjectURL(active.blob);
      setActiveUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setActiveUrl(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active]);

  if (entries.length === 0) return null;

  const removeEntry = async (id: number | undefined) => {
    if (id === undefined) return;
    await deleteVideoHistoryEntry(id);
    onDelete(id);
    setActive((current) => (current?.id === id ? null : current));
  };

  const downloadEntry = () => {
    if (!active || !activeUrl) return;
    const link = document.createElement('a');
    link.href = activeUrl;
    link.download = `grok-imagine-video-${active.createdAt}.mp4`;
    link.click();
  };

  return (
    <section className="glass-panel mt-10 rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">视频历史</h2>
          <p className="mt-1 text-sm text-zinc-500">最近 {entries.length} 条，仅保存在本机浏览器中</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-red-400 hover:text-red-300">
          清空历史
        </button>
      </div>

      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => setActive(entry)}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left transition hover:border-cyan-400/60"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${entry.status === 'done' ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{entry.prompt || '（无提示词）'}</span>
              <span className="shrink-0 text-xs text-zinc-500">
                {entry.duration}s · {entry.ratio} · {entry.resolution} · {new Date(entry.createdAt).toLocaleString()}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5" onClick={() => setActive(null)}>
          <div className="glass-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6" onClick={(event) => event.stopPropagation()}>
            {active.status === 'done' && activeUrl ? (
              <video src={activeUrl} controls className="max-h-[60vh] w-full rounded-xl bg-zinc-950" />
            ) : (
              <p className="flex min-h-[40vh] items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 text-sm text-red-300">
                {active.errorMessage || '该任务未能生成视频。'}
              </p>
            )}
            <p className="mt-4 text-sm leading-6 text-zinc-200">{active.prompt}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {active.duration}s · {active.ratio} · {active.resolution} · {new Date(active.createdAt).toLocaleString()}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => removeEntry(active.id)} className="rounded-lg border border-red-400/60 px-4 py-2 text-sm text-red-300 transition hover:bg-red-400/10">
                删除
              </button>
              {active.status === 'done' && (
                <button type="button" onClick={downloadEntry} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300">
                  下载
                </button>
              )}
              <button type="button" onClick={() => setActive(null)} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-400">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
