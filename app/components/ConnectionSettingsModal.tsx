'use client';

import type { ConnectionStore, Settings } from '../lib/types';

type Props = {
  store: ConnectionStore;
  settings: Settings;
  profileName: string;
  models: string[];
  modelEndpoint: string;
  modelStatus: string;
  settingsError: string;
  refreshingModels: boolean;
  onClose: () => void;
  onSwitchProfile: (id: string) => void;
  onAddProfile: () => void;
  onDeleteProfile: () => void;
  onProfileNameChange: (value: string) => void;
  onUpdateSettings: (field: keyof Settings, value: string) => void;
  onRefreshModels: () => void;
  onSave: () => void;
};

export default function ConnectionSettingsModal({
  store,
  settings,
  profileName,
  models,
  modelEndpoint,
  modelStatus,
  settingsError,
  refreshingModels,
  onClose,
  onSwitchProfile,
  onAddProfile,
  onDeleteProfile,
  onProfileNameChange,
  onUpdateSettings,
  onRefreshModels,
  onSave,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
      <section className="glass-panel max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl p-7 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">连接设置</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">可保存多套配置。刷新模型失败时错误会直接显示在这里。</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-zinc-400 transition hover:text-white">关闭</button>
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-zinc-300">配置方案</label>
            <div className="flex gap-2">
              <button type="button" onClick={onAddProfile} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-cyan-400 hover:text-cyan-200">新增</button>
              <button type="button" onClick={onDeleteProfile} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-red-400 hover:text-red-200">删除当前</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {store.profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSwitchProfile(profile.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs transition ${store.activeId === profile.id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-zinc-600 text-zinc-300 hover:border-cyan-400'}`}
              >
                {profile.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-zinc-300">
            配置名称
            <input value={profileName} onChange={(event) => onProfileNameChange(event.target.value)} placeholder="例如 OpenAI / 中转站 A" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-base text-white outline-none transition focus:border-cyan-400" />
          </label>
          <label className="block text-sm text-zinc-300">
            API Base URL
            <input value={settings.apiBaseUrl} onChange={(event) => onUpdateSettings('apiBaseUrl', event.target.value)} placeholder="https://api.openai.com/v1" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-base text-white outline-none transition focus:border-cyan-400" />
          </label>
          <label className="block text-sm text-zinc-300">
            API Key
            <input type="password" value={settings.apiKey} onChange={(event) => onUpdateSettings('apiKey', event.target.value)} placeholder="sk-..." autoComplete="off" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-base text-white outline-none transition focus:border-cyan-400" />
          </label>
          <label className="block text-sm text-zinc-300">
            图片模型
            <input value={settings.model} onChange={(event) => onUpdateSettings('model', event.target.value)} placeholder="gpt-image-2" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-base text-white outline-none transition focus:border-cyan-400" />
          </label>

          {settingsError && <p className="rounded-lg border-l-2 border-red-400 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">{settingsError}</p>}

          {(modelStatus || modelEndpoint || models.length > 0) && (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs leading-5 text-zinc-400">
              {modelStatus && <p>{modelStatus}</p>}
              {modelEndpoint && <p className="mt-1 break-all text-zinc-500">接口：{modelEndpoint}</p>}
              {models.length > 0 && (
                <div className="mt-3 flex max-h-44 flex-wrap gap-2 overflow-y-auto pr-1">
                  {models.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => onUpdateSettings('model', model)}
                      className={`rounded-lg border px-2 py-1 text-xs transition ${settings.model === model ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-zinc-600 text-zinc-300 hover:border-cyan-400'}`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onRefreshModels} disabled={refreshingModels} className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:opacity-50">
            {refreshingModels ? '拉取中...' : '刷新模型'}
          </button>
          <button type="button" onClick={onSave} className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300">
            保存设置
          </button>
        </div>
      </section>
    </div>
  );
}
