'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Cpu,
  TrendingUp,
  DollarSign,
  Wind,
  Sun,
  BatteryCharging,
  Zap,
  ShoppingBag,
  Factory,
  CheckCircle2,
  HardHat,
  Clock,
  Wrench,
  Globe,
  Sparkles,
  BarChart3,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';
import RevenueTrendChart from '@/components/ui/RevenueTrendChart';
import { useCurrency } from '@/context/CurrencyContext';
import { getMaxEquipmentCapacity } from '@/lib/simulation/asset-layout';
import { calculateEquipmentResaleValue } from '@/lib/simulation/finance';

export default function SiteDetailModal({
  site,
  companySite,
  company,
  siteAssets = [],
  clock = {},
  lang = 'tr',
  isGuestMode = false,
  onClose,
  onNavigateToShop,
  onOpenPlants,
  onOpenSites,
  onOpenTreasury,
  onActionSuccess
}) {
  const { formatMoney } = useCurrency();
  const [activeTab, setActiveTab] = useState('equipment'); // 'equipment' | 'finance'
  const [maintenanceLoadingId, setMaintenanceLoadingId] = useState(null);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [sellingAsset, setSellingAsset] = useState(null);
  const [sellLoading, setSellLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [plantFinancials, setPlantFinancials] = useState(null);

  // Capacity limit & fullness calculations
  const primaryEquipType =
    site?.region_type === 'solar'
      ? 'solar_pack'
      : site?.region_type === 'wind'
        ? 'wind_turbine'
        : 'wind_turbine';

  const maxCapacityUnits = getMaxEquipmentCapacity(site?.area_hectares, primaryEquipType);
  const currentUnitsCount = siteAssets.length;
  const isFull = currentUnitsCount >= maxCapacityUnits;
  const remainingSlots = Math.max(0, maxCapacityUnits - currentUnitsCount);
  const fullnessPercent = Math.min(100, Math.round((currentUnitsCount / maxCapacityUnits) * 100));

  // Average asset health & operational count
  const avgHealth = siteAssets.length > 0
    ? Math.round(siteAssets.reduce((sum, a) => sum + Number(a.condition || 100), 0) / siteAssets.length)
    : 100;

  // Compute total capacity
  const siteTotalCapacityKw = siteAssets.reduce((sum, a) => {
    if (a.equipment_catalog?.equipment_type !== 'battery') {
      return sum + Number(a.equipment_catalog?.capacity_kw || 0);
    }
    return sum;
  }, 0);

  // Under construction count
  const underConstructionCount = siteAssets.filter((a) => {
    const isConstructionType = ['wind_turbine', 'solar_pack'].includes(a.equipment_catalog?.equipment_type);
    const elapsedHours = Math.max(0, (Number(clock?.gameHour) || 0) - Number(a.installed_game_hour || 0));
    return isConstructionType && elapsedHours < 168;
  }).length;

  // Handle Equipment Maintenance
  const handleMaintenance = async (assetId) => {
    setMaintenanceLoadingId(assetId);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SERVICE_MAINTENANCE',
          payload: { assetId }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bakım işlemi başarısız.');

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setMaintenanceLoadingId(null);
    }
  };

  // Handle Solar Tracker Upgrade
  const handleUpgradeTracker = async () => {
    if (!companySite) return;
    setTrackerLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPGRADE_SOLAR_TRACKER',
          payload: { companySiteId: companySite.id }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tracker kurulumu başarısız.');

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setTrackerLoading(false);
    }
  };

  // Handle Sell / Dismantle Equipment
  const handleConfirmSell = async () => {
    if (!sellingAsset) return;
    setSellLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SELL_EQUIPMENT',
          payload: { assetId: sellingAsset.id }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ekipman satışı başarısız oldu.');

      setFeedback({ type: 'success', text: data.message });
      setSellingAsset(null);
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSellLoading(false);
    }
  };

  // Callback when RevenueTrendChart loads site data
  const handleChartDataLoaded = (data) => {
    if (data?.siteFinancials) {
      setPlantFinancials(data.siteFinancials);
    }
  };

  const isSolarOrHybrid = site?.region_type === 'solar' || site?.region_type === 'hybrid';
  const plantTitle = companySite?.plant_name || site?.name || `Santral #${site?.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 modal-backdrop-safe"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => {
        e.stopPropagation();
        if (e.ctrlKey) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-100 backdrop-blur-xl animate-in zoom-in-95 duration-150 modal-content-safe"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation();
          if (e.ctrlKey) e.preventDefault();
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          title={lang === 'tr' ? 'Kapat (ESC)' : 'Close (ESC)'}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* MODAL HEADER: Plant Name & Badges */}
        <div className="pr-10 mb-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
              #{site.id}
            </span>
            <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
              {plantTitle}
            </h3>

            {/* Region Type Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                site.region_type === 'wind'
                  ? 'text-sky-300 bg-sky-950/70 border-sky-600/50'
                  : site.region_type === 'solar'
                    ? 'text-amber-300 bg-amber-950/70 border-amber-600/50'
                    : 'text-purple-300 bg-purple-950/70 border-purple-600/50'
              }`}
            >
              {site.region_type === 'wind' && <Wind className="w-3 h-3 text-sky-400" />}
              {site.region_type === 'solar' && <Sun className="w-3 h-3 text-amber-400" />}
              {site.region_type === 'hybrid' && (
                <span className="flex items-center -space-x-1">
                  <Wind className="w-3 h-3 text-sky-400" />
                  <Sun className="w-3 h-3 text-amber-400" />
                </span>
              )}
              <span>
                {site.region_type === 'wind' ? 'Rüzgâr' : site.region_type === 'solar' ? 'Güneş' : 'Hibrit'}
              </span>
            </span>

            {/* Ownership Badge */}
            {companySite ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3" />
                <span>{companySite.tenure_type === 'own' ? 'Tapulu Mülk' : 'Kiralık Saha'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                <span>Boş Saha</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            {site.name} ({lang === 'tr' ? site.description_tr : site.description_en})
          </p>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs mb-3 shrink-0">
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Rüzgâr</span>
            <strong className="text-sky-400 font-mono text-xs sm:text-sm">
              %{(Number(site.base_wind_potential) * 100).toFixed(0)}
            </strong>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Güneş</span>
            <strong className="text-amber-400 font-mono text-xs sm:text-sm">
              %{(Number(site.base_solar_potential) * 100).toFixed(0)}
            </strong>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Alan</span>
            <strong className="text-slate-200 font-mono text-xs sm:text-sm">
              {site.area_hectares} Ha
            </strong>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
            <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Kapasite</span>
            <strong className="text-emerald-400 font-mono text-xs sm:text-sm">
              {siteTotalCapacityKw >= 1000
                ? `${(siteTotalCapacityKw / 1000).toFixed(1)} MW`
                : `${siteTotalCapacityKw} kW`}
            </strong>
          </div>
        </div>

        {/* SITE CAPACITY & FULLNESS CARD */}
        <div className="bg-slate-950/80 p-2.5 sm:p-3 rounded-2xl border border-slate-800/90 mb-3 shadow-inner shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-xs font-bold text-slate-200 truncate">Arazi Kurulum Doluluğu</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs sm:text-sm font-black text-white">
                <strong className={isFull ? 'text-amber-400' : 'text-emerald-400'}>{currentUnitsCount}</strong>
                <span className="text-slate-500 font-normal"> / {maxCapacityUnits} Ünite</span>
              </span>
              {isFull ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Kapasite Dolu
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {remainingSlots} Boş Slot
                </span>
              )}
            </div>
          </div>

          {/* Fullness Bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-1.5 border border-slate-800/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFull
                  ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300'
                  : fullnessPercent > 75
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.max(3, fullnessPercent)}%` }}
            />
          </div>

          {/* Sub-info Line */}
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate">
              {primaryEquipType === 'wind_turbine' ? 'Türbin Limiti' : 'GES Paketi Limiti'}: <strong>{maxCapacityUnits} adet</strong> ({site.area_hectares} Ha zemin)
            </span>
            <span className="shrink-0 flex items-center gap-1.5">
              <span>Sağlık:</span>
              <strong className={avgHealth > 80 ? 'text-emerald-400' : avgHealth > 50 ? 'text-amber-400' : 'text-rose-400'}>
                %{avgHealth}
              </strong>
              <span className="text-slate-600">•</span>
              <span>{currentUnitsCount - underConstructionCount} Devrede{underConstructionCount > 0 ? `, ${underConstructionCount} Kurulumda` : ''}</span>
            </span>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedback && (
          <div
            className={`mb-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="flex-1">{feedback.text}</span>
          </div>
        )}

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 min-w-0 py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'equipment'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'equipment' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="truncate">Ekipmanlar ({siteAssets.length})</span>
            {underConstructionCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`flex-1 min-w-0 py-1.5 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
            }`}
          >
            <TrendingUp className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'finance' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="truncate">
              <span className="hidden sm:inline">Gelir & Gider (Finans)</span>
              <span className="sm:hidden inline">Finans</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0 hidden xs:inline">
              1W - 1Y
            </span>
          </button>
        </div>

        {/* TAB BODY */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {activeTab === 'equipment' ? (
            /* ============================================================ */
            /* TAB 1: EQUIPMENT / INSTALLED DEVICES LIST                    */
            /* ============================================================ */
            <div className="space-y-3">
              {/* Solar Tracker Module (if applicable) */}
              {isSolarOrHybrid && companySite && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/20 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Akıllı Güneş Takip Sistemi</span>
                        {companySite.has_solar_tracker ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Aktif (+%25)
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            Kurulabilir
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {companySite.has_solar_tracker
                          ? 'Paneller güneşi dinamik izliyor, günlük üretim %25 artırıldı.'
                          : 'Gün boyu güneşi takip ederek üretim verimini %25 artırır.'}
                      </p>
                    </div>
                  </div>

                  {!companySite.has_solar_tracker && (
                    <button
                      onClick={handleUpgradeTracker}
                      disabled={trackerLoading || Number(company?.cash || 0) < 28000}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-[11px] transition-all whitespace-nowrap disabled:opacity-50 shadow-sm"
                    >
                      {trackerLoading ? '...' : `Kur (${formatMoney(28000, { decimals: 0 })})`}
                    </button>
                  )}
                </div>
              )}

              {/* Sub-header with Quick Add Equipment */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kurulu Üniteler ({currentUnitsCount}/{maxCapacityUnits})</span>
                  {isFull && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30 font-sans normal-case">
                      Saha Dolu
                    </span>
                  )}
                </span>

                {companySite && !isGuestMode && (
                  <button
                    onClick={() => {
                      if (site.region_type === 'solar') onNavigateToShop(companySite.id, 'solar_pack');
                      else if (site.region_type === 'wind') onNavigateToShop(companySite.id, 'wind_turbine');
                      else onNavigateToShop(companySite.id, null);
                      onClose();
                    }}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer border ${
                      isFull
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{isFull ? 'Mağaza (Saha Dolu)' : 'Ekipman Ekle (Mağaza)'}</span>
                  </button>
                )}
              </div>

              {/* Installed Units List */}
              {siteAssets.length > 0 ? (
                siteAssets.map((asset) => {
                  const catalog = asset.equipment_catalog || {};
                  const isConstructionType = ['wind_turbine', 'solar_pack'].includes(catalog.equipment_type);
                  const currentHour = Number(clock?.gameHour) || 0;
                  const installedHour = Number(asset.installed_game_hour) || 0;
                  const elapsedHours = Math.max(0, currentHour - installedHour);
                  const isUnderConstruction = isConstructionType && elapsedHours < 168;
                  const progress = Math.min(1.0, Math.max(0.0, elapsedHours / 168));
                  const progressPct = Math.min(100, Math.max(0, Math.round(progress * 100)));
                  const remainingHours = Math.max(0, 168 - elapsedHours);
                  const remainingDays = Math.floor(remainingHours / 24);
                  const remHoursInDay = remainingHours % 24;

                  let phaseDescription = '';
                  if (catalog.equipment_type === 'wind_turbine') {
                    if (progress < 0.28) phaseDescription = 'Aşama 1/4: Temel & Ankraj';
                    else if (progress < 0.58) phaseDescription = 'Aşama 2/4: Alt Kule Gövdesi';
                    else if (progress < 0.88) phaseDescription = 'Aşama 3/4: Rotor & Kanat Kaldırma';
                    else phaseDescription = 'Aşama 4/4: Test & Devreye Alma';
                  } else if (catalog.equipment_type === 'solar_pack') {
                    if (progress < 0.28) phaseDescription = 'Aşama 1/4: Zemin & Kazıklar';
                    else if (progress < 0.58) phaseDescription = 'Aşama 2/4: Taşıyıcı Konstrüksiyon';
                    else if (progress < 0.88) phaseDescription = 'Aşama 3/4: PV Panel & Kablolama';
                    else phaseDescription = 'Aşama 4/4: İnverter & Şebeke';
                  }

                  const condition = Number(asset.condition || 100);

                  return (
                    <div
                      key={asset.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isUnderConstruction
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              catalog.equipment_type === 'wind_turbine'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : catalog.equipment_type === 'solar_pack'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {catalog.equipment_type === 'wind_turbine' && <Wind className="w-4 h-4" />}
                            {catalog.equipment_type === 'solar_pack' && <Sun className="w-4 h-4" />}
                            {catalog.equipment_type === 'battery' && <BatteryCharging className="w-4 h-4" />}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs sm:text-sm text-white leading-tight">
                              {catalog.model_name || 'Ekipman'}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Kapasite: <strong className="text-emerald-400 font-mono">{catalog.capacity_kw?.toLocaleString()} kW</strong>
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isUnderConstruction ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            <HardHat className="w-3 h-3 text-amber-400" />
                            <span>Kurulumda</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                            <span>Devrede</span>
                          </span>
                        )}
                      </div>

                      {/* Progress bar or Health indicator */}
                      {isUnderConstruction ? (
                        <div className="mt-2 bg-slate-900/90 p-2 rounded-xl border border-amber-500/20">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-amber-300/90 font-medium">{phaseDescription}</span>
                            <span className="text-amber-200 font-mono font-bold">%{progressPct}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 text-amber-300/80">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>
                                Kalan: <strong>{remainingDays > 0 ? `${remainingDays}g ${remHoursInDay}s` : `${remainingHours}s`}</strong>
                              </span>
                            </span>
                            <span className="text-amber-400/80 text-[10px] italic">İnşaat aşamasında satılamaz</span>
                          </div>
                        </div>
                      ) : (() => {
                        const resale = calculateEquipmentResaleValue(catalog, asset, clock?.gameHour);
                        return (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-col gap-2">
                            {/* Health & Maintenance Row */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 font-semibold">Sağlık:</span>
                                <div className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      condition > 75 ? 'bg-emerald-500' : condition > 45 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${condition}%` }}
                                  />
                                </div>
                                <span className="font-mono text-slate-300">%{condition.toFixed(0)}</span>
                              </div>

                              {condition < 95 && !isGuestMode && (
                                <button
                                  disabled={maintenanceLoadingId === asset.id || Number(company?.cash || 0) < 5000}
                                  onClick={() => handleMaintenance(asset.id)}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                >
                                  <Wrench className="w-3 h-3" />
                                  <span>Bakım ({formatMoney(5000, { decimals: 0 })})</span>
                                </button>
                              )}
                            </div>

                            {/* Lifespan & Second-Hand Resale / Dismantle Row */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40 text-[10px]">
                              <div className="flex items-center gap-1 text-slate-400">
                                <span className="text-slate-500 font-semibold">Ömür:</span>
                                <span className="text-slate-300 font-mono">
                                  {resale.ageYears} / {resale.lifespanYears} Yıl
                                </span>
                                <span className="text-slate-500 text-[9px] hidden sm:inline">
                                  (%{resale.consumedLifespanPct} tüketildi)
                                </span>
                              </div>

                              {!isGuestMode && (
                                <button
                                  type="button"
                                  onClick={() => setSellingAsset(asset)}
                                  className="px-2 py-0.8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="İkinci el piyasasında sat ve sahadan sök"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Sat (+{formatMoney(resale.resalePriceUsd, { decimals: 0 })})</span>
                                  <span className="text-[9px] px-1 py-0.2 bg-rose-500/20 rounded font-mono text-rose-200">
                                    %{resale.resalePct}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })
              ) : companySite ? (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-5 text-center">
                  <HardHat className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-70" />
                  <p className="text-xs text-slate-300 font-bold mb-1">Henüz Kurulu Ekipman Yok</p>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Bu santral sahasına rüzgar türbini veya güneş paneli kurarak elektrik üretmeye başlayabilirsiniz.
                  </p>
                  <button
                    onClick={() => {
                      if (site.region_type === 'solar') onNavigateToShop(companySite.id, 'solar_pack');
                      else if (site.region_type === 'wind') onNavigateToShop(companySite.id, 'wind_turbine');
                      else onNavigateToShop(companySite.id, null);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Ekipman Mağazası'nı Aç</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-5 text-center">
                  <Globe className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-70" />
                  <p className="text-xs text-slate-300 font-bold mb-1">Saha Portföyünüzde Değil</p>
                  <p className="text-[11px] text-slate-400">
                    Santral kurabilmek için önce bu araziyi kiralamanız veya satın almanız gerekmektedir.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* ============================================================ */
            /* TAB 2: INCOME & EXPENSES (GELİR & GİDER)                     */
            /* ============================================================ */
            <div className="space-y-3">
              {/* Plant Lifetime Financial Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {/* 1. Toplam Satış Geliri */}
                <div className="bg-slate-950/80 border border-emerald-500/30 p-2.5 rounded-xl shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold mb-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>Toplam Gelir</span>
                  </div>
                  <strong className="text-sm sm:text-base font-black text-emerald-300 font-mono">
                    {formatMoney(plantFinancials?.totalRevenue || 0, { decimals: 0 })}
                  </strong>
                </div>

                {/* 2. İşletme & Bakım Gideri */}
                <div className="bg-slate-950/80 border border-rose-500/30 p-2.5 rounded-xl shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-bold mb-0.5">
                    <Wrench className="w-3 h-3" />
                    <span>Toplam Gider</span>
                  </div>
                  <strong className="text-sm sm:text-base font-black text-rose-300 font-mono">
                    {formatMoney(plantFinancials?.totalExpenses || 0, { decimals: 0 })}
                  </strong>
                </div>

                {/* 3. Net Kâr */}
                <div className="bg-slate-950/80 border border-cyan-500/30 p-2.5 rounded-xl shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-400 font-bold mb-0.5">
                    <DollarSign className="w-3 h-3" />
                    <span>Net Getiri</span>
                  </div>
                  <strong className="text-sm sm:text-base font-black text-cyan-300 font-mono">
                    {formatMoney(plantFinancials?.netProfit || 0, { decimals: 0 })}
                  </strong>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    Kâr: %{plantFinancials?.profitMarginPct || 100}
                  </span>
                </div>

                {/* 4. Toplam Üretim / Satış */}
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-bold mb-0.5">
                    <Zap className="w-3 h-3" />
                    <span>Üretim Miktarı</span>
                  </div>
                  <strong className="text-sm sm:text-base font-black text-amber-300 font-mono">
                    {plantFinancials?.totalKwh >= 1000000
                      ? `${(plantFinancials.totalKwh / 1000000).toFixed(2)} GWh`
                      : plantFinancials?.totalKwh >= 1000
                        ? `${(plantFinancials.totalKwh / 1000).toFixed(1)} MWh`
                        : `${plantFinancials?.totalKwh || 0} kWh`}
                  </strong>
                  <span className="text-[9px] text-slate-400 block font-mono">
                    Ort: ${plantFinancials?.avgPricePerKwh || '0.125'}/kWh
                  </span>
                </div>
              </div>

              {/* Anlık Canlı Saatlik Getiri Bilgi Şeridi */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400 font-medium">Anlık Şebeke Satışı:</span>
                  <span className="font-mono font-bold text-white">
                    {plantFinancials?.latestHourlyKwh
                      ? `${(plantFinancials.latestHourlyKwh / 1000).toFixed(2)} MWh/saat`
                      : `${(siteTotalCapacityKw * 0.45 / 1000).toFixed(2)} MWh/saat (Tahmini)`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                  <span>
                    +{formatMoney(
                      plantFinancials?.latestHourlyRevenue || siteTotalCapacityKw * 0.45 * 0.125,
                      { decimals: 2 }
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">/ saat</span>
                </div>
              </div>

              {/* SANTRAL BAZLI GELİR GRAFİĞİ (1W, 1M, 3M, 6M, 1Y) */}
              <div className="pt-1">
                <RevenueTrendChart
                  companyId={company?.id}
                  companySiteId={companySite?.id}
                  title={`${plantTitle} • Günlük Gelir`}
                  lang={lang}
                  onDataLoaded={handleChartDataLoaded}
                  onOpenTreasury={() => {
                    onClose();
                    if (onOpenTreasury) onOpenTreasury();
                  }}
                />
              </div>

              {/* Link to Open Cash Flow / Treasury Modal */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>Tüm şirket para hareketlerini ve elektrik faturalarını inceleyin:</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenTreasury) onOpenTreasury();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Kasa Hareketleri'ni Aç</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex gap-2 shrink-0">
          {isGuestMode ? (
            <Link
              href="/register"
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 text-center flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bu Sahada Santral Kurmak İçin Kaydol ($100k Hibe)</span>
            </Link>
          ) : companySite ? (
            <>
              <button
                onClick={() => {
                  if (site.region_type === 'solar') onNavigateToShop(companySite.id, 'solar_pack');
                  else if (site.region_type === 'wind') onNavigateToShop(companySite.id, 'wind_turbine');
                  else onNavigateToShop(companySite.id, null);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ekipman Ekle (Mağaza)</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenPlants) onOpenPlants();
                }}
                className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Factory className="w-3.5 h-3.5 text-slate-400" />
                <span>Santrallerim</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onOpenSites) onOpenSites();
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Bu Sahayı Kirala veya Satın Al</span>
            </button>
          )}
        </div>
      </div>

      {/* Second-Hand Sale / Dismantle Confirmation Dialog */}
      {sellingAsset && (() => {
        const sellCatalog = sellingAsset.equipment_catalog || {};
        const currentHour = Number(clock?.gameHour) || 0;
        const sellResale = calculateEquipmentResaleValue(sellCatalog, sellingAsset, currentHour);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative text-slate-100 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base sm:text-lg text-white">Ekipmanı Sat & Sök</h4>
                    <p className="text-xs text-slate-400">İkinci El Değerleme & Sahadan Kaldırma</p>
                  </div>
                </div>
                <button
                  onClick={() => setSellingAsset(null)}
                  disabled={sellLoading}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Model & Basic Specs */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{sellCatalog.model_name || 'Ekipman'}</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {sellCatalog.capacity_kw?.toLocaleString()} kW
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px] pt-2.5 border-t border-slate-800/60">
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">Sıfır Liste Fiyatı</span>
                    <span className="font-mono text-slate-300 font-bold">
                      {formatMoney(sellResale.costUsd, { decimals: 0 })}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">Fiziki Sağlık</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      %{sellResale.conditionPct}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">Kullanım / Ömür</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {sellResale.ageYears} / {sellResale.lifespanYears} Yıl
                    </span>
                    <span className="text-slate-500 text-[9px] block">
                      (%{sellResale.consumedLifespanPct} tüketildi)
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/40">
                    <span className="text-slate-400 block text-[10px]">İkinci El Değer Oranı</span>
                    <span className="font-mono text-cyan-300 font-bold text-xs">
                      %{sellResale.resalePct}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payout Summary Box */}
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-300 font-bold block">Kasaya Eklenecek Tutar</span>
                  <span className="text-[10px] text-slate-400">1 adet santral slotu anında boşalacaktır</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    +{formatMoney(sellResale.resalePriceUsd, { decimals: 0 })}
                  </span>
                </div>
              </div>

              {/* Info Note */}
              <div className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Bu ünite sahadan kalıcı olarak kaldırılacak ve kasaya nakit girişi sağlanacaktır. Açılan alana mağazadan yeni veya daha yüksek kapasiteli ekipmanlar kurabilirsiniz.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSellingAsset(null)}
                  disabled={sellLoading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSell}
                  disabled={sellLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-rose-900/40 cursor-pointer"
                >
                  {sellLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {sellLoading ? 'Sökülüyor...' : `Onayla ve Sat (+${formatMoney(sellResale.resalePriceUsd, { decimals: 0 })})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
