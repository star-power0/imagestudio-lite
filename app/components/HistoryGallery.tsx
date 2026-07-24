'use client';

import { useState } from 'react';
import { deleteHistoryEntry } from '../lib/imageHistory';
import type { HistoryEntry } from '../lib/types';

type Props = {
  entries: HistoryEntry[];
  onDelete: (id: number) => void;
  onClear: () => void;
};

export default function HistoryGallery({ entries, onDelete, onClear }: Props) {
  const [active, setActive] = useState<HistoryEntry | null>(null);

  if (entries.length === 0) return null;

  const removeEntry = async (id: number | undefined) => {
    if (id === undefined) return;
    await deleteHistoryEntry(id);
    onDelete(id);
    setActive((current) => (current?.id === id ? null : current));
  };

  const downloadEntry = (entry: HistoryEntry) => {
    const link = document.createElement('a');
    link.href = entry.dataUrl;
    link.download = `imagestudio-history-${entry.createdAt}.${entry.format}`;
    link.click();
  };

  return (
    <section className="glass-panel mt-10 rounded-2xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">历史画廊</h2>
          <p className="mt-1 text-sm text-zinc-500">最近 {entries.length} 张，仅保存在本机浏览器中</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-red-400 hover:text-red-300">
          清空历史
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActive(entry)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60"
          >
            <img src={entry.dataUrl} alt={entry.prompt} className="h-full w-full object-cover transition group-hover:scale-105" />
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[11px] text-zinc-200 opacity-0 transition group-hover:opacity-100">
              {entry.prompt}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5" onClick={() => setActive(null)}>
          <div className="glass-panel max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6" onClick={(event) => event.stopPropagation()}>
            <img src={active.dataUrl} alt={active.prompt} className="max-h-[60vh] w-full rounded-xl object-contain" />
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <p className="leading-6">{active.prompt}</p>
              <p className="text-xs text-zinc-500">
                {active.width} x {active.height} · {active.resolution} · {active.ratio} · {new Date(active.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => removeEntry(active.id)} className="rounded-lg border border-red-400/60 px-4 py-2 text-sm text-red-300 transition hover:bg-red-400/10">
                删除
              </button>
              <button type="button" onClick={() => downloadEntry(active)} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300">
                下载
              </button>
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
