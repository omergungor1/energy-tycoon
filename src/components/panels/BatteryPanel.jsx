'use client';

import React, { useState } from 'react';
import { BatteryCharging, Zap, Sliders, Check, AlertCircle } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export default function BatteryPanel({
  batterySettings = [],
  companySites = [],
  installedAssets = [],
  lang,
  onActionSuccess
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const [selectedSiteId, setSelectedSiteId] = useState(companySites[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentSetting = batterySettings.find(b => b.company_site_id === selectedSiteId);
  const [minPrice, setMinPrice] = useState(currentSetting?.min_sell_price || 0.0850);
  const [reservePct, setReservePct] = useState(currentSetting?.reserve_percentage || 20);

  // Calculate battery capacity for the selected site
  const siteAssets = installedAssets.filter(a => a.company_site_id === selectedSiteId);
  const batteryAssets = siteAssets.filter(a => a.equipment_catalog?.equipment_type === 'battery');

  let siteBatteryCapKwh = 0;
  for (const b of batteryAssets) {
    siteBatteryCapKwh += Number(b.equipment_catalog?.capacity_kw || 1000);
  }

  const storedKwh = Number(currentSetting?.stored_kwh || 0);
  const fillPct = siteBatteryCapKwh > 0 ? Math.min(100, (storedKwh / siteBatteryCapKwh) * 100) : 0;

  const handleSave = async () => {
    if (!selectedSiteId) return;
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_BATTERY_RULES',
          payload: {
            companySiteId: selectedSiteId,
            minSellPrice: Number(minPrice),
            reservePercentage: Number(reservePct)
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kurallar kaydedilemedi.');

      setFeedback({ type: 'success', text: dict.battery.rulesSavedSuccess });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-slate-100">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <BatteryCharging className="w-6 h-6 text-emerald-400" />
            {dict.battery.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{dict.battery.subtitle}</p>
        </div>

        {/* Plant Selector */}
        <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Santral:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              const next = batterySettings.find(b => b.company_site_id === e.target.value);
              if (next) {
                setMinPrice(next.min_sell_price);
                setReservePct(next.reserve_percentage);
              }
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
          >
            {companySites.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.plant_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Battery State Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-400 font-semibold uppercase">{dict.battery.storedEnergy}</span>
          <span className="text-xs text-slate-400 font-mono">
            {storedKwh.toLocaleString()} / {siteBatteryCapKwh.toLocaleString()} kWh
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-4 bg-slate-950 border border-slate-800 rounded-full overflow-hidden p-0.5 mb-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${fillPct}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Doluluk: %{fillPct.toFixed(1)}</span>
          <span>Rezerv Sınırı: %{reservePct}</span>
        </div>
      </div>

      {/* Strategy Control Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          Otomatik Arbitraj & Deşarj Kuralları
        </h3>

        {/* Min Sell Price Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-300 font-semibold">
              {dict.battery.minPriceLabel}
            </label>
            <span className="text-sm font-bold font-mono text-emerald-400">
              ${Number(minPrice).toFixed(4)} / kWh
            </span>
          </div>
          <input
            type="range"
            min="0.0500"
            max="0.1500"
            step="0.0050"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Spot elektrik fiyatı bu eşiğin üstüne çıktığında veya günün tepe noktasındayken bataryadaki enerji şebekeye satılır.
          </p>
        </div>

        {/* Reserve Percentage Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-300 font-semibold">
              {dict.battery.reserveLabel}
            </label>
            <span className="text-sm font-bold font-mono text-cyan-400">
              %{reservePct}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={reservePct}
            onChange={(e) => setReservePct(e.target.value)}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Bataryadaki bu rezerv yüzdesi hiçbir zaman satışa çıkarılmaz; acil operasyonel güvenlik için saklanır.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20 text-xs transition-all disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : dict.battery.saveRulesBtn}
        </button>
      </div>
    </div>
  );
}

