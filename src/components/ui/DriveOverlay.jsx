'use client';

import React, { useState } from 'react';
import {
  Car,
  X,
  Compass,
  HelpCircle,
  Zap
} from 'lucide-react';
import VirtualJoystick from './VirtualJoystick';

export default function DriveOverlay({
  stats = {},
  cameraMode = 'cockpit',
  onCameraModeChange = () => { },
  onTouchInputChange = () => { },
  onExit = () => { },
  lang = 'tr'
}) {
  const [showHelp, setShowHelp] = useState(false);

  const speedKmh = stats.speedKmh || 0;
  const gear = stats.gear || 'P';
  const headingDeg = stats.headingDeg || 0;
  const altitude = stats.altitude || 0;
  const coordX = stats.x || 0;
  const coordZ = stats.z || 0;
  const isBraking = stats.isBraking || false;
  const isBoost = stats.isBoost || false;

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
      {/* 1. TOP BAR: Sleek Compass & Coordinates Telemetry (Left) + Help & Exit (Right) */}
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

          {/* Prominent Exit Driving Mode Button */}
          <button
            type="button"
            onClick={onExit}
            className="px-3.5 py-2 sm:px-4 sm:py-2 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 hover:border-rose-400 text-rose-200 font-extrabold text-xs backdrop-blur-md shadow-2xl transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2 cursor-pointer group"
            title={lang === 'tr' ? 'Sürüşten Çıkış (ESC)' : 'Exit (ESC)'}
          >
            <X className="w-4 h-4 text-rose-400 group-hover:rotate-90 transition-transform" />
            <span>{lang === 'tr' ? 'Çıkış' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* 2. HELP MODAL POPUP (When help button is clicked) */}
      {showHelp && (
        <div className="self-center bg-slate-900/95 border border-slate-700/90 rounded-2xl p-4 max-w-sm w-full shadow-2xl backdrop-blur-xl pointer-events-auto text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'tr' ? 'Araç Kontrolleri' : 'Vehicle Controls'}</span>
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
              <span className="text-slate-400">{lang === 'tr' ? 'İleri Gaz' : 'Accelerate'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                W / ↑
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
              <span className="text-cyan-300 font-semibold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                {lang === 'tr' ? 'Turbo Hızlanma (Nitro)' : 'Turbo Boost'}
              </span>
              <kbd className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 font-mono font-bold text-cyan-300">
                SHIFT
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Fren & Geri Vites' : 'Brake / Reverse'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                S / ↓
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Direksiyon Sol / Sağ' : 'Steering Left / Right'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                A / D
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'El Freni' : 'Handbrake'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                BOŞLUK
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Kamera Değiştir' : 'Switch Camera'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                C / V
              </kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">{lang === 'tr' ? 'Havadan Görünüme Dön' : 'Exit Driving'}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-white">
                ESC
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTTOM SECTION: Speedometer, Compass & Mobile Virtual Controls */}
      <div className="w-full flex items-end justify-between gap-4 pointer-events-none">
        {/* MOBILE 360° VIRTUAL JOYSTICK (Left Side: Sola yuvarlak içinde nokta sürükleyerek 360° kontrol) */}
        <div className="flex sm:hidden pointer-events-auto pb-2">
          <VirtualJoystick onMove={onTouchInputChange} />
        </div>

        {/* CENTER DASHBOARD: Speedometer & Gear Telemetry (Mobilde kompakt/küçük, desktopta geniş) */}
        <div className="pointer-events-auto mx-auto bg-slate-900/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl px-2.5 py-1.5 sm:px-6 sm:py-3.5 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 sm:gap-6">
          {/* Gear Indicator */}
          <div className="flex flex-col items-center border-r border-slate-800 pr-2 sm:pr-5">
            <span className="text-[7px] sm:text-[9px] uppercase font-bold text-slate-500 tracking-wider">VİTES</span>
            <span
              className={`text-base sm:text-3xl font-black font-mono transition-colors ${gear === 'D'
                  ? 'text-emerald-400'
                  : gear === 'R'
                    ? 'text-amber-400 animate-pulse'
                    : 'text-slate-400'
                }`}
            >
              {gear}
            </span>
          </div>

          {/* Speedometer Digital Numbers & Arc */}
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-0.5 sm:gap-1 relative">
              <span className="text-xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow">
                {speedKmh}
              </span>
              <span className="text-[8px] sm:text-xs font-bold text-emerald-400 uppercase">km/s</span>

              {isBoost && (
                <span className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/90 border border-cyan-400/80 px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full shadow-lg shadow-cyan-500/30 flex items-center gap-0.5 animate-pulse">
                  <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-cyan-400 fill-cyan-400" />
                  TURBO
                </span>
              )}
            </div>

            {/* Dynamic Speed Progress Bar (Scaled to 160 km/h) */}
            <div className="w-14 sm:w-36 h-1 sm:h-1.5 bg-slate-950 rounded-full overflow-hidden mt-0.5 sm:mt-1 border border-slate-800">
              <div
                className={`h-full transition-all duration-75 rounded-full ${isBraking
                    ? 'bg-rose-500'
                    : isBoost
                      ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 animate-pulse'
                      : speedKmh > 75
                        ? 'bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500'
                        : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                  }`}
                style={{ width: `${Math.min(100, (speedKmh / 160) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* MOBILE TURBO / BOOST (Right Side: Sağa sadece büyük Turbo butonu) */}
        <div className="flex sm:hidden pointer-events-auto pb-2 items-end">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onTouchInputChange({ boost: true });
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onTouchInputChange({ boost: false });
            }}
            onPointerLeave={() => onTouchInputChange({ boost: false })}
            onPointerCancel={() => onTouchInputChange({ boost: false })}
            className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all select-none touch-none cursor-pointer ${
              isBoost
                ? 'bg-cyan-500 border-cyan-200 text-white shadow-cyan-500/50 scale-105'
                : 'bg-cyan-950/85 active:bg-cyan-600 border-cyan-500/50 text-cyan-300 shadow-xl'
            }`}
            title="Turbo Boost (Nitro)"
          >
            <Zap className={`w-6 h-6 ${isBoost ? 'fill-white animate-pulse' : 'fill-cyan-400'}`} />
            <span className="text-[9px] font-black tracking-wider uppercase mt-0.5">TURBO</span>
          </button>
        </div>
      </div>
    </div>
  );
}

