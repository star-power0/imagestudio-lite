'use client';

import { useState } from 'react';
import {
  NAI_FREE_MAX_STEPS,
  NAI_NOISE_SCHEDULES,
  NAI_SAMPLERS,
  NAI_SIZE_PRESETS,
  NAI_UC_PRESETS,
} from '../lib/constants';
import type { NaiParams } from '../lib/types';

type Props = {
  params: NaiParams;
  onChange: (patch: Partial<NaiParams>) => void;
};

const SELECT_CLASS =
  'mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900/70 p-2.5 text-sm text-white outline-none transition focus:border-cyan-400';

function fill(value: number, min: number, max: number) {
  const percent = ((value - min) / (max - min)) * 100;
  return { background: `linear-gradient(to right, #22d3ee ${percent}%, rgba(255,255,255,0.1) ${percent}%)` };
}

export default function NaiParamsPanel({ params, onChange }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const overFreeSteps = params.steps > NAI_FREE_MAX_STEPS;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">画布尺寸</label>
        <div className="grid grid-cols-2 gap-2">
          {NAI_SIZE_PRESETS.map((preset) => {
            const active = params.size === preset.value;
            const [label, dimensions] = preset.label.split(' ');
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange({ size: preset.value })}
                className={`relative rounded-lg border px-2 py-2 text-left transition ${
                  active
                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
                    : 'border-zinc-700 bg-zinc-900/70 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-[11px] tabular-nums opacity-70">{dimensions}</span>
                {!preset.free && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-400" title="超出免费尺寸档，按 Anlas 计费" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
          标记的尺寸超出免费档，按 Anlas 公式计费
        </p>
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((current) => !current)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
      >
        <span>高级参数</span>
        <span className={`text-xs text-zinc-500 transition-transform ${advanced ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {advanced && (
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm text-zinc-300">
              采样器
              <select value={params.sampler} onChange={(event) => onChange({ sampler: event.target.value })} className={SELECT_CLASS}>
                {NAI_SAMPLERS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-zinc-300">
              噪声调度
              <select value={params.noiseSchedule} onChange={(event) => onChange({ noiseSchedule: event.target.value })} className={SELECT_CLASS}>
                {NAI_NOISE_SCHEDULES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm text-zinc-300">
            <span className="flex items-center justify-between">
              <span>步数</span>
              <span className={`tabular-nums ${overFreeSteps ? 'text-amber-300' : 'text-cyan-300'}`}>{params.steps}</span>
            </span>
            <input
              type="range"
              min={1}
              max={50}
              value={params.steps}
              onChange={(event) => onChange({ steps: Number(event.target.value) })}
              className="themed-range mt-2 w-full"
              style={fill(params.steps, 1, 50)}
            />
            <span className={`mt-1.5 block text-xs ${overFreeSteps ? 'text-amber-300' : 'text-zinc-500'}`}>
              {overFreeSteps
                ? `实测超过 ${NAI_FREE_MAX_STEPS} 步立即收费：29 步一张约 60 Gems`
                : `${NAI_FREE_MAX_STEPS} 步以内为免费档（实测 0 Gems）`}
            </span>
          </label>

          <label className="block text-sm text-zinc-300">
            <span className="flex items-center justify-between">
              <span>引导强度 / Scale</span>
              <span className="tabular-nums text-cyan-300">{params.scale.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={params.scale}
              onChange={(event) => onChange({ scale: Number(event.target.value) })}
              className="themed-range mt-2 w-full"
              style={fill(params.scale, 1, 10)}
            />
            <span className="mt-1.5 block text-xs text-zinc-500">官方推荐 5 - 6，过高容易过饱和</span>
          </label>

          <label className="text-sm text-zinc-300">
            不良内容预设
            <select value={params.ucPreset} onChange={(event) => onChange({ ucPreset: Number(event.target.value) })} className={SELECT_CLASS}>
              {NAI_UC_PRESETS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <span className="mt-1.5 block text-xs text-zinc-500">官方预置的排除词，与你自己的负面提示词叠加生效</span>
          </label>

          <label className="flex items-center justify-between gap-3 text-sm text-zinc-300">
            <span>
              质量标签
              <span className="mt-0.5 block text-xs text-zinc-500">自动追加 masterpiece 等质量词</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={params.qualityToggle}
              onClick={() => onChange({ qualityToggle: !params.qualityToggle })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${params.qualityToggle ? 'bg-cyan-400' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${params.qualityToggle ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </label>
        </div>
      )}
    </div>
  );
}
