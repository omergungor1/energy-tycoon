'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Settings,
  User,
  ChevronDown,
  Check,
  SlidersHorizontal
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export default function TopHud({
  company,
  user,
  finance,
  clock,
  spotPrice,
  totalCapacityKw,
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onLogout,
  onOpenTreasury,
  mySites = [],
  focusedSite = null,
  onFocusPlant = () => {}
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const isNight = clock?.isNight ?? false;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [plantMenuOpen, setPlantMenuOpen] = useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const plantMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (plantMenuRef.current && !plantMenuRef.current.contains(event.target)) {
        setPlantMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setPlantMenuOpen(false);
      }
    }
    if (userMenuOpen || plantMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen, plantMenuOpen]);

  const selectedPlant = useMemo(() => {
    if (!mySites || mySites.length === 0) return null;
    if (focusedSite?.siteId) {
      const found = mySites.find((s) => s.siteId === focusedSite.siteId);
      if (found) return found;
    }
    return mySites[0];
  }, [mySites, focusedSite]);

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
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 text-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 shadow-xl select-none">
      {/* Top Main Single Row for All Screen Sizes */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand & Company Identity */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0">
          <Image
            src="/logo.png"
            alt="Energy Tycoon"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow shrink-0"
            priority
          />
          <div className="min-w-0">
            <div className="font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
              {company?.name || 'Energy Corp'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                <Award className="w-3 h-3" />
                Lv.{currentLevel}
              </span>
              <span className="hidden sm:inline">•</span>
              <div className="hidden sm:inline-block w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden align-middle">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${xpProgressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Plant Selector Dropdown (User's Owned & Leased Facilities) */}
        <div className="relative shrink-0" ref={plantMenuRef}>
          <button
            type="button"
            onClick={() => {
              setPlantMenuOpen((prev) => !prev);
              setUserMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer ${
              plantMenuOpen
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/40'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-500'
            }`}
            title={lang === 'tr' ? 'Santralime Git / Seç' : 'Focus Plant / Select'}
            aria-expanded={plantMenuOpen}
          >
            <Factory className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold truncate max-w-[70px] xs:max-w-[105px] sm:max-w-[140px] md:max-w-[180px]">
              {selectedPlant?.plantName || (lang === 'tr' ? 'Santrallerim' : 'My Plants')}
            </span>
            {mySites.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                {mySites.length}
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                plantMenuOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {/* Plant Dropdown Menu Panel */}
          {plantMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">
                    {lang === 'tr' ? 'Santrallerim' : 'My Power Plants'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {mySites.length} {lang === 'tr' ? 'Tesis' : 'Plants'}
                </span>
              </div>

              {mySites.length === 0 ? (
                <div className="px-3 py-5 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-300 mb-1">
                    {lang === 'tr' ? 'Kiralık veya Satın Alınmış Santral Yok' : 'No Leased or Owned Plants'}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    {lang === 'tr'
                      ? 'Haritadaki 24 sahadan birini kiralayarak veya tapusunu alarak ilk tesisinizi kurun.'
                      : 'Lease or purchase land from the 24 sites to build your plant.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPlantMenuOpen(false);
                      setActiveTab('sites');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    <span>{lang === 'tr' ? 'Arazileri İncele' : 'Browse Sites'}</span>
                  </button>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {mySites.map((site) => {
                    const isSelected = selectedPlant?.siteId === site.siteId;
                    return (
                      <button
                        key={site.companySiteId || site.siteId}
                        type="button"
                        onClick={() => {
                          onFocusPlant(site.siteId);
                          setPlantMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500/50 text-white shadow-sm ring-1 ring-cyan-500/30'
                            : 'bg-slate-950/40 hover:bg-slate-800/80 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                              site.regionType === 'wind'
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : site.regionType === 'solar'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {site.siteId}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-xs truncate flex items-center gap-1">
                              <span className="truncate">{site.plantName}</span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-ping inline-block" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <span className="truncate">{site.siteName}</span>
                              <span>•</span>
                              <span className="capitalize shrink-0">
                                {site.regionType === 'wind'
                                  ? 'Rüzgâr'
                                  : site.regionType === 'solar'
                                  ? 'Güneş'
                                  : 'Hibrit'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded border ${
                              site.tenureType === 'own'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {site.tenureType === 'own'
                              ? lang === 'tr'
                                ? 'MÜLK'
                                : 'OWNED'
                              : lang === 'tr'
                              ? 'KİRALIK'
                              : 'LEASED'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center: Market & Game Calendar Stats (DESKTOP ONLY: md:flex) */}
        <div className="hidden md:flex items-center gap-2.5 text-xs">
          {/* Capacity */}
          <div className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline text-slate-400">{dict.hud.totalCapacity}:</span>
            <strong className="text-white">{(totalCapacityKw / 1000).toFixed(1)} MW</strong>
          </div>

          {/* Spot Price */}
          <div className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
            <span className="text-slate-400">Spot:</span>
            <strong className="text-emerald-400 font-mono">${spotPrice?.pricePerKwh}/kWh</strong>
          </div>

          {/* Clock & Season */}
          <div className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-slate-300 flex items-center gap-1.5">
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

          {/* Net Worth */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-slate-300">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">{dict.hud.netWorth}:</span>
            <strong className="text-white">${Number(finance?.netWorth || 0).toLocaleString()}</strong>
          </div>
        </div>

        {/* Right: Cash + Mobile Detay Toggle + Circular User Icon */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cash Pill - Interactive Treasury Modal Trigger */}
          <button
            onClick={onOpenTreasury}
            type="button"
            title={dict.treasury?.viewDetails || 'Kasa Detayları için Tıklayın'}
            className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 hover:border-emerald-400 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-emerald-300 font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>${Number(company?.cash || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            <span className="hidden sm:inline text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-mono font-extrabold ml-0.5">
              DETAY
            </span>
          </button>

          {/* Mobile Info / Stats Toggle Button (Mobile Only: md:hidden) */}
          <button
            type="button"
            onClick={() => setMobileStatsOpen((prev) => !prev)}
            className={`md:hidden flex items-center gap-1 px-2 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer ${
              mobileStatsOpen
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-sm ring-1 ring-cyan-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
            title={mobileStatsOpen ? 'İstatistikleri Kapat' : 'İstatistik Detayları'}
            aria-expanded={mobileStatsOpen}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-bold hidden xs:inline">Detay</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                mobileStatsOpen ? 'rotate-180 text-cyan-400' : ''
              }`}
            />
          </button>

          {/* Compact Circular User Icon & Dropdown Menu */}
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setPlantMenuOpen(false);
              }}
              type="button"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all select-none cursor-pointer relative ${
                userMenuOpen
                  ? 'bg-slate-800 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-500'
              }`}
              title={lang === 'tr' ? 'Hesap & Menü' : 'Account & Menu'}
              aria-expanded={userMenuOpen}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-mono font-black uppercase px-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-700/80 leading-tight">
                {lang}
              </span>
            </button>

            {/* User Dropdown Panel */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200">
                {/* User / Company Header */}
                <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1">
                  <div className="font-bold text-xs text-white truncate">
                    {user?.displayName || company?.name || 'Enerji Girişimcisi'}
                  </div>
                  {user?.email && (
                    <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                      {user.email}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Lv.{currentLevel}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 truncate max-w-[130px]">
                      {company?.name || 'Energy Corp'}
                    </span>
                  </div>
                </div>

                {/* Language Selector Section */}
                <div className="p-1.5">
                  <div className="px-1 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === 'tr' ? 'Dil' : 'Language'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {lang === 'tr' ? 'Türkçe' : 'English'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setLang('tr');
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        lang === 'tr'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>Türkçe</span>
                      {lang === 'tr' && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLang('en');
                      }}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        lang === 'en'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>English</span>
                      {lang === 'en' && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-1 border-t border-slate-800/80" />

                {/* Settings quick link */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    setActiveTab('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>{dict.nav.settings}</span>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors text-left mt-0.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>{lang === 'tr' ? 'Çıkış Yap' : 'Log Out'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Secondary Stats Strip */}
      {mobileStatsOpen && (
        <div className="md:hidden mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 xs:grid-cols-3 gap-1.5 text-xs animate-in slide-in-from-top-2 duration-150">
          {/* Capacity */}
          <div className="bg-slate-900/90 border border-slate-800/90 p-2 rounded-xl flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-slate-400 leading-none">{dict.hud.totalCapacity}</div>
              <div className="font-bold text-white text-xs mt-0.5">{(totalCapacityKw / 1000).toFixed(1)} MW</div>
            </div>
          </div>

          {/* Spot Price */}
          <div className="bg-slate-900/90 border border-slate-800/90 p-2 rounded-xl flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] text-slate-400 leading-none">Spot Fiyat</div>
              <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">${spotPrice?.pricePerKwh}</div>
            </div>
          </div>

          {/* Game Calendar & Clock */}
          <div className="bg-slate-900/90 border border-slate-800/90 p-2 rounded-xl flex items-center gap-2 col-span-2 xs:col-span-1">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <div className="min-w-0 truncate">
              <div className="text-[9px] text-slate-400 leading-none flex items-center gap-1">
                <span>{clock?.formattedDate || 'Yıl 1'}</span>
                {isNight ? (
                  <Moon className="w-2.5 h-2.5 text-indigo-400 inline" />
                ) : (
                  <Sun className="w-2.5 h-2.5 text-amber-400 inline" />
                )}
              </div>
              <div className="font-mono font-bold text-cyan-300 text-xs mt-0.5">{clock?.formattedHour || '12:00'}</div>
            </div>
          </div>

          {/* Net Worth */}
          <div className="bg-slate-900/90 border border-slate-800/90 p-2 rounded-xl flex items-center gap-2 col-span-2 xs:col-span-3">
            <Landmark className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-slate-400">{dict.hud.netWorth}:</span>
              <strong className="text-white font-mono text-xs">${Number(finance?.netWorth || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto mt-1.5 pt-1.5 border-t border-slate-800/70 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
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
