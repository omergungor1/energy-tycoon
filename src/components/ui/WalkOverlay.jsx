'use client';

import React, { useState } from 'react';
import {
  X,
  Compass,
  HelpCircle,
  Footprints,
  Zap,
  Activity
} from 'lucide-react';
import VirtualJoystick from './VirtualJoystick';

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
        {/* Left: Sleek Compass Rose & Island Coordinates Telemetry (Gizlendi: Mobilde gereksiz yer kaplamaması için desktop/tablette gösterilir) */}
        <div className="hidden sm:flex items-center gap-2.5 sm:gap-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 sm:px-4 py-2 backdrop-blur-xl shadow-2xl transition-all">
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
        <div className="flex items-center gap-2 ml-auto">
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

      {/* 3. BOTTOM SECTION: Mobile Controls */}
      <div className="w-full flex items-end justify-between gap-4 pointer-events-none">
        {/* MOBILE 360° VIRTUAL JOYSTICK (Left Side: Sola yuvarlak içinde nokta sürükleyerek 360° yürüme) */}
        <div className="flex sm:hidden pointer-events-auto pb-2">
          <VirtualJoystick onMove={onTouchInputChange} />
        </div>

        {/* MOBILE SPRINT / RUN (Right Side: Sağa sadece büyük Koşu / Turbo butonu) */}
        <div className="flex sm:hidden pointer-events-auto pb-2 items-end">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInputChange({ run: true, boost: true });
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onTouchInputChange({ run: false, boost: false });
            }}
            onPointerLeave={() => onTouchInputChange({ run: false, boost: false })}
            onPointerCancel={() => onTouchInputChange({ run: false, boost: false })}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all select-none touch-none cursor-pointer ${
              isRunning
                ? 'bg-cyan-500 border-cyan-200 text-white shadow-cyan-500/50 scale-105'
                : 'bg-cyan-950/85 active:bg-cyan-600 border-cyan-500/50 text-cyan-300 shadow-xl'
            }`}
            title={lang === 'tr' ? 'Koşu / Hızlı Adım (Turbo)' : 'Sprint / Run (Turbo)'}
          >
            <Zap className={`w-6 h-6 ${isRunning ? 'fill-white animate-pulse' : 'fill-cyan-400'}`} />
            <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">
              {lang === 'tr' ? 'KOŞU' : 'RUN'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

