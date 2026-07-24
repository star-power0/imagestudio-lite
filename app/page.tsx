'use client';

import { useEffect, useRef, useState } from 'react';
import ConnectionSettingsModal from './components/ConnectionSettingsModal';
import GenerationCard, { GenerationCardHandle } from './components/GenerationCard';
import HistoryGallery from './components/HistoryGallery';
import {
  createProfile,
  getActiveProfile,
  loadConnectionStore,
  normalizeSettings,
  persistConnectionStore,
  toSettings,
} from './lib/connectionStore';
import { MAX_SLOTS } from './lib/constants';
import { addHistoryEntry, clearHistory, listHistory } from './lib/imageHistory';
import type { ConnectionStore, GeneratedImage, HistoryEntry, Quality, Ratio, Resolution, Settings } from './lib/types';

function createSlotId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultStore(): ConnectionStore {
  const profile = createProfile();
  return { profiles: [profile], activeId: profile.id };
}

export default function Home() {
  // 首次渲染（服务端与客户端）统一使用固定默认值，避免 SSR/浏览器读取 localStorage
  // 结果不一致导致的 hydration 报错；真实的本地存储内容在下方 useEffect 里于浏览器加载后再套用。
  const [store, setStore] = useState<ConnectionStore>(createDefaultStore);
  const activeProfile = getActiveProfile(store);
  const [settings, setSettings] = useState<Settings>(() => toSettings(activeProfile));
  const [profileName, setProfileName] = useState(activeProfile.name);
  const [models, setModels] = useState<string[]>([]);
  const [modelEndpoint, setModelEndpoint] = useState('');
  const [modelStatus, setModelStatus] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [refreshingModels, setRefreshingModels] = useState(false);
  const [slotIds, setSlotIds] = useState<string[]>([createSlotId()]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const cardRefs = useRef<Map<string, GenerationCardHandle>>(new Map());

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       挂载后仅执行一次：从 localStorage 读取真实配置并同步进状态，
       是把外部存储同步进 React 状态的标准做法，不会级联触发。 */
    const stored = loadConnectionStore();
    setStore(stored);
    const profile = getActiveProfile(stored);
    setSettings(toSettings(profile));
    setProfileName(profile.name);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    listHistory().then(setHistory).catch(() => undefined);
  }, []);

  const persistStore = (next: ConnectionStore) => {
    persistConnectionStore(next);
    setStore(next);
  };

  const openSettings = () => {
    const current = getActiveProfile(store);
    setSettings(toSettings(current));
    setProfileName(current.name);
    setSettingsError('');
    setShowSettings(true);
  };

  const updateSettings = (field: keyof Settings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
    setSettingsError('');
  };

  const resetModelState = () => {
    setModels([]);
    setModelEndpoint('');
    setModelStatus('');
    setSettingsError('');
  };

  const switchProfile = (profileId: string) => {
    const profile = store.profiles.find((item) => item.id === profileId);
    if (!profile) return;
    persistStore({ ...store, activeId: profileId });
    setSettings(toSettings(profile));
    setProfileName(profile.name);
    resetModelState();
  };

  const addProfile = () => {
    const profile = createProfile(`配置 ${store.profiles.length + 1}`, {
      apiBaseUrl: settings.apiBaseUrl,
      apiKey: '',
      model: settings.model,
    });
    persistStore({ profiles: [...store.profiles, profile], activeId: profile.id });
    setSettings(toSettings(profile));
    setProfileName(profile.name);
    resetModelState();
  };

  const deleteProfile = () => {
    if (store.profiles.length <= 1) {
      setSettingsError('至少保留一套配置。');
      return;
    }
    const profiles = store.profiles.filter((item) => item.id !== store.activeId);
    persistStore({ profiles, activeId: profiles[0].id });
    setSettings(toSettings(profiles[0]));
    setProfileName(profiles[0].name);
    resetModelState();
  };

  const saveSettings = () => {
    const name = profileName.trim() || '未命名配置';
    const profiles = store.profiles.map((item) => (
      item.id === store.activeId
        ? { ...item, name, ...normalizeSettings(settings) }
        : item
    ));
    persistStore({ profiles, activeId: store.activeId });
    setProfileName(name);
    setShowSettings(false);
  };

  const refreshModels = async () => {
    if (!settings.apiBaseUrl || !settings.apiKey) {
      setSettingsError('请先填写 API 地址和 API Key。');
      return;
    }

    setRefreshingModels(true);
    setSettingsError('');
    setModelStatus('正在请求模型列表...');
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setModels([]);
        setModelEndpoint(data.endpoint || '');
        setModelStatus('');
        throw new Error(data.error || '拉取模型失败。');
      }

      setModels(data.models || []);
      setModelEndpoint(data.endpoint || '');
      setModelStatus(
        data.models?.length
          ? `已发现 ${data.models.length} 个模型`
          : `接口返回成功，但未识别到模型列表（返回字段：${data.responseShape || '未知'}）`,
      );
    } catch (requestError) {
      setModels([]);
      setSettingsError(requestError instanceof Error ? requestError.message : '拉取模型失败。');
    } finally {
      setRefreshingModels(false);
    }
  };

  const addSlot = () => {
    if (slotIds.length >= MAX_SLOTS) return;
    setSlotIds((current) => [...current, createSlotId()]);
  };

  const removeSlot = (id: string) => {
    cardRefs.current.delete(id);
    setSlotIds((current) => current.filter((slotId) => slotId !== id));
  };

  const handleGenerated = async (image: GeneratedImage, prompt: string, resolution: Resolution, ratio: Ratio, quality: Quality) => {
    const entry: Omit<HistoryEntry, 'id'> = { ...image, prompt, resolution, ratio, quality, createdAt: Date.now() };
    await addHistoryEntry(entry);
    setHistory(await listHistory());
  };

  const generateAll = () => {
    slotIds.forEach((id) => {
      const handle = cardRefs.current.get(id);
      if (handle?.hasPrompt()) handle.generate();
    });
  };

  const handleDeleteHistoryEntry = (id: number) => {
    setHistory((current) => current.filter((item) => item.id !== id));
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  return (
    <main className="studio-backdrop min-h-screen px-5 py-8 text-zinc-100 sm:px-8 lg:px-12">
      <div className="relative z-10 mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-cyan-300">IMAGESTUDIO LITE</p>
            <h1 className="mt-1 text-4xl font-semibold text-white">无限画布</h1>
            <p className="mt-2 text-sm text-zinc-500">当前配置：{activeProfile.name} · {activeProfile.model || '未选模型'}</p>
          </div>
          <button type="button" onClick={openSettings} className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-5 py-3 text-sm font-medium text-zinc-100 transition hover:border-cyan-400 hover:text-cyan-200">
            连接设置
          </button>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addSlot}
              disabled={slotIds.length >= MAX_SLOTS}
              className="rounded-xl border border-zinc-700 bg-zinc-900/70 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              + 新增并行任务（{slotIds.length}/{MAX_SLOTS}）
            </button>
          </div>
          <button type="button" onClick={generateAll} className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300">
            全部生成
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {slotIds.map((id, index) => (
            <GenerationCard
              key={id}
              index={index}
              settings={settings}
              canRemove={slotIds.length > 1}
              onRemove={() => removeSlot(id)}
              onGenerated={handleGenerated}
              ref={(handle) => {
                if (handle) cardRefs.current.set(id, handle);
                else cardRefs.current.delete(id);
              }}
            />
          ))}
        </div>

        <HistoryGallery entries={history} onDelete={handleDeleteHistoryEntry} onClear={handleClearHistory} />
      </div>

      {showSettings && (
        <ConnectionSettingsModal
          store={store}
          settings={settings}
          profileName={profileName}
          models={models}
          modelEndpoint={modelEndpoint}
          modelStatus={modelStatus}
          settingsError={settingsError}
          refreshingModels={refreshingModels}
          onClose={() => setShowSettings(false)}
          onSwitchProfile={switchProfile}
          onAddProfile={addProfile}
          onDeleteProfile={deleteProfile}
          onProfileNameChange={setProfileName}
          onUpdateSettings={updateSettings}
          onRefreshModels={refreshModels}
          onSave={saveSettings}
        />
      )}
    </main>
  );
}
