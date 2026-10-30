'use client';

import React, { useState } from 'react';
import { Globe, Wind, Sun, Layers, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

function getRegionBadge(regionType, lang = 'tr') {
  if (regionType === 'wind') {
    return {
      label: lang === 'tr' ? 'Rüzgâr' : 'Wind',
      icon: <Wind className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
      className: 'text-sky-300 bg-sky-950/70 border-sky-600/50 shadow-sm shadow-sky-500/10'
    };
  }
  if (regionType === 'solar') {
    return {
      label: lang === 'tr' ? 'Güneş' : 'Solar',
      icon: <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      className: 'text-amber-300 bg-amber-950/70 border-amber-600/50 shadow-sm shadow-amber-500/10'
    };
  }
  return {
    label: lang === 'tr' ? 'Hibrit' : 'Hybrid',
    icon: (
      <span className="flex items-center -space-x-1 shrink-0">
        <Wind className="w-3 h-3 text-sky-400" />
        <Sun className="w-3 h-3 text-amber-400" />
      </span>
    ),
    className: 'text-purple-300 bg-purple-950/70 border-purple-600/50 shadow-sm shadow-purple-500/10'
  };
}

export default function SitesPanel({
  worldSites = [],
  companySites = [],
  company,
  lang,
  onActionSuccess
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatMoney } = useCurrency();
  const [filter, setFilter] = useState('all');
  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Map owned and leased sites
  const companySiteMap = new Map();
  companySites.forEach(cs => companySiteMap.set(cs.site_id, cs));

  const filteredSites = worldSites.filter((s) => {
    if (filter === 'wind') return s.region_type === 'wind';
    if (filter === 'solar') return s.region_type === 'solar';
    if (filter === 'hybrid') return s.region_type === 'hybrid';
    return true;
  });

  const handleLease = async (site, years) => {
    setLoadingId(`lease_${site.id}_${years}`);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LEASE_SITE',
          payload: { siteId: site.id, years }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kiralama işlemi başarısız.');

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  const handleBuy = async (site) => {
    setLoadingId(`buy_${site.id}`);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BUY_SITE',
          payload: { siteId: site.id }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Satın alma işlemi başarısız.');

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl 2xl:max-w-7xl mx-auto text-slate-100">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            {dict.sites.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{dict.sites.subtitle}</p>
        </div>

        {/* Filter buttons */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {dict.sites.filterAll} (24)
          </button>
          <button
            onClick={() => setFilter('wind')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filter === 'wind' ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Rüzgâr (8)</span>
          </button>
          <button
            onClick={() => setFilter('solar')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filter === 'solar' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Güneş (8)</span>
          </button>
          <button
            onClick={() => setFilter('hybrid')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              filter === 'hybrid' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hibrit (8)</span>
          </button>
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

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filteredSites.map((site) => {
          const userSite = companySiteMap.get(site.id);
          const isOwned = userSite?.tenure_type === 'own';
          const isLeased = userSite?.tenure_type === 'lease';

          const lease1Cost = Number(site.lease_price_annual);
          const lease5Cost = lease1Cost * 5;
          const buyCost = Number(site.purchase_price);

          const canLease1 = Number(company?.cash || 0) >= lease1Cost;
          const canBuy = Number(company?.cash || 0) >= buyCost;

          const regionBadge = getRegionBadge(site.region_type, lang);

          return (
            <div
              key={site.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md ${
                isOwned
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : isLeased
                  ? 'border-cyan-500/60 bg-cyan-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                      {site.id}
                    </span>
                    <h3 className="font-bold text-base text-white">{site.name}</h3>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${regionBadge.className}`}>
                    {regionBadge.icon}
                    <span>{regionBadge.label}</span>
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {lang === 'tr' ? site.description_tr : site.description_en}
                </p>

                {/* Metric Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      {dict.sites.windPotential}
                    </span>
                    <strong className="text-sky-400 font-mono text-sm">
                      %{(Number(site.base_wind_potential) * 100).toFixed(0)}
                    </strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      {dict.sites.solarPotential}
                    </span>
                    <strong className="text-amber-400 font-mono text-sm">
                      %{(Number(site.base_solar_potential) * 100).toFixed(0)}
                    </strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Arazi Boyutu</span>
                    <strong className="text-slate-300 font-mono text-sm">
                      {site.area_hectares} Ha
                    </strong>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                      {dict.sites.gridDistance}
                    </span>
                    <strong className="text-cyan-400 font-mono text-sm">
                      {site.grid_distance_km} km
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80">
                {isOwned ? (
                  <div className="py-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{dict.sites.ownedBadge} ({userSite.plant_name})</span>
                  </div>
                ) : isLeased ? (
                  <div className="space-y-2">
                    <div className="py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-center text-xs font-bold text-cyan-300">
                      {dict.sites.leasedBadge} ({userSite.plant_name})
                    </div>
                    <button
                      disabled={!canBuy || loadingId === `buy_${site.id}`}
                      onClick={() => handleBuy(site)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {loadingId === `buy_${site.id}` ? 'İşleniyor...' : `Tapusunu Satın Al (${formatMoney(buyCost, { decimals: 0 })})`}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Yıllık Kira: <strong className="text-white font-mono">{formatMoney(lease1Cost, { decimals: 0 })}</strong></span>
                      <span>Satış: <strong className="text-white font-mono">{formatMoney(buyCost, { decimals: 0 })}</strong></span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={!canLease1 || loadingId === `lease_${site.id}_1`}
                        onClick={() => handleLease(site, 1)}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        {loadingId === `lease_${site.id}_1` ? '...' : `1 Yıl Kirala`}
                      </button>

                      <button
                        disabled={!canBuy || loadingId === `buy_${site.id}`}
                        onClick={() => handleBuy(site)}
                        className="py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                      >
                        {loadingId === `buy_${site.id}` ? '...' : `Satın Al`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

