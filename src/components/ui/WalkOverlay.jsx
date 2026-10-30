'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Footprints,
  Zap,
  Activity
} from 'lucide-react';

export default function WalkOverlay({
  stats = {},
  cameraMode = 'chase',
  onCameraModeChange = () => {},
  onTouchInputChange = () => {},
  onExit = () => {},
  lang = 'tr'
}) {
  const [showHelp, setShowHelp] = useState(false);

  const speedKmh = stats.speedKmh || 0;
  const isRunning = stats.isRunning || false;
  const headingDeg = stats.headingDeg || 0;
  const altitude = stats.altitude || 0;
  const coordX = stats.x || 0;
  const coordZ = stats.z || 0;
  const distanceMeters = stats.distanceMeters || 0;

  // Compute 8-point compass cardinal text
  const getCardinal = (deg) => {
    const val = Math.floor((deg / 45) + 0.5) % 8;
    if (lang === 'tr') {
      const arr = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
      return arr[val];
    }
    const arr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return arr[val];
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-3 sm:p-6 select-none font-sans">
      {/* 1. TOP BAR: Sleek Compass & Coordinates (Left) + Help & Exit (Right) */}
      <div className="flex items-center justify-between w-full pointer-events-auto gap-2">
        {/* Left: Sleek Compass Rose & Island Coordinates Telemetry */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 sm:px-4 py-2 backdrop-blur-xl shadow-2xl transition-all">
          <div className="flex items-center gap-2 text-slate-200 text-xs font-bold">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-inner">
              <Compass
                className="w-4 h-4 text-cyan-400 shrink-0 transition-transform duration-100 ease-out"
                style={{ transform: `rotate(${-headingDeg}deg)` }}
              />
            </div>
            <span className="tracking-wide text-white font-extrabold">{getCardinal(headingDeg)}</span>
            <span className="text-[11px] font-mono text-cyan-300 font-bold">({headingDeg}°)</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="text-slate-400">
              X:<span className="text-slate-200 font-semibold">{coordX}</span> Z:<span className="text-slate-200 font-semibold">{coordZ}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              {altitude}m
            </span>
          </div>
        </div>

        {/* Center / Right: Help & Exit Button */}
        <div className="flex items-center gap-2">
          {/* Controls Help Toggle */}
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
            title={lang === 'tr' ? 'Tuş Kontrolleri' : 'Controls Guide'}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{lang === 'tr' ? 'Kontroller' : 'Controls'}</span>
          </button>

          {/* Prominent Exit Walking Mode Button */}
          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-2 sm:px-4 sm:py-2 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 hover:border-rose-400 text-rose-200 font-extrabold text-xs backdrop-blur-md shadow-2xl transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
            title={lang === 'tr' ? 'Yürüyüşten Çıkış (ESC)' : 'Exit (ESC)'}
          >
            <X className="w-4 h-4 text-rose-400 group-hover:rotate-90 transition-transform" />
            <span>{lang === 'tr' ? 'Çıkış' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* 2. HELP MODAL POPUP */}
      {showHelp && (
        <div className="self-center bg-slate-900/95 border border-slate-700/90 rounded-2xl p-4 max-w-sm w-full shadow-2xl backdrop-blur-xl pointer-events-auto text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Footprints className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'tr' ? 'Yaya Keşif Kontrolleri' : 'Walking Controls'}</span>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'İleri Yürü' : 'Walk Forward'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                W / ↑
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
              <span className="text-cyan-300 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {lang === 'tr' ? 'Hızlı Koşu (Sprint)' : 'Sprint Run'}
              </span>
              <kbd className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 font-mono font-bold text-cyan-300">
                SHIFT
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Geri Adım' : 'Step Back'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                S / ↓
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Yön Dönüşü (Sol / Sağ)' : 'Turn Left / Right'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                A / D
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Zıplama' : 'Jump'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                BOŞLUK
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Kamera (3. Şahıs / Gözler)' : 'Toggle Camera'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                C / V
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Havadan Görünüme Dön' : 'Exit Walking'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                ESC
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTTOM SECTION: Pedestrian Dashboard & Mobile Controls */}
      <div className="w-full flex items-end justify-between gap-4 pointer-events-none">
        {/* MOBILE TOUCH CONTROLS (Left Side) */}
        <div className="flex sm:hidden pointer-events-auto gap-2 touch-none select-none pb-2">
          <button
            type="button"
            onPointerDown={() => onTouchInputChange({ left: true })}
            onPointerUp={() => onTouchInputChange({ left: false })}
            onPointerLeave={() => onTouchInputChange({ left: false })}
            className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-cyan-600/80 border border-slate-700 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onPointerDown={() => onTouchInputChange({ right: true })}
            onPointerUp={() => onTouchInputChange({ right: false })}
            onPointerLeave={() => onTouchInputChange({ right: false })}
            className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-cyan-600/80 border border-slate-700 text-white flex items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        {/* CENTER DASHBOARD: Pedestrian Walk & Run Telemetry */}
        <div className="pointer-events-auto mx-auto bg-slate-900/90 border border-slate-800/90 rounded-3xl p-3 sm:px-6 sm:py-3.5 backdrop-blur-xl shadow-2xl flex items-center gap-4 sm:gap-6">
          {/* Stride / Mode Indicator */}
          <div className="flex flex-col items-center border-r border-slate-800 pr-3 sm:pr-5">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
              {lang === 'tr' ? 'MOD' : 'MODE'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Footprints className={`w-4 h-4 ${isRunning ? 'text-cyan-400 animate-bounce' : speedKmh > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span
                className={`text-xs sm:text-sm font-black uppercase tracking-wide transition-colors ${
                  isRunning
                    ? 'text-cyan-300 font-extrabold animate-pulse'
                    : speedKmh > 0
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              >
                {isRunning ? (lang === 'tr' ? 'KOŞU' : 'RUN') : speedKmh > 0 ? (lang === 'tr' ? 'YÜRÜYÜŞ' : 'WALK') : (lang === 'tr' ? 'DURDU' : 'IDLE')}
              </span>
            </div>
          </div>

          {/* Digital Speed & Cadence Indicator */}
          <div className="flex flex-col items-center min-w-[90px] sm:min-w-[110px]">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {speedKmh}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">KM/S</span>
            </div>

            {/* Stride Speed Bar */}
            <div className="w-24 sm:w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className={`h-full transition-all duration-75 rounded-full ${
                  isRunning
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, (speedKmh / 18) * 100)}%` }}
              />
            </div>
          </div>

          {/* Distance Traveled Meter */}
          <div className="flex flex-col border-l border-slate-800 pl-3 sm:pl-5 text-left">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
              {lang === 'tr' ? 'MESAFE' : 'DISTANCE'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-extrabold font-mono text-cyan-300">
                {distanceMeters}
              </span>
              <span className="text-[10px] font-bold text-slate-400">m</span>
            </div>
          </div>
        </div>

        {/* MOBILE TOUCH PEDALS (Right Side) */}
        <div className="flex sm:hidden pointer-events-auto gap-2 touch-none select-none pb-2 items-end">
          <button
            type="button"
            onPointerDown={() => onTouchInputChange({ backward: true })}
            onPointerUp={() => onTouchInputChange({ backward: false })}
            onPointerLeave={() => onTouchInputChange({ backward: false })}
            className="w-14 h-14 rounded-2xl bg-rose-950/80 active:bg-rose-600 border border-rose-500/40 text-rose-200 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
          >
            <ArrowDown className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">{lang === 'tr' ? 'GERİ' : 'BACK'}</span>
          </button>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onPointerDown={() => onTouchInputChange({ run: true })}
              onPointerUp={() => onTouchInputChange({ run: false })}
              onPointerLeave={() => onTouchInputChange({ run: false })}
              className={`w-14 h-9 rounded-xl border flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer text-[10px] font-black uppercase ${
                isRunning
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/50'
                  : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{lang === 'tr' ? 'KOŞ' : 'RUN'}</span>
            </button>

            <button
              type="button"
              onPointerDown={() => onTouchInputChange({ forward: true })}
              onPointerUp={() => onTouchInputChange({ forward: false })}
              onPointerLeave={() => onTouchInputChange({ forward: false })}
              className="w-14 h-14 rounded-2xl bg-emerald-950/80 active:bg-emerald-600 border border-emerald-500/40 text-emerald-200 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all cursor-pointer"
            >
              <ArrowUp className="w-5 h-5" />
              <span className="text-[8px] font-bold uppercase">{lang === 'tr' ? 'İLERİ' : 'WALK'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

