'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Zap,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Wind,
  Sun,
  Scale,
  Calendar,
  Layers,
  ShoppingBag,
  Landmark,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

export default function TreasuryModal({ isOpen, onClose, company, finance, lang = 'tr' }) {
  const dict = dictionaries[lang]?.treasury || dictionaries.tr.treasury;
  const { formatMoney, formatPricePerKwh, symbol } = useCurrency();
  const [activeRange, setActiveRange] = useState('today'); // 'today' | 'yesterday' | 'week' | 'all'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTreasuryData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await fetch('/api/game/treasury');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to fetch treasury data');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Treasury fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTreasuryData();
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStats = data?.ranges?.[activeRange] || {
    totalGenKwh: 0,
    windKwh: 0,
    solarKwh: 0,
    totalSoldKwh: 0,
    grossRevenue: 0,
    marketFees: 0,
    netRevenue: 0,
    avgPricePerKwh: 0,
    totalInflows: 0,
    totalOutflows: 0,
    netCashFlow: 0,
    breakdown: {},
    hourlySeries: []
  };

  const currentCash = Number(data?.currentCash ?? company?.cash ?? 0);

  // Filter ledger entries for current active range
  const filteredLedger = (data?.ledgerEntries || []).filter((item) => {
    const gh = Number(item.gameHour || 0);
    return gh >= currentStats.startHour && gh <= currentStats.endHour;
  });

  const formatTxTime = (tx) => {
    if (tx.day != null && tx.hour != null) {
      return lang === 'tr' ? `Gün ${tx.day}, ${tx.hour}` : `Day ${tx.day}, ${tx.hour}`;
    }
    if (tx.formattedTime) {
      return tx.formattedTime
        .replace(/^Yıl\s+\d+,\s*Ay\s+\d+,\s*/i, '')
        .replace(/^Year\s+\d+,\s*Month\s+\d+,\s*/i, '');
    }
    return '';
  };

  const getShortDescription = (tx) => {
    if (!tx) return '';
    const desc = tx.description || '';
    const type = tx.entryType || tx.entry_type;
    const meta = tx.metadata || {};

    if (type === 'electricity_sales') {
      if (meta.kwh_sold != null) {
        const kwh = Number(meta.kwh_sold);
        const mwh = (kwh / 1000).toFixed(kwh >= 10000 ? 1 : 2);
        const price = meta.price_per_kwh != null ? Number(meta.price_per_kwh).toFixed(3) : null;
        return lang === 'tr'
          ? `${mwh} MWh Spot Satış${price ? ` ($${price})` : ''}`
          : `${mwh} MWh Spot Sale${price ? ` ($${price})` : ''}`;
      }
      const match = desc.match(/(\d+(?:\.\d+)?)\s*kWh.*?\$([0-9.]+)/i);
      if (match) {
        const kwh = parseFloat(match[1]);
        const mwh = (kwh / 1000).toFixed(kwh >= 10000 ? 1 : 2);
        const price = parseFloat(match[2]).toFixed(3);
        return lang === 'tr'
          ? `${mwh} MWh Spot Satış ($${price})`
          : `${mwh} MWh Spot Sale ($${price})`;
      }
      return lang === 'tr' ? 'Elektrik Spot Satışı' : 'Spot Energy Sale';
    }

    if (type === 'equipment_purchase') {
      const matchMulti = desc.match(/^(\d+)\s+Adet\s+(.+?)\s+Satın Alındı ve\s+(.+?)(?:\s+Santrali)?\s+Santraline Kuruldu/i);
      if (matchMulti) {
        return `${matchMulti[1]}x ${matchMulti[2].trim()} (${matchMulti[3].replace(/\s+Santrali$/i, '').trim()})`;
      }
      const matchSingle = desc.match(/^(.+?)\s+Satın Alındı ve\s+(.+?)(?:\s+Santrali)?\s+Santraline Kuruldu/i);
      if (matchSingle) {
        return `${matchSingle[1].trim()} (${matchSingle[2].replace(/\s+Santrali$/i, '').trim()})`;
      }
    }

    if (type === 'site_lease') {
      const match = desc.match(/^(.+?)\s+sahası\s+(\d+)\s+oyun yıllığına kiralandı/i);
      if (match) {
        return lang === 'tr'
          ? `${match[1].trim()} (${match[2]} Yıl Kira)`
          : `${match[1].trim()} (${match[2]}y Lease)`;
      }
    }

    if (type === 'site_purchase') {
      const match = desc.match(/^(.+?)\s+arazisinin tapusu satın alındı/i);
      if (match) {
        return lang === 'tr'
          ? `${match[1].trim()} Tapu Alımı`
          : `${match[1].trim()} Deed Purchase`;
      }
    }

    if (type === 'daily_bonus') {
      const match = desc.match(/Günlük Giriş Bonusu\s*\(([^)]+)\)/i);
      if (match) {
        return lang === 'tr' ? `Giriş Bonusu (${match[1]})` : `Daily Bonus (${match[1]})`;
      }
    }

    if (type === 'loan_disbursement') {
      const match = desc.match(/(\d+)\s+Yıl Vade/i);
      return lang === 'tr'
        ? (match ? `Yatırım Kredisi (${match[1]} Yıl)` : 'Yatırım Kredisi')
        : (match ? `Investment Loan (${match[1]}y)` : 'Investment Loan');
    }

    if (type === 'loan_repayment') {
      return lang === 'tr' ? 'Kredi Taksit Ödemesi' : 'Loan Payment';
    }

    if (type === 'initial_grant') {
      return lang === 'tr' ? 'Devlet Hibe Desteği' : 'Government Grant';
    }

    if (type === 'grid_settlement_correction') {
      return lang === 'tr' ? 'Şebeke Kısıtı Telafisi' : 'Grid Constraint Refund';
    }

    if (type === 'infrastructure_upgrade' || type === 'upgrade_solar_tracker') {
      const match = desc.match(/Kuruldu:\s*(.+)$/i);
      const site = match ? ` (${match[1].replace(/\s+Santrali$/i, '').trim()})` : '';
      return `Solar Tracker${site}`;
    }

    if (type === 'maintenance_service') {
      return lang === 'tr' ? 'Ekipman Bakımı' : 'Maintenance';
    }

    if (desc.length > 40) {
      return desc.slice(0, 38) + '…';
    }

    return desc;
  };

  const getEntryBadge = (type) => {
    switch (type) {
      case 'electricity_sales':
        return {
          label: lang === 'tr' ? 'Elektrik Satışı' : 'Power Sale',
          bg: 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
        };
      case 'equipment_purchase':
        return {
          label: lang === 'tr' ? 'Ekipman Alımı' : 'Equipment',
          bg: 'bg-rose-950/70 text-rose-400 border-rose-800'
        };
      case 'site_lease':
        return {
          label: lang === 'tr' ? 'Arazi Kirası' : 'Land Lease',
          bg: 'bg-amber-950/70 text-amber-400 border-amber-800'
        };
      case 'site_purchase':
        return {
          label: lang === 'tr' ? 'Arazi Tapusu' : 'Land Deed',
          bg: 'bg-cyan-950/70 text-cyan-400 border-cyan-800'
        };
      case 'infrastructure_upgrade':
      case 'upgrade_solar_tracker':
        return {
          label: lang === 'tr' ? 'Güneş Takipçi' : 'Solar Tracker',
          bg: 'bg-blue-950/70 text-blue-400 border-blue-800'
        };
      case 'maintenance_service':
        return {
          label: lang === 'tr' ? 'Bakım Servisi' : 'Maintenance',
          bg: 'bg-orange-950/70 text-orange-400 border-orange-800'
        };
      case 'loan_disbursement':
        return {
          label: lang === 'tr' ? 'Kredi Girişi' : 'Loan Inflow',
          bg: 'bg-indigo-950/70 text-indigo-400 border-indigo-800'
        };
      case 'loan_repayment':
        return {
          label: lang === 'tr' ? 'Kredi Taksiti' : 'Loan Payment',
          bg: 'bg-purple-950/70 text-purple-400 border-purple-800'
        };
      case 'initial_grant':
        return {
          label: lang === 'tr' ? 'Devlet Hibesi' : 'Initial Grant',
          bg: 'bg-teal-950/70 text-teal-400 border-teal-800'
        };
      case 'daily_bonus':
        return {
          label: lang === 'tr' ? 'Günlük Bonus' : 'Daily Bonus',
          bg: 'bg-yellow-950/70 text-yellow-400 border-yellow-800'
        };
      case 'grid_settlement_correction':
        return {
          label: lang === 'tr' ? 'Şebeke Düzeltme' : 'Grid Correction',
          bg: 'bg-emerald-950/70 text-emerald-300 border-emerald-700'
        };
      default:
        return {
          label: type,
          bg: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  const ranges = [
    { id: 'today', label: dict.rangeToday },
    { id: 'yesterday', label: dict.rangeYesterday },
    { id: 'week', label: dict.rangeWeek },
    { id: 'all', label: dict.rangeAll }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* MODAL HEADER */}
        <div className="p-3 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-2.5 sm:gap-4 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black text-white flex items-center gap-1.5 flex-wrap leading-tight">
                <span>{dict.title}</span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 shrink-0">
                  Canlı Finans
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-400 truncate mt-0.5">{dict.subtitle}</p>
              <div className="sm:hidden flex items-center gap-2 text-xs font-mono font-bold mt-0.5 leading-none">
                <span className="text-emerald-400">{formatMoney(currentCash)}</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300">Değer: {formatMoney(finance?.netWorth || 0, { decimals: 0 })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Cash Badge & Net Worth Badge (Desktop) */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                  {dict.currentCash}
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight">
                  {formatMoney(currentCash)}
                </span>
              </div>

              <div className="w-[1px] h-7 bg-slate-800" />

              <div className="flex flex-col text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3 text-cyan-400" />
                  <span>Şirket Değeri</span>
                </span>
                <span className="text-base sm:text-lg font-black text-cyan-300 font-mono tracking-tight">
                  {formatMoney(finance?.netWorth || 0, { decimals: 0 })}
                </span>
              </div>
            </div>

            <button
              onClick={() => fetchTreasuryData(true)}
              disabled={refreshing}
              title="Yenile"
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* TIME RANGE SELECTOR TABS */}
        <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-950/20 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 mr-0.5 sm:mr-1 shrink-0" />
            {ranges.map((r) => {
              const active = activeRange === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRange(r.id)}
                  className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-emerald-500 text-slate-950 shadow-md ring-1 ring-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden md:block">
            Aralık: Saat {currentStats.startHour} — {currentStats.endHour} (
            {currentStats.endHour - currentStats.startHour + 1} Oyun Saati)
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Kasa Hareketleri ve Elektrik Verileri Yükleniyor...
              </span>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-2xl text-center text-red-300">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-red-400" />
              <p className="font-bold text-sm">{error}</p>
              <button
                onClick={() => fetchTreasuryData(false)}
                className="mt-3 px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold"
              >
                Tekrar Dene
              </button>
            </div>
          ) : (
            <>
              {/* 4 CORE KPI SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Generated Electricity */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">{dict.generatedEnergy}</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white font-mono">
                      {(currentStats.totalGenKwh / 1000).toFixed(2)}{' '}
                      <span className="text-xs font-bold text-slate-400">MWh</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-sky-400">
                        <Wind className="w-3 h-3" /> {(currentStats.windKwh / 1000).toFixed(1)} MWh
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Sun className="w-3 h-3" /> {(currentStats.solarKwh / 1000).toFixed(1)} MWh
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Electricity Sold & Revenue */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">{dict.soldEnergyRevenue}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      +{formatMoney(currentStats.netRevenue)}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                      <span>{(currentStats.totalSoldKwh / 1000).toFixed(2)} MWh Satıldı</span>
                      <span className="font-mono text-cyan-300">
                        Ort. {formatPricePerKwh(currentStats.avgPricePerKwh)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Inflow vs Outflow Ratio */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">Giren / Çıkan Para</span>
                    <Scale className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <ArrowDownLeft className="w-3.5 h-3.5" /> +{formatMoney(currentStats.totalInflows, { decimals: 0 })}
                      </span>
                      <span className="text-rose-400 flex items-center gap-1 font-bold">
                        <ArrowUpRight className="w-3.5 h-3.5" /> -{formatMoney(currentStats.totalOutflows, { decimals: 0 })}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${
                            currentStats.totalInflows + currentStats.totalOutflows > 0
                              ? (currentStats.totalInflows /
                                  (currentStats.totalInflows + currentStats.totalOutflows)) *
                                100
                              : 50
                          }%`
                        }}
                      />
                      <div
                        className="h-full bg-rose-500"
                        style={{
                          width: `${
                            currentStats.totalInflows + currentStats.totalOutflows > 0
                              ? (currentStats.totalOutflows /
                                  (currentStats.totalInflows + currentStats.totalOutflows)) *
                                100
                              : 50
                          }%`
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 text-right">
                      Piyasa Komisyonu: -{formatMoney(currentStats.marketFees, { decimals: 0 })}
                    </div>
                  </div>
                </div>

                {/* 4. Net Cash Flow */}
                <div
                  className={`border rounded-xl p-4 flex flex-col justify-between ${
                    currentStats.netCashFlow >= 0
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-bold">{dict.netCashFlow}</span>
                    <DollarSign
                      className={`w-4 h-4 ${
                        currentStats.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div
                      className={`text-2xl font-black font-mono ${
                        currentStats.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {currentStats.netCashFlow >= 0 ? '+' : ''}{formatMoney(currentStats.netCashFlow)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2">
                      {currentStats.netCashFlow >= 0
                        ? 'Seçili aralıkta net kâr sağlandı.'
                        : 'Yatırım ve giderler geliri aştı.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* HOURLY GENERATION & SETTLEMENT CHART */}
              {currentStats.hourlySeries && currentStats.hourlySeries.length > 0 && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Saatlik Üretim ve Net Gelir Akışı (Son {currentStats.hourlySeries.length} Saat)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Sütunlar: Saatlik Net Gelir ($)
                    </span>
                  </div>

                  <div className="h-32 flex items-end gap-1.5 pt-4 pb-1 border-b border-slate-800 overflow-x-auto">
                    {currentStats.hourlySeries.map((pt) => {
                      const maxRev = Math.max(
                        ...currentStats.hourlySeries.map((p) => p.revenue),
                        10
                      );
                      const heightPct = Math.max(8, Math.min(100, (pt.revenue / maxRev) * 100));
                      return (
                        <div
                          key={pt.gameHour}
                          className="flex-1 min-w-[18px] flex flex-col items-center justify-end h-full group relative"
                        >
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center bg-slate-900 border border-slate-700 text-slate-200 text-[10px] p-2 rounded-lg shadow-2xl z-20 whitespace-nowrap pointer-events-none">
                            <span className="font-bold text-white">
                              Saat {pt.gameHour % 24}:00 (Gün {Math.floor(pt.gameHour / 24) + 1})
                            </span>
                            <span className="text-emerald-400 font-mono">
                              Gelir: +{formatMoney(pt.revenue)}
                            </span>
                            <span className="text-slate-300">
                              Satış: {(pt.kwh / 1000).toFixed(2)} MWh
                            </span>
                            <span className="text-amber-400 font-mono">
                              Fiyat: {formatPricePerKwh(pt.price)}
                            </span>
                          </div>

                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 hover:brightness-125 transition-all cursor-pointer"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[9px] text-slate-400 font-mono mt-1">
                            {pt.gameHour % 24}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASH INFLOWS & OUTFLOWS BREAKDOWN DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gelir Kalemleri */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4" /> Gelir Kalemleri (Para Girişleri)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Elektrik Satış Geliri:</span>
                      <strong className="text-emerald-400 font-mono">
                        +{formatMoney(currentStats.breakdown.electricitySales || 0, { decimals: 0 })}
                      </strong>
                    </div>
                    {currentStats.breakdown.grants > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Devlet / Başlangıç Hibesi:</span>
                        <strong className="text-teal-400 font-mono">
                          +{formatMoney(currentStats.breakdown.grants, { decimals: 0 })}
                        </strong>
                      </div>
                    )}
                    {currentStats.breakdown.loanDisbursements > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Banka Kredisi Girişleri:</span>
                        <strong className="text-indigo-400 font-mono">
                          +{formatMoney(currentStats.breakdown.loanDisbursements, { decimals: 0 })}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gider Kalemleri */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4" /> Gider Kalemleri (Para Çıkışları)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Türbin & Panel Ekipman Alımı:</span>
                      <strong className="text-rose-400 font-mono">
                        -{formatMoney(currentStats.breakdown.equipmentPurchases || 0, { decimals: 0 })}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Arazi Kiralama / Tapu Alımı:</span>
                      <strong className="text-rose-400 font-mono">
                        -{formatMoney((currentStats.breakdown.siteLeases || 0) + (currentStats.breakdown.sitePurchases || 0), { decimals: 0 })}
                      </strong>
                    </div>
                    {currentStats.breakdown.solarTrackerUpgrades > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Güneş Takipçi Yükseltmeleri:</span>
                        <strong className="text-rose-400 font-mono">
                          -{formatMoney(currentStats.breakdown.solarTrackerUpgrades, { decimals: 0 })}
                        </strong>
                      </div>
                    )}
                    {currentStats.breakdown.loanRepayments > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="text-slate-400">Kredi Taksit & Faiz Ödemeleri:</span>
                        <strong className="text-rose-400 font-mono">
                          -{formatMoney(currentStats.breakdown.loanRepayments, { decimals: 0 })}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TRANSACTION HISTORY LEDGER */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    {dict.transactionsTitle} ({filteredLedger.length} İşlem)
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Seçili aralıktaki tüm para hareketleri
                  </span>
                </div>

                {filteredLedger.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    {dict.noTransactions}
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72 scrollbar-thin">
                    <table className="w-full text-left text-xs border-collapse table-fixed">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-900/60 sticky top-0 z-10">
                          <th className="py-2.5 px-3 w-28 whitespace-nowrap">{dict.dateHour}</th>
                          <th className="py-2.5 px-3 w-32 whitespace-nowrap">{dict.type}</th>
                          <th className="py-2.5 px-3">{dict.description}</th>
                          <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">{dict.amount}</th>
                          <th className="py-2.5 px-3 w-28 text-right whitespace-nowrap">{dict.balanceAfter}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredLedger.map((tx) => {
                          const badge = getEntryBadge(tx.entryType);
                          const isPositive = tx.amount >= 0;
                          const shortDesc = getShortDescription(tx);
                          return (
                            <tr
                              key={tx.id}
                              className="hover:bg-slate-850/60 transition-colors"
                            >
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                                {formatTxTime(tx)}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-block whitespace-nowrap ${badge.bg}`}
                                >
                                  {badge.label}
                                </span>
                              </td>
                              <td
                                className="py-2.5 px-3 text-slate-300 font-sans text-xs truncate max-w-[280px]"
                                title={tx.description || shortDesc}
                              >
                                {shortDesc}
                              </td>
                              <td
                                className={`py-2.5 px-3 text-right font-extrabold whitespace-nowrap font-mono ${
                                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {isPositive ? '+' : ''}{formatMoney(tx.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap font-mono">
                                {formatMoney(tx.balanceAfter)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simülasyon finans motoru gerçek zamanlı senkronize ediliyor.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

