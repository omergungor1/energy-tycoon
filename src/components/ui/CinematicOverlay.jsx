'use client';

import React from 'react';
import {
  Film,
  X,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Train,
  Play,
  Pause,
  FastForward
} from 'lucide-react';

export default function CinematicOverlay({
  tourType = 'grand',
  onTourTypeChange = () => {},
  isPaused = false,
  onTogglePause = () => {},
  speedMultiplier = 1.0,
  onSpeedChange = () => {},
  isUiHidden = false,
  onToggleHideUi = () => {},
  onExit = () => {},
  lang = 'tr'
}) {
  if (isUiHidden) {
    return (
      <div className="fixed top-4 right-4 z-50 pointer-events-auto select-none">
        <button
          type="button"
          onClick={onToggleHideUi}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/75 hover:bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-bold backdrop-blur-md shadow-2xl transition-all cursor-pointer group"
          title={lang === 'tr' ? 'Arayüzü Göster (H tuşu)' : 'Show UI (H key)'}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>{lang === 'tr' ? 'Arayüzü Göster (H)' : 'Show UI (H)'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-3 sm:p-6 select-none font-sans">
      {/* 1. TOP BAR: Title & Quick Controls */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-2">
        {/* Left: Cinematic Mode Badge */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 sm:px-4 py-2 backdrop-blur-xl shadow-2xl">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Film className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">
              {lang === 'tr' ? 'Sinematik Kamera Turu' : 'Cinematic Island Tour'}
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">
              {tourType === 'grand' && (lang === 'tr' ? 'Büyük Ada Panoraması' : 'Grand Island Panorama')}
              {tourType === 'plants' && (lang === 'tr' ? 'Enerji Tesisleri Yakın Plan' : 'Energy Facilities Close-up')}
              {tourType === 'scenic' && (lang === 'tr' ? 'Doğa, Kasabalar & Tren' : 'Settlements, Train & Rivers')}
            </span>
          </div>
        </div>

        {/* Right: Hide UI & Exit */}
        <div className="flex items-center gap-2">
          {/* Hide UI Toggle */}
          <button
            type="button"
            onClick={onToggleHideUi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold backdrop-blur-md shadow-lg transition-all cursor-pointer"
            title={lang === 'tr' ? 'Arayüzü Gizle (H)' : 'Hide UI (H)'}
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{lang === 'tr' ? 'Arayüzü Gizle' : 'Hide UI'}</span>
            <kbd className="hidden md:inline px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">H</kbd>
          </button>

          {/* Exit Cinematic Mode */}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 hover:border-rose-400 text-rose-200 font-extrabold text-xs backdrop-blur-md shadow-2xl transition-all active:scale-95 cursor-pointer group"
            title={lang === 'tr' ? 'Turdan Çıkış (ESC)' : 'Exit Tour (ESC)'}
          >
            <X className="w-4 h-4 text-rose-400 group-hover:rotate-90 transition-transform" />
            <span>{lang === 'tr' ? 'Çıkış' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* 2. BOTTOM BAR: Tour Route Switcher & Playback Bar */}
      <div className="w-full flex justify-center pointer-events-auto pb-2 sm:pb-4">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-2 sm:p-2.5 backdrop-blur-xl shadow-2xl flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Route 1: Grand Island */}
          <button
            type="button"
            onClick={() => onTourTypeChange('grand')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              tourType === 'grand'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Büyük Ada' : 'Grand Island'}</span>
          </button>

          {/* Route 2: Plants & Facilities */}
          <button
            type="button"
            onClick={() => onTourTypeChange('plants')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              tourType === 'plants'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Tesisler' : 'Facilities'}</span>
          </button>

          {/* Route 3: Scenic Life & Train */}
          <button
            type="button"
            onClick={() => onTourTypeChange('scenic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              tourType === 'scenic'
                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Yaşam & Tren' : 'Life & Train'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Speed Toggle (1x / 1.5x) */}
          <button
            type="button"
            onClick={() => onSpeedChange(speedMultiplier === 1.0 ? 1.6 : 1.0)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
            title={lang === 'tr' ? 'Kamera Hızı' : 'Tour Speed'}
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>{speedMultiplier === 1.0 ? '1.0x' : '1.6x'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

