'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Wind, Sun, BatteryCharging, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

function getEquipmentImage(item) {
  if (item.equipment_type === 'wind_turbine') {
    return '/equipment/wind_turbine.jpg';
  }
  if (item.equipment_type === 'solar_pack') {
    return '/equipment/solar_pack.jpg';
  }
  if (item.equipment_type === 'battery') {
    return '/equipment/battery_pack.jpg';
  }
  return '/equipment/wind_turbine.jpg';
}

export default function ShopPanel({
  catalog = [],
  company,
  companySites = [],
  lang,
  onActionSuccess
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatMoney } = useCurrency();
  const [activeType, setActiveType] = useState('wind_turbine');
  const [selectedSiteId, setSelectedSiteId] = useState(companySites[0]?.id || '');
  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const filteredItems = catalog.filter((item) => item.equipment_type === activeType);
  const selectedSite = companySites.find((cs) => cs.id === selectedSiteId);

  const handleUpgradeTracker = async () => {
    if (!selectedSiteId) {
      setFeedback({ type: 'error', text: 'Lütfen yükseltme yapılacak bir santral sahası seçin.' });
      return;
    }

    setLoadingId('tracker');
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPGRADE_SOLAR_TRACKER',
          payload: { companySiteId: selectedSiteId }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const handleBuy = async (item) => {
    if (!selectedSiteId) {
      setFeedback({ type: 'error', text: 'Lütfen ekipmanın kurulacağı bir santral sahası seçin.' });
      return;
    }

    setLoadingId(item.id);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BUY_EQUIPMENT',
          payload: {
            catalogId: item.id,
            companySiteId: selectedSiteId
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Satın alma işlemi başarısız.');
      }

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-slate-100">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            {dict.shop.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{dict.shop.subtitle}</p>
        </div>

        {/* Site Selector for Installation */}
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Kurulum Sahası:</span>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

      {/* Equipment Type Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveType('wind_turbine')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeType === 'wind_turbine'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>{dict.shop.windTab} (6)</span>
        </button>

        <button
          onClick={() => setActiveType('solar_pack')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeType === 'solar_pack'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>{dict.shop.solarTab} (6)</span>
        </button>

        <button
          onClick={() => setActiveType('battery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeType === 'battery'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BatteryCharging className="w-4 h-4" />
          <span>{dict.shop.batteryTab} (3)</span>
        </button>
      </div>

      {/* Solar Tracker Upgrade Highlight (for Solar & Hybrid Sites) */}
      {activeType === 'solar_pack' && (
        <div className="mb-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Sun className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">
                  Akıllı Güneş Takip Sistemi (Solar Sun-Tracker Retrofit)
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  +%25 Üretim Bonusu
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Tek eksenli mekanik aktüatörlerle panellerin sabahtan akşama güneşi takip etmesini sağlayın. Mevcut ve yeni kurulacak tüm güneş panellerinizin günlük elektrik hasadını %25 artırır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
            {selectedSite?.has_solar_tracker ? (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Bu Santralde Aktif</span>
              </div>
            ) : (
              <button
                disabled={loadingId === 'tracker' || Number(company?.cash || 0) < 28000}
                onClick={handleUpgradeTracker}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingId === 'tracker' ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                ) : (
                  <span>Güneş Takip Sistemi Kur ({formatMoney(28000, { decimals: 0 })})</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const cost = Number(item.cost_usd);
          const canAfford = Number(company?.cash || 0) >= cost;
          const meetsLevel = Number(company?.level || 1) >= item.min_level_required;
          const isAvailable = canAfford && meetsLevel;

          const typeBadge =
            item.equipment_type === 'wind_turbine'
              ? { label: 'Rüzgâr', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' }
              : item.equipment_type === 'solar_pack'
              ? { label: 'Güneş', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' }
              : { label: 'Batarya', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };

          return (
            <div
              key={item.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 hover:shadow-xl transition-all shadow-md group"
            >
              <div>
                {/* Visual Image Header */}
                <div className="relative w-full h-44 bg-slate-950 overflow-hidden border-b border-slate-800">
                  <Image
                    src={getEquipmentImage(item)}
                    alt={item.model_name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Overlaid Badges */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md text-slate-200 border border-slate-700/80 shadow-sm">
                      {item.manufacturer}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-sm ${typeBadge.color}`}>
                      {typeBadge.label}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/30">
                      {item.capacity_kw >= 1000
                        ? `${(item.capacity_kw / 1000).toFixed(1)} MW`
                        : `${item.capacity_kw} kW`}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-300 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-cyan-500/30">
                      %{(Number(item.efficiency) * 100).toFixed(1)} Verim
                    </span>
                  </div>
                </div>

                {/* Card Info & Metrics */}
                <div className="p-4 pb-0">
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors mb-1.5">
                    {item.model_name}
                  </h3>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {lang === 'tr' ? item.description_tr : item.description_en}
                  </p>

                  {/* Specs Pill Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        {dict.shop.capacity}
                      </span>
                      <strong className="text-emerald-400 font-mono text-sm">
                        {item.capacity_kw >= 1000
                          ? `${(item.capacity_kw / 1000).toFixed(1)} MW`
                          : `${item.capacity_kw} kW`}
                      </strong>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        {dict.shop.efficiency}
                      </span>
                      <strong className="text-cyan-400 font-mono text-sm">
                        %{(Number(item.efficiency) * 100).toFixed(1)}
                      </strong>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        {dict.shop.minLevel}
                      </span>
                      <strong className={`font-mono text-sm ${meetsLevel ? 'text-white' : 'text-amber-400'}`}>
                        Seviye {item.min_level_required}
                      </strong>
                    </div>

                    <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        {dict.shop.lifespan}
                      </span>
                      <strong className="text-slate-300 font-mono text-sm">
                        {item.lifespan_game_years} Yıl
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="p-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase">Fiyat</span>
                  <div className="text-lg font-black text-white font-mono">
                    {formatMoney(cost, { decimals: 0 })}
                  </div>
                </div>

                <button
                  disabled={!isAvailable || loadingId === item.id}
                  onClick={() => handleBuy(item)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                    isAvailable
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {loadingId === item.id ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <span>{dict.shop.buyButton}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

