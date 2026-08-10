'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import VideoGenerationCard from '../components/VideoGenerationCard';
import VideoHistoryGallery from '../components/VideoHistoryGallery';
import { getActiveProfile, loadConnectionStore, toSettings } from '../lib/connectionStore';
import { clearVideoHistory, listVideoHistory } from '../lib/videoHistory';
import type { Settings, VideoHistoryEntry } from '../lib/types';

export default function VideoPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryEntry[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       与首页一致：挂载后从 localStorage 读取已保存的连接配置，避免 SSR/浏览器不一致。 */
    const stored = loadConnectionStore();
    setSettings(toSettings(getActiveProfile(stored)));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    listVideoHistory().then(setVideoHistory).catch(() => undefined);
  }, []);

  const handleRecorded = async () => {
    setVideoHistory(await listVideoHistory());
  };

  const handleDeleteVideoHistory = (id: number) => {
    setVideoHistory((current) => current.filter((item) => item.id !== id));
  };

  const handleClearVideoHistory = async () => {
    await clearVideoHistory();
    setVideoHistory([]);
  };

  return (
    <main className="studio-backdrop min-h-screen px-5 py-8 text-zinc-100 sm:px-8 lg:px-12">
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-cyan-300">GROK IMAGINE VIDEO</p>
            <h1 className="mt-1 text-4xl font-semibold text-white">视频生成</h1>
            <p className="mt-2 text-sm text-zinc-500">复用连接设置中的 API Base URL 和 API Key，模型固定为 grok-imagine-video。</p>
          </div>
          <Link href="/" className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-cyan-400 hover:text-cyan-200">
            返回图片生成
          </Link>
        </header>

        {settings ? (
          <VideoGenerationCard settings={settings} onRecorded={handleRecorded} />
        ) : (
          <p className="text-sm text-zinc-500">加载连接设置中...</p>
        )}

        <VideoHistoryGallery entries={videoHistory} onDelete={handleDeleteVideoHistory} onClear={handleClearVideoHistory} />
      </div>
    </main>
  );
}
