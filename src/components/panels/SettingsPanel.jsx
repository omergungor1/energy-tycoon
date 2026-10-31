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
  Sliders,
  CircleDot,
  Tag,
  Sunset,
  Music,
  Volume2,
  VolumeX
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export const DEFAULT_SETTINGS = {
  showInfrastructure: true,
  graphicQuality: 'high', // 'low' | 'medium' | 'high' | 'ultra'
  showClouds: true,
  showTraffic: true,
  showWildlife: true,
  showSiteBoundaries: false,
  showSiteLabels: false,
  firewatchMode: true,
  bgMusicEnabled: true,
  bgMusicVolume: 0.65 // 0.0 - 1.0 (65% healthy default)
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

  const handleVolumeChange = (vol) => {
    const next = { ...settings, bgMusicVolume: vol };
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
              className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none cursor-pointer ${
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

        {/* Section 3: Plant & Site Markers Visibility (Rings & Labels Toggle) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <CircleDot className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base text-white">{dict.siteMarkersTitle}</h3>
          </div>

          <div className="space-y-3">
            {/* Site Boundary Rings & Pylons Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 shrink-0">
                  <CircleDot className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    {dict.showSiteBoundaries}
                    {settings.showSiteBoundaries ? (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{dict.showSiteBoundariesDesc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle('showSiteBoundaries')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none cursor-pointer shrink-0 ${
                  settings.showSiteBoundaries ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.showSiteBoundaries ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Site Name Labels & 3D Badges Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    {dict.showSiteLabels}
                    {settings.showSiteLabels ? (
                      <Eye className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{dict.showSiteLabelsDesc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle('showSiteLabels')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none cursor-pointer shrink-0 ${
                  settings.showSiteLabels ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.showSiteLabels ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Living World Environment */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white">{dict.worldEnvironment}</h3>
          </div>

          <div className="space-y-3">
            {/* Firewatch Cinematic Aesthetic Toggle */}
            <div className="bg-slate-950/60 border border-amber-900/40 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-950/70 border border-amber-700/80 flex items-center justify-center text-amber-400 shrink-0">
                  <Sunset className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                    {dict.firewatchAtmosphere}
                    {settings.firewatchMode && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                        ÖNERİLEN
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{dict.firewatchAtmosphereDesc}</p>
                </div>
              </div>

              <button
                onClick={() => handleToggle('firewatchMode')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none cursor-pointer shrink-0 ${
                  settings.firewatchMode ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.firewatchMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
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

        {/* Section 5: Audio & Ambient Music (Firewatch & Minecraft Style) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">{dict.audioTitle || 'Ses & Müzik'}</h3>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
              Firewatch & C418
            </span>
          </div>

          <div className="space-y-4">
            {/* Background Music Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                  settings.bgMusicEnabled !== false
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}>
                  {settings.bgMusicEnabled !== false ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{dict.bgMusic || 'Atmosferik Arka Plan Müziği'}</span>
                    {settings.bgMusicEnabled !== false && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                        AKTİF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {dict.bgMusicDesc || 'Minecraft (C418) ve Firewatch esintili sakinleştirici akustik piyano melodileri ve dağ rüzgârı.'}
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <button
                type="button"
                onClick={() => handleToggle('bgMusicEnabled')}
                className={`w-14 h-7 rounded-full transition-colors relative flex items-center px-1 focus:outline-none cursor-pointer shrink-0 ${
                  settings.bgMusicEnabled !== false ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                    settings.bgMusicEnabled !== false ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Volume Slider & Presets Card */}
            <div className={`bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 transition-all ${
              settings.bgMusicEnabled === false ? 'opacity-50 pointer-events-none' : ''
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    {dict.bgMusicVolume || 'Müzik Ses Yüksekliği'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  %{Math.round((typeof settings.bgMusicVolume === 'number' ? settings.bgMusicVolume : 0.65) * 100)}
                </span>
              </div>

              {/* Range Input Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={typeof settings.bgMusicVolume === 'number' ? settings.bgMusicVolume : 0.65}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
              />

              {/* Quick Volume Preset Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-800/60">
                {[
                  { label: '%25 Kısık', value: 0.25 },
                  { label: '%50 Orta', value: 0.50 },
                  { label: '%75 Canlı', value: 0.75 },
                  { label: '%100 Tam', value: 1.00 }
                ].map((preset) => {
                  const current = typeof settings.bgMusicVolume === 'number' ? settings.bgMusicVolume : 0.65;
                  const isCurrent = Math.abs(current - preset.value) < 0.05;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleVolumeChange(preset.value)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center border cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-900/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

