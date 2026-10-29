'use client';

import React from 'react';
import Image from 'next/image';
import {
  Zap,
  DollarSign,
  TrendingUp,
  Award,
  Sun,
  Moon,
  Clock,
  Globe,
  LogOut,
  Map,
  ShoppingBag,
  Factory,
  BarChart3,
  BatteryCharging,
  Landmark,
  Trophy,
  Settings
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export default function TopHud({
  company,
  finance,
  clock,
  spotPrice,
  totalCapacityKw,
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onLogout,
  onOpenTreasury
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const isNight = clock?.isNight ?? false;

  // XP Progress to next level
  const currentXp = Number(company?.xp || 0);
  const currentLevel = Number(company?.level || 1);
  const xpInCurrentLevel = currentXp % 1000;
  const xpProgressPct = Math.min(100, (xpInCurrentLevel / 1000) * 100);

  const navItems = [
    { id: 'map', label: dict.nav.map, icon: Map },
    { id: 'sites', label: dict.nav.sites, icon: Globe },
    { id: 'shop', label: dict.nav.shop, icon: ShoppingBag },
    { id: 'plants', label: dict.nav.plants, icon: Factory },
    { id: 'market', label: dict.nav.market, icon: BarChart3 },
    { id: 'battery', label: dict.nav.battery, icon: BatteryCharging },
    { id: 'finance', label: dict.nav.finance, icon: Landmark },
    { id: 'leaderboard', label: dict.nav.leaderboard, icon: Trophy },
    { id: 'settings', label: dict.nav.settings, icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 py-2.5 shadow-xl select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Company Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Energy Tycoon"
              width={36}
              height={36}
              className="w-9 h-9 object-contain drop-shadow"
              priority
            />
            <div>
              <div className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {company?.name || 'Energy Corp'}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  Lv.{currentLevel}
                </span>
                <span>•</span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden inline-block align-middle">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${xpProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 text-xs">
            {/* Cash Pill - Interactive Treasury Modal Trigger */}
            <button
              onClick={onOpenTreasury}
              type="button"
              title={dict.treasury?.viewDetails || 'Kasa Detayları için Tıklayın'}
              className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 hover:border-emerald-400 px-3 py-1.5 rounded-lg text-emerald-300 font-bold transition-all shadow-md hover:shadow-emerald-900/40 hover:scale-105 active:scale-95 cursor-pointer group select-none"
            >
              <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>${Number(company?.cash || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-mono font-extrabold ml-1 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                DETAY
              </span>
            </button>

            {/* Net Worth */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>{dict.hud.netWorth}:</span>
              <strong className="text-white">${Number(finance?.netWorth || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Center: Market & Game Calendar Stats */}
        <div className="flex items-center gap-3 text-xs w-full md:w-auto justify-center">
          {/* Capacity */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{dict.hud.totalCapacity}:</span>
            <strong className="text-white">{(totalCapacityKw / 1000).toFixed(1)} MW</strong>
          </div>

          {/* Spot Price */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-400">Spot:</span>
            <strong className="text-emerald-400 font-mono">${spotPrice?.pricePerKwh}/kWh</strong>
          </div>

          {/* Clock & Season */}
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{clock?.formattedDate || 'Yıl 1, Gün 1'}</span>
            <span className="font-mono text-cyan-300 font-bold">{clock?.formattedHour || '12:00'}</span>
            <span className="text-xs">
              {isNight ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400 inline" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400 inline" />
              )}
            </span>
          </div>
        </div>

        {/* Right: Language switch & Logout */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="flex items-center gap-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-slate-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase font-bold">{lang}</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="text-xs bg-slate-900 hover:bg-red-950/60 border border-slate-700/80 hover:border-red-500/40 p-2 rounded-lg text-slate-400 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

