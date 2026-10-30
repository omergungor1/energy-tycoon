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
  Calendar,
  Coins,
  RefreshCw,
  Edit3,
  RotateCcw,
  X,
  Menu,
  Volume2,
  VolumeX
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

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
  onOpenLeaderboard,
  onOpenMarket,
  mySites = [],
  focusedSite = null,
  onFocusPlant = () => {},
  settings = null,
  onUpdateSettings = null
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const isNight = clock?.isNight ?? false;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [plantMenuOpen, setPlantMenuOpen] = useState(false);
  const [clockMenuOpen, setClockMenuOpen] = useState(false);
  const [statsMenuOpen, setStatsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [manualRateInput, setManualRateInput] = useState('');

  const {
    currency,
    setCurrency,
    exchangeRate,
    setManualRate,
    resetToLiveRate,
    fetchLiveRate,
    isManualRate,
    loadingRate,
    formatMoney,
    formatCompactMoney,
    formatPricePerKwh
  } = useCurrency();

  const userMenuRef = useRef(null);
  const plantMenuRef = useRef(null);
  const clockMenuRef = useRef(null);
  const statsMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (plantMenuRef.current && !plantMenuRef.current.contains(event.target)) {
        setPlantMenuOpen(false);
      }
      if (clockMenuRef.current && !clockMenuRef.current.contains(event.target)) {
        setClockMenuOpen(false);
      }
      if (statsMenuRef.current && !statsMenuRef.current.contains(event.target)) {
        setStatsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setPlantMenuOpen(false);
        setClockMenuOpen(false);
        setStatsMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    if (userMenuOpen || plantMenuOpen || clockMenuOpen || statsMenuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen, plantMenuOpen, clockMenuOpen, statsMenuOpen, mobileMenuOpen]);

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
    { id: 'sites', label: dict.nav.sites, icon: Globe },
    { id: 'shop', label: dict.nav.shop, icon: ShoppingBag },
    { id: 'plants', label: dict.nav.plants, icon: Factory },
    { id: 'battery', label: dict.nav.battery, icon: BatteryCharging },
    { id: 'finance', label: dict.nav.finance, icon: Landmark }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/90 text-slate-100 px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 shadow-xl select-none">
      {/* Unified Single Navbar Row */}
      <div className="w-full max-w-[1760px] mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Brand Identity & Quick Plant Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <button
            type="button"
            onClick={onOpenLeaderboard}
            title={lang === 'tr' ? 'Liderlik Sıralaması & Şirket Profili' : 'Leaderboard & Company Profile'}
            className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0 p-1 sm:p-1.5 -ml-1 rounded-xl hover:bg-slate-900/90 border border-transparent hover:border-slate-800 transition-all cursor-pointer text-left group select-none"
          >
            <div className="relative shrink-0">
              <Image
                src="/logo.png"
                alt="Energy Tycoon"
                width={32}
                height={32}
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow shrink-0 group-hover:scale-105 transition-transform"
                priority
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow border border-amber-300">
                <Trophy className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent truncate max-w-[65px] xs:max-w-[95px] sm:max-w-[160px] group-hover:from-emerald-300 group-hover:to-cyan-300 flex items-center gap-1">
                <span>{company?.name || 'Energy Corp'}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
                <span className="flex items-center gap-0.5 text-amber-400 font-bold group-hover:text-amber-300">
                  <Award className="w-3 h-3" />
                  Lv.{currentLevel}
                </span>
                <span className="hidden sm:inline">•</span>
                <div className="hidden sm:inline-block w-12 sm:w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden align-middle">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${xpProgressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </button>

          {/* Quick Plant Selector Dropdown (User's Owned & Leased Facilities) */}
          <div className="relative shrink-0" ref={plantMenuRef}>
            <button
              type="button"
              onClick={() => {
                setPlantMenuOpen((prev) => !prev);
                setUserMenuOpen(false);
                setStatsMenuOpen(false);
                setClockMenuOpen(false);
                setMobileMenuOpen(false);
              }}
              className={`relative flex items-center justify-center gap-1 sm:gap-1.5 p-1 xs:px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all select-none cursor-pointer shrink-0 ${
                plantMenuOpen
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-500'
              }`}
              title={
                lang === 'tr'
                  ? `Santralime Git: ${selectedPlant?.plantName || 'Santrallerim'}`
                  : `Focus Plant: ${selectedPlant?.plantName || 'My Plants'}`
              }
              aria-expanded={plantMenuOpen}
            >
              <Factory className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              
              {/* Plant Name: Hidden on mobile (< md), prominently displayed on desktop/tablet */}
              <span className="hidden md:inline font-bold truncate max-w-[100px] lg:max-w-[160px]">
                {selectedPlant?.plantName || (lang === 'tr' ? 'Santrallerim' : 'My Plants')}
              </span>

              {/* Plant Count Badge */}
              {mySites.length > 0 && (
                <span className="text-[10px] bg-slate-800 text-cyan-300 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                  {mySites.length}
                </span>
              )}

              {/* Chevron Icon: Hidden on small screens */}
              <ChevronDown
                className={`hidden md:inline-block w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                  plantMenuOpen ? 'rotate-180 text-cyan-400' : ''
                }`}
              />
            </button>

            {/* Plant Dropdown Menu Panel */}
            {plantMenuOpen && (
              <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2 sm:w-80 rounded-2xl bg-slate-900/98 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200 max-h-[80vh] overflow-y-auto">
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
        </div>

        {/* Center: Web Navigation Tabs (DESKTOP / TABLET ONLY: lg:flex) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1 shadow-inner backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(isActive ? null : item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: All Controls & Stats Grouped in a Single Flex Row */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* Capacity, Net Worth & Spot Market Interactive Dropdown */}
          <div className="relative shrink-0" ref={statsMenuRef}>
            <button
              type="button"
              onClick={() => {
                setStatsMenuOpen((prev) => !prev);
                setUserMenuOpen(false);
                setPlantMenuOpen(false);
                setClockMenuOpen(false);
                setMobileMenuOpen(false);
              }}
              title={lang === 'tr' ? 'Kurulu Güç, Şirket Değeri & Spot Piyasası' : 'Capacity, Net Worth & Spot Market'}
              className={`flex items-center gap-1 p-1 xs:px-1.5 xs:py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold transition-all select-none cursor-pointer shrink-0 ${
                statsMenuOpen
                  ? 'bg-slate-800 text-white border-amber-500/60 shadow-sm ring-1 ring-amber-500/40'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              aria-expanded={statsMenuOpen}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <ChevronDown
                className={`hidden sm:inline-block w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                  statsMenuOpen ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {statsMenuOpen && (
              <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-80 bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">
                      {lang === 'tr' ? 'Şirket Güç & Piyasa Özeti' : 'Capacity & Market Overview'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                    {mySites.length} {lang === 'tr' ? 'Santral' : 'Plants'}
                  </span>
                </div>

                {/* 1. Kurulu Güç */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-medium">{dict.hud.totalCapacity}</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {(totalCapacityKw || 0).toLocaleString()} kW
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xl font-black text-white font-mono tracking-tight">
                      {(totalCapacityKw / 1000).toFixed(1)} <span className="text-xs font-semibold text-slate-400">MW</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {mySites.length > 0
                        ? `${mySites.length} ${lang === 'tr' ? 'aktif saha' : 'active sites'}`
                        : lang === 'tr' ? 'Tesis yok' : 'No plants'}
                    </span>
                  </div>
                </div>

                {/* 2. Şirket Değeri */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-medium">{dict.hud.netWorth}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {finance?.netWorth && finance.netWorth > 0 ? '+ Aktif' : 'Stabil'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                      {formatMoney(finance?.netWorth || 0, { decimals: 0 })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">{lang === 'tr' ? 'Nakit Kasa:' : 'Cash:'}</span>
                      <span className="text-slate-300 font-mono font-semibold">{formatMoney(company?.cash || 0, { decimals: 0 })}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{lang === 'tr' ? 'Tesis Varlıkları:' : 'Plant Assets:'}</span>
                      <span className="text-slate-300 font-mono font-semibold">{formatMoney(finance?.assetsBookValue || 0, { decimals: 0 })}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Spot Elektrik Piyasası (Clickable card that opens Market Modal) */}
                <button
                  type="button"
                  onClick={() => {
                    setStatsMenuOpen(false);
                    if (onOpenMarket) onOpenMarket();
                    else setActiveTab('market');
                  }}
                  title={lang === 'tr' ? 'Elektrik Piyasası & Spot Fiyat Grafiği için Tıklayın' : 'Click to view Electricity Market & Spot Chart'}
                  className="w-full bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/80 hover:border-emerald-500/50 p-2.5 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-slate-300">
                        {lang === 'tr' ? 'Spot Elektrik Piyasası' : 'Spot Market Price'}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                      {lang === 'tr' ? 'Canlı Pazar ↗' : 'Live Market ↗'}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xl font-black text-emerald-400 font-mono tracking-tight">
                      {formatPricePerKwh(spotPrice?.pricePerKwh)}
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-emerald-300 transition-colors">
                      {lang === 'tr' ? 'Piyasa Grafiği →' : 'Market Chart →'}
                    </span>
                  </div>
                </button>

                {/* Quick Action Navigation Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStatsMenuOpen(false);
                      if (onOpenTreasury) {
                        onOpenTreasury();
                      }
                    }}
                    className="py-1.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 border border-slate-700/80 hover:border-emerald-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    <Landmark className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'tr' ? 'Kasa Detayı' : 'Treasury'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatsMenuOpen(false);
                      if (onOpenMarket) onOpenMarket();
                      else setActiveTab('market');
                    }}
                    className="py-1.5 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 hover:border-cyan-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lang === 'tr' ? 'Piyasa & Spot' : 'Market'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Clock & Calendar Dropdown (Compact Time + Sun/Moon) */}
          <div className="relative shrink-0" ref={clockMenuRef}>
            <button
              type="button"
              onClick={() => {
                setClockMenuOpen((prev) => !prev);
                setUserMenuOpen(false);
                setPlantMenuOpen(false);
                setStatsMenuOpen(false);
                setMobileMenuOpen(false);
              }}
              className={`flex items-center gap-1 xs:gap-1.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-semibold transition-all select-none cursor-pointer shrink-0 ${
                clockMenuOpen
                  ? 'bg-slate-800 text-white border-blue-500/60 shadow-sm ring-1 ring-blue-500/40'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
              title={lang === 'tr' ? 'Tam Tarih ve Takvim Detayı için Tıklayın' : 'Click for Full Date & Calendar Details'}
              aria-expanded={clockMenuOpen}
            >
              <Clock className="hidden xs:inline-block w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
              <span className="font-mono text-cyan-300 font-bold text-[11px] sm:text-xs">{clock?.formattedHour || '12:00'}</span>
              <span className="shrink-0 flex items-center">
                {isNight ? (
                  <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                ) : (
                  <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                )}
              </span>
            </button>

            {/* Calendar Popover Dropdown */}
            {clockMenuOpen && (
              <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-full sm:mt-2 sm:w-72 rounded-2xl bg-slate-900/98 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-xs text-white">
                      {lang === 'tr' ? 'Oyun Takvimi' : 'Game Calendar'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                      isNight
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                        : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    }`}
                  >
                    {isNight ? (
                      <>
                        <Moon className="w-3 h-3 text-indigo-400" />
                        <span>{lang === 'tr' ? 'Gece' : 'Night'}</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>{lang === 'tr' ? 'Gündüz' : 'Day'}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Full Date Display */}
                <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-center mb-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                    {lang === 'tr' ? 'Aktif Simülasyon Tarihi' : 'Active Simulation Date'}
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {clock?.formattedDate || `Yıl ${clock?.year || 1}, Ay ${clock?.month || 1}, Gün ${clock?.day || 1}`}
                  </div>
                  <div className="text-xs font-mono text-cyan-300 font-bold mt-1">
                    {clock?.formattedHour || '12:00'}
                  </div>
                </div>

                {/* Season & Day stats */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2.5 font-mono">
                  <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">
                      {lang === 'tr' ? 'Mevsim' : 'Season'}
                    </span>
                    <strong className="text-emerald-400 text-[11px] capitalize">
                      {clock?.season === 'spring'
                        ? 'İlkbahar'
                        : clock?.season === 'summer'
                        ? 'Yaz'
                        : clock?.season === 'autumn'
                        ? 'Sonbahar'
                        : 'Kış'}
                    </strong>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-2 rounded-lg">
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">
                      {lang === 'tr' ? 'Toplam Saat' : 'Total Hour'}
                    </span>
                    <strong className="text-slate-200 text-[11px]">
                      #{clock?.gameHour || 0}
                    </strong>
                  </div>
                </div>

                {/* Speed note */}
                <div className="text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 flex items-center justify-between">
                  <span>{lang === 'tr' ? 'Zaman Hızı:' : 'Simulation Speed:'}</span>
                  <strong className="text-amber-400 font-mono font-bold">24x (1h = 1 gün)</strong>
                </div>
              </div>
            )}
          </div>

          {/* Cash Pill - Interactive Treasury Modal Trigger */}
          <button
            onClick={onOpenTreasury}
            type="button"
            title={dict.treasury?.viewDetails || 'Kasa Detayları için Tıklayın'}
            className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 hover:border-emerald-400 px-1.5 xs:px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-emerald-300 font-bold text-[11px] sm:text-xs transition-all shadow-sm active:scale-95 cursor-pointer font-mono shrink-0"
          >
            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
            <span className="sm:hidden">{formatCompactMoney(company?.cash || 0)}</span>
            <span className="hidden sm:inline">{formatMoney(company?.cash || 0, { decimals: 0 })}</span>
          </button>

          {/* Desktop Quick Audio Mute / Unmute Button */}
          {settings && onUpdateSettings && (
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({ ...settings, bgMusicEnabled: !settings.bgMusicEnabled });
              }}
              title={
                settings.bgMusicEnabled
                  ? (lang === 'tr' ? 'Müziği Kapat (Sessiz)' : 'Mute Background Music')
                  : (lang === 'tr' ? 'Müziği Aç (Firewatch / Minecraft)' : 'Unmute Background Music')
              }
              className={`hidden md:flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all select-none cursor-pointer shrink-0 ${
                settings.bgMusicEnabled
                  ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-700/80 hover:border-emerald-500/50'
                  : 'bg-slate-950 hover:bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
              }`}
            >
              {settings.bgMusicEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          )}

          {/* Compact Circular User Icon & Dropdown Menu */}
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setPlantMenuOpen(false);
                setClockMenuOpen(false);
                setStatsMenuOpen(false);
                setMobileMenuOpen(false);
              }}
              type="button"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all select-none cursor-pointer relative shrink-0 ${
                userMenuOpen
                  ? 'bg-slate-800 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-500'
              }`}
              title={lang === 'tr' ? 'Hesap & Menü' : 'Account & Menu'}
              aria-expanded={userMenuOpen}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            </button>

            {/* User Dropdown Panel */}
            {userMenuOpen && (
              <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-72 rounded-2xl bg-slate-900/98 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200 max-h-[85vh] overflow-y-auto">
                {/* User / Company Header */}
                <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1.5">
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
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 truncate max-w-[140px]">
                      {company?.name || 'Energy Corp'}
                    </span>
                  </div>

                  {/* Company Net Worth & Cash Overview Card */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-1.5">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-cyan-400" />
                        <span>{dict.hud.netWorth}</span>
                      </span>
                      <div className="font-mono font-bold text-white text-xs mt-0.5 truncate">
                        {formatMoney(finance?.netWorth || 0, { decimals: 0 })}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                        <span>Kasa Bakiyesi</span>
                      </span>
                      <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5 truncate">
                        {formatMoney(company?.cash || 0, { decimals: 0 })}
                      </div>
                    </div>
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

                {/* Currency Selector Section */}
                <div className="p-1.5 border-t border-slate-800/80">
                  <div className="px-1 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'tr' ? 'Para Birimi' : 'Currency'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {currency === 'TRY' ? '₺ TL' : '$ USD'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currency === 'USD'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>USD ($)</span>
                      {currency === 'USD' && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('TRY')}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currency === 'TRY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      <span>TRY (₺)</span>
                      {currency === 'TRY' && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  </div>

                  {/* Exchange Rate details and manual input if TRY is selected */}
                  {currency === 'TRY' && (
                    <div className="mt-2 p-2 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">1 USD =</span>
                          <span className="font-mono font-bold text-emerald-400">₺{Number(exchangeRate).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              isManualRate
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isManualRate ? (lang === 'tr' ? 'Manuel' : 'Manual') : (lang === 'tr' ? 'Canlı API' : 'Live API')}
                          </span>
                          <button
                            type="button"
                            onClick={fetchLiveRate}
                            disabled={loadingRate}
                            title={lang === 'tr' ? 'Canlı kuru güncelle' : 'Refresh live rate'}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${loadingRate ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Manual Rate Edit Row */}
                      {editingRate ? (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            value={manualRateInput}
                            onChange={(e) => setManualRateInput(e.target.value)}
                            placeholder="Örn: 49.50"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = parseFloat(manualRateInput);
                              if (!isNaN(val) && val > 0) {
                                setManualRate(val);
                                setEditingRate(false);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            {lang === 'tr' ? 'Kaydet' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRate(false)}
                            className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs shrink-0 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              setManualRateInput(String(exchangeRate));
                              setEditingRate(true);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{lang === 'tr' ? 'Özel Kur Gir' : 'Set Custom Rate'}</span>
                          </button>

                          {isManualRate && (
                            <button
                              type="button"
                              onClick={resetToLiveRate}
                              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>{lang === 'tr' ? 'Canlıya Dön' : 'Reset to Live'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Background Music Mute / Unmute & Volume */}
                {settings && onUpdateSettings && (
                  <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 rounded-xl my-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {settings.bgMusicEnabled !== false ? (
                          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{lang === 'tr' ? 'Müzik' : 'Music'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ ...settings, bgMusicEnabled: settings.bgMusicEnabled === false });
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          settings.bgMusicEnabled !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{settings.bgMusicEnabled !== false ? (lang === 'tr' ? 'Açık' : 'On') : (lang === 'tr' ? 'Kapalı' : 'Off')}</span>
                      </button>
                    </div>

                    {/* Volume Slider in Quick Menu */}
                    <div className="mt-2 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>{lang === 'tr' ? 'Ses Düzeyi' : 'Volume'}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          %{Math.round((typeof settings.bgMusicVolume === 'number' ? settings.bgMusicVolume : 0.65) * 100)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={typeof settings.bgMusicVolume === 'number' ? settings.bgMusicVolume : 0.65}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateSettings({
                            ...settings,
                            bgMusicVolume: val,
                            bgMusicEnabled: val > 0 ? true : settings.bgMusicEnabled
                          });
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                      />
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div className="my-1 border-t border-slate-800/80" />

                {/* Leaderboard & Profile Modal Link */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenLeaderboard?.();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'tr' ? 'Liderlik Sıralaması & Profil' : 'Leaderboard & Profile'}</span>
                </button>

                {/* Electricity Market Modal Link */}
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenMarket ? onOpenMarket() : setActiveTab('market');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'tr' ? 'Elektrik Piyasası & Spot Fiyatlar' : 'Electricity Market & Spot'}</span>
                </button>

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

          {/* Mobile Hamburger Navigation Menu Button (lg:hidden) */}
          <div className="relative shrink-0 lg:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen((prev) => !prev);
                setUserMenuOpen(false);
                setPlantMenuOpen(false);
                setStatsMenuOpen(false);
                setClockMenuOpen(false);
              }}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-all select-none cursor-pointer relative ${
                mobileMenuOpen
                  ? 'bg-slate-800 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-500'
              }`}
              title={lang === 'tr' ? 'Oyun Menüsü' : 'Game Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 text-emerald-400" />
              ) : (
                <Menu className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Mobile Navigation Dropdown Flyout */}
            {mobileMenuOpen && (
              <div className="max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-14 max-sm:w-auto sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-64 rounded-2xl bg-slate-900/98 border border-slate-800/90 shadow-2xl backdrop-blur-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-200 space-y-1 max-h-[85vh] overflow-y-auto">
                <div className="px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'tr' ? 'Yönetim Menüsü' : 'Management Menu'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                    5 Modül
                  </span>
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(isActive ? null : item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/40 hover:bg-slate-800 text-slate-300 hover:text-white border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      )}
                    </button>
                  );
                })}

                <div className="my-1 border-t border-slate-800/80" />

                {/* Quick link to Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(activeTab === 'settings' ? null : 'settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    activeTab === 'settings'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>{dict.nav.settings}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
