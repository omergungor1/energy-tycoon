'use client';

import React from 'react';
import {
  X,
  Zap,
  Globe,
  Train,
  Flame,
  FastForward
} from 'lucide-react';

export default function CinematicOverlay({
  tourType = 'grand',
  onTourTypeChange = () => {},
  speedMultiplier = 1.0,
  onSpeedChange = () => {},
  onExit = () => {},
  lang = 'tr'
}) {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none font-sans">
      {/* 1. TOP-RIGHT: Minimalist Exit Button */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-50 pointer-events-auto">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-900/85 hover:bg-rose-950/90 border border-slate-700/80 hover:border-rose-500/60 text-slate-300 hover:text-rose-200 text-xs font-bold backdrop-blur-xl shadow-2xl transition-all active:scale-95 cursor-pointer group"
          title={lang === 'tr' ? 'Sinema Modundan Çık (ESC)' : 'Exit Cinema Mode (ESC)'}
        >
          <X className="w-4 h-4 text-rose-400 group-hover:rotate-90 transition-transform" />
          <span>{lang === 'tr' ? 'Çıkış' : 'Exit'}</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700 text-slate-400">ESC</kbd>
        </button>
      </div>

      {/* 2. BOTTOM BAR: Mobile-Optimized Tour Selector & Speed Controller */}
      <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[96vw]">
        <div className="bg-slate-950/85 sm:bg-slate-900/90 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-1 sm:p-2 backdrop-blur-xl shadow-2xl flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          {/* Route 1: Grand Island */}
          <button
            type="button"
            onClick={() => onTourTypeChange('grand')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tourType === 'grand'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title={lang === 'tr' ? 'Büyük Ada Panoraması' : 'Grand Island Panorama'}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">{lang === 'tr' ? 'Büyük Ada' : 'Grand Island'}</span>
            <span className="xs:hidden">{lang === 'tr' ? 'Ada' : 'Island'}</span>
          </button>

          {/* Route 2: Plants & Facilities */}
          <button
            type="button"
            onClick={() => onTourTypeChange('plants')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tourType === 'plants'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title={lang === 'tr' ? 'Enerji Tesisleri' : 'Power Facilities'}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">{lang === 'tr' ? 'Tesisler' : 'Facilities'}</span>
            <span className="xs:hidden">{lang === 'tr' ? 'Tesis' : 'Plants'}</span>
          </button>

          {/* Route 3: Scenic Life & Train */}
          <button
            type="button"
            onClick={() => onTourTypeChange('scenic')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tourType === 'scenic'
                ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
            title={lang === 'tr' ? 'Yaşam Kasabaları, Nehirler & Tren' : 'Settlements, Rivers & Train'}
          >
            <Train className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">{lang === 'tr' ? 'Yaşam & Tren' : 'Life & Train'}</span>
            <span className="xs:hidden">{lang === 'tr' ? 'Tren' : 'Train'}</span>
          </button>

          {/* Route 4: Firewatch Wilderness */}
          <button
            type="button"
            onClick={() => onTourTypeChange('firewatch')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
              tourType === 'firewatch'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md shadow-orange-500/30 font-extrabold'
                : 'text-orange-300 hover:text-orange-100 hover:bg-orange-950/40'
            }`}
            title={lang === 'tr' ? 'Firewatch Modu: Doğa, Gözetleme Kulesi & Yavaş Sinematik Tur' : 'Firewatch Mode: Pines, Tower & Slow Tour'}
          >
            <Flame className="w-3.5 h-3.5 shrink-0 text-orange-400" />
            <span>Firewatch</span>
          </button>

          <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5" />

          {/* Speed Toggle (1.0x / 1.6x) */}
          <button
            type="button"
            onClick={() => onSpeedChange(speedMultiplier === 1.0 ? 1.6 : 1.0)}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
            title={lang === 'tr' ? 'Kamera Tur Hızı' : 'Tour Speed'}
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            <span>{speedMultiplier === 1.0 ? '1.0x' : '1.6x'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
