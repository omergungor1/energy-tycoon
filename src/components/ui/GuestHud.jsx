'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Car,
  LogOut,
  TrendingUp,
  Coins,
  Calendar,
  Sparkles,
  ShieldCheck,
  Award,
  ArrowRight,
  Eye,
  Info
} from 'lucide-react';

function formatMoney(val) {
  const num = Number(val || 0);
  return '$' + Math.round(num).toLocaleString('en-US');
}

export default function GuestHud({
  company,
  finance = {},
  playerDay = 1,
  clock = {},
  onExitGuestMode
}) {
  const netWorth = finance.netWorth ?? company?.cash ?? 0;
  const cash = company?.cash ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-2 sm:p-3 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Brand & Guest Mode Badge */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 sm:gap-3 pointer-events-auto">
          {/* Logo & Guest Badge */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 backdrop-blur-xl shadow-2xl">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Energy Tycoon"
                width={28}
                height={28}
                className="w-7 h-7 object-contain drop-shadow"
                priority
              />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Misafir Gözlemci
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {company?.name || 'Enerji Şirketi'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Lv.{company?.level || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Quick Exit Button */}
          <button
            type="button"
            onClick={onExitGuestMode}
            className="sm:hidden px-3 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1 active:scale-95 shadow-lg"
            title="Misafir Modundan Çık"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>

        {/* Center: Showcase Metrics (Şirket Değeri, Kasa Durumu, Oyuncu Günü) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-2.5 sm:px-4 py-1.5 backdrop-blur-xl shadow-2xl overflow-x-auto max-w-full">
          {/* Net Worth (Şirket Değeri) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 py-0.5 border-r border-slate-800">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Şirket Değeri
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-emerald-400 leading-none">
                {formatMoney(netWorth)}
              </div>
            </div>
          </div>

          {/* Cash (Kasa Durumu) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 py-0.5 border-r border-slate-800">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Kasa Durumu
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-cyan-300 leading-none">
                {formatMoney(cash)}
              </div>
            </div>
          </div>

          {/* Game Day (Oyuncu Günü) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-1.5 py-0.5">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <div className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider text-slate-400">
                Oyuncu Günü
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-amber-300 leading-none">
                {playerDay}. Gün
              </div>
            </div>
          </div>
        </div>

        {/* Right: Conversion CTA & Exit Guest Mode Button */}
        <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
          {/* Sign Up CTA */}
          <Link
            href="/register"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            title="Kendi Şirketini Kur ve $100.000 Hibe Al"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Kendi Şirketini Kur ($100k Hibe)</span>
          </Link>

          {/* Exit Guest Mode Button */}
          <button
            type="button"
            onClick={onExitGuestMode}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-red-950/80 border border-slate-700/80 hover:border-red-500/50 text-slate-300 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xl cursor-pointer"
            title="Misafir Modundan Çık ve Giriş Sayfasına Dön"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Misafir Modundan Çık</span>
          </button>
        </div>
      </div>
    </header>
  );
}

