'use client';

import React from 'react';
import { BarChart3, TrendingUp, Info, X, Zap, Clock, ShieldAlert } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

export default function MarketModal({
  isOpen,
  onClose,
  spotPrice,
  priceChart = [],
  clock,
  lang = 'tr'
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatPricePerKwh, currency, exchangeRate } = useCurrency();
  const currentHour = Number(clock?.gameHour || 0);

  if (!isOpen) return null;

  // Find min and max for chart scaling
  const prices = priceChart.map((p) => p.pricePerKwh);
  const minP = Math.min(...prices, 0.045);
  const maxP = Math.max(...prices, 0.165);
  const range = maxP - minP;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* MODAL HEADER */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2 flex-wrap leading-tight">
                <span>{dict.market?.title || 'Elektrik Piyasası & Spot Fiyatlar'}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 shrink-0">
                  Canlı Piyasa
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate">
                {dict.market?.subtitle || 'Anlık spot elektrik fiyatları, 48 saatlik fiyat eğrisi ve piyasa dinamikleri.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Spot Price Badge */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {dict.market?.currentPrice || 'Spot Fiyat'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono tracking-tight">
                {formatPricePerKwh(spotPrice?.pricePerKwh)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Kapat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
          {/* SPOT PRICE STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                {dict.market?.currentPrice || 'Anlık Spot Fiyat'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">
                {formatPricePerKwh(spotPrice?.pricePerKwh)}
              </div>
              <span className="text-xs text-slate-500 font-mono block mt-1">
                ({currency === 'TRY' ? `₺${(Number(spotPrice?.pricePerMwh || 0) * exchangeRate).toFixed(2)}` : `$${spotPrice?.pricePerMwh}`} / MWh)
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Piyasa Komisyonu
              </span>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono mt-1">
                %2.5
              </div>
              <span className="text-xs text-slate-500 block mt-1">
                Satış hasılatından otomatik kesilir
              </span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Piyasa Zirve & Dip Aralıkları
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-200 mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span>🔥 Akşam Zirvesi:</span>
                  <span className="text-amber-400 font-mono font-bold">18:00 - 21:00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🌙 Gece Düşüşü:</span>
                  <span className="text-sky-400 font-mono font-bold">02:00 - 05:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 48-HOUR PRICE CURVE BAR VISUALIZATION */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                {dict.market?.chartTitle || '48 Saatlik Spot Fiyat Eğrisi (-24s / +24s)'}
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                  {dict.market?.historical || 'Geçmiş'}
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Şu Anki Saat
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
                  {dict.market?.forecast || 'Tahmin'}
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-56 sm:h-64 flex items-end gap-[2px] sm:gap-1 md:gap-1.5 pt-8 pb-2 border-b border-slate-800 w-full">
              {priceChart.map((p, idx) => {
                const isCurrent = p.gameHour === currentHour;
                const isPast = p.gameHour < currentHour;
                const heightPct = Math.max(15, Math.min(100, ((p.pricePerKwh - minP) / (range || 1)) * 100));

                const barColor = isCurrent
                  ? 'bg-gradient-to-t from-emerald-500 to-teal-300 shadow-lg shadow-emerald-500/50 ring-1 ring-emerald-300'
                  : isPast
                  ? 'bg-slate-700/80 hover:bg-slate-600'
                  : 'bg-cyan-500/80 hover:bg-cyan-400';

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/95 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] text-white whitespace-nowrap z-30 pointer-events-none shadow-xl flex flex-col items-center gap-0.5">
                      <div className="font-semibold text-slate-300">
                        Saat {p.hourOfDay}:00 {isCurrent ? '• Şu An' : isPast ? '• Geçmiş' : '• Tahmin'}
                      </div>
                      <strong className="text-emerald-400 font-mono text-xs">{formatPricePerKwh(p.pricePerKwh)}</strong>
                    </div>

                    <div
                      className={`w-full rounded-t-sm transition-all duration-200 ${barColor}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-400 font-mono mt-3 px-1 flex-wrap gap-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                -24 Saat (Geçmiş)
              </span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                ŞU AN: {clock?.formattedHour || '00:00'} ({formatPricePerKwh(spotPrice?.pricePerKwh)})
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                +24 Saat (Tahmin)
                <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
              </span>
            </div>
          </div>

          {/* MARKET NOTICE */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {dict.market?.commissionNotice || 'Şebekeye verilen elektrik piyasa komisyonu düşüldükten sonra anında tahakkuk eder'}.
              Tüm santrallerinizin ürettiği elektrik, batarya rezerv kurallarınız elverdiği sürece otomatik olarak her oyun saati sonunda spot piyasa fiyatından şirket kasanıza aktarılır.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

