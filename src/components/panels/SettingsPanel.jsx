'use client';

import React from 'react';
import {
  Settings as SettingsIcon,
  Zap,
  Sparkles,
  Cloud,
  Truck,
  Bird,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Sliders
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export const DEFAULT_SETTINGS = {
  showInfrastructure: true,
  graphicQuality: 'high', // 'low' | 'medium' | 'high' | 'ultra'
  showClouds: true,
  showTraffic: true,
  showWildlife: true
};

export default function SettingsPanel({
  settings = DEFAULT_SETTINGS,
  onUpdateSettings,
  lang = 'tr'
}) {
  const dict = dictionaries[lang]?.settings || dictionaries.tr.settings;

  const handleToggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    onUpdateSettings(next);
  };

  const handleQualityChange = (quality) => {
    const next = { ...settings, graphicQuality: quality };
    onUpdateSettings(next);
  };

  const handleReset = () => {
    onUpdateSettings({ ...DEFAULT_SETTINGS });
  };

  const qualityOptions = [
    {
      id: 'low',
      title: dict.qualityLow,
      desc: dict.qualityLowDesc,
      badge: '30 FPS',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800'
    },
    {
      id: 'medium',
      title: dict.qualityMedium,
      desc: dict.qualityMediumDesc,
      badge: 'Dengeli',
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800'
    },
    {
      id: 'high',
      title: dict.qualityHigh,
      desc: dict.qualityHighDesc,
      badge: '60 FPS',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
    },
    {
      id: 'ultra',
      title: dict.qualityUltra,
      desc: dict.qualityUltraDesc,
      badge: '4K / Ultra',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-800'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-emerald-400" />
            {dict.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{dict.subtitle}</p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {dict.resetDefaults}
        </button>
      </div>

      <div className="space-y-8">
        {/* Section 1: Graphics Quality */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">{dict.graphicsQuality}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qualityOptions.map((opt) => {
              const isSelected = settings.graphicQuality === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleQualityChange(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      {opt.title}
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 inline" />}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Grid Infrastructure Toggle */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-base text-white">{dict.infrastructureTitle}</h3>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                {dict.showInfrastructure}
                {settings.showInfrastructure ? (
                  <Eye className="w-4 h-4 text-cyan-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <p className="text-xs text-slate-400">{dict.showInfrastructureDesc}</p>
            </div>

            {/* Switch Toggle */}
            <button
              onClick={() => handleToggle('showInfrastructure')}
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none ${
                settings.showInfrastructure ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                  settings.showInfrastructure ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Living World Environment */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base text-white">{dict.worldEnvironment}</h3>
          </div>

          <div className="space-y-3">
            {/* Clouds Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-800/80 flex items-center justify-center text-sky-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{dict.showClouds}</div>
                  <p className="text-xs text-slate-400">{dict.showCloudsDesc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle('showClouds')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none ${
                  settings.showClouds ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.showClouds ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Traffic Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/80 flex items-center justify-center text-amber-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{dict.showTraffic}</div>
                  <p className="text-xs text-slate-400">{dict.showTrafficDesc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle('showTraffic')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none ${
                  settings.showTraffic ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.showTraffic ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Wildlife / Birds Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400">
                  <Bird className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{dict.showWildlife}</div>
                  <p className="text-xs text-slate-400">{dict.showWildlifeDesc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle('showWildlife')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none ${
                  settings.showWildlife ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.showWildlife ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

