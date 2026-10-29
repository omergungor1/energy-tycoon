'use client';

import React from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export default function MarketPanel({
  spotPrice,
  priceChart = [],
  clock,
  lang
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const currentHour = Number(clock?.gameHour || 0);

  // Find min and max for chart scaling
  const prices = priceChart.map(p => p.pricePerKwh);
  const minP = Math.min(...prices, 0.045);
  const maxP = Math.max(...prices, 0.165);
  const range = maxP - minP;

  return (
    <div className="p-6 max-w-6xl 2xl:max-w-7xl mx-auto text-slate-100">
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          {dict.market.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{dict.market.subtitle}</p>
      </div>

      {/* Spot Price Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase">{dict.market.currentPrice}</span>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
            ${spotPrice?.pricePerKwh} <span className="text-sm font-normal text-slate-400">/ kWh</span>
          </div>
          <span className="text-xs text-slate-500 font-mono block mt-1">
            (${spotPrice?.pricePerMwh} / MWh)
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase">Piyasa Komisyonu</span>
          <div className="text-3xl font-black text-cyan-400 font-mono mt-1">
            %2.5
          </div>
          <span className="text-xs text-slate-500 block mt-1">
            Satış hasılatından otomatik kesilir
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
          <span className="text-xs text-slate-400 font-semibold uppercase">Piyasa Zirve / Dip Aralıkları</span>
          <div className="text-sm font-bold text-slate-200 mt-2 space-y-1">
            <div>🔥 Akşam Zirvesi: <span className="text-amber-400">18:00 - 21:00</span></div>
            <div>🌙 Gece Düşüşü: <span className="text-sky-400">02:00 - 05:00</span></div>
          </div>
        </div>
      </div>

      {/* 48-Hour Price Curve Bar Visualization */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            {dict.market.chartTitle}
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full bg-slate-600 inline-block" />
              {dict.market.historical}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              Şu Anki Saat
            </span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
              {dict.market.forecast}
            </span>
          </div>
        </div>

        {/* Visual Bar Chart (Responsive width without unwanted horizontal scroll) */}
        <div className="h-60 flex items-end gap-[2px] sm:gap-1 md:gap-1.5 pt-8 pb-2 border-b border-slate-800 w-full">
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
                  <strong className="text-emerald-400 font-mono text-xs">${p.pricePerKwh} / kWh</strong>
                </div>

                <div
                  className={`w-full rounded-t-sm transition-all duration-200 ${barColor}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono mt-3 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
            -24 Saat (Geçmiş)
          </span>
          <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            ŞU ANKI SAAT: {clock?.formattedHour || '00:00'}
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            +24 Saat (Tahmin)
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          {dict.market.commissionNotice}. Üretilen ve şebekeye verilen elektrik, batarya rezerv kurallarınız elverdiği sürece otomatik olarak her oyun saati sonunda şirket kasanıza aktarılır.
        </div>
      </div>
    </div>
  );
}

