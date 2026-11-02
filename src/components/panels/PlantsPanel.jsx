'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Factory, Wrench, Check, AlertCircle, Zap, Shield, Edit2, Sun, ShoppingBag } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

function getEquipmentImage(type) {
  if (type === 'wind_turbine') return '/equipment/wind_turbine.jpg';
  if (type === 'solar_pack') return '/equipment/solar_pack.jpg';
  if (type === 'battery') return '/equipment/battery_pack.jpg';
  return '/equipment/wind_turbine.jpg';
}

export default function PlantsPanel({
  companySites = [],
  installedAssets = [],
  company,
  clock = {},
  lang,
  onActionSuccess,
  onNavigateToShop = null
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatMoney } = useCurrency();
  const [selectedPlantId, setSelectedPlantId] = useState('all');
  const [maintenanceLoadingId, setMaintenanceLoadingId] = useState(null);
  const [renamingSiteId, setRenamingSiteId] = useState(null);
  const [newPlantName, setNewPlantName] = useState('');
  const [feedback, setFeedback] = useState(null);

  const filteredAssets = installedAssets.filter((a) => {
    if (selectedPlantId === 'all') return true;
    return a.company_site_id === selectedPlantId;
  });

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

  const handleRename = async (siteId) => {
    if (!newPlantName.trim()) return;
    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RENAME_SITE',
          payload: { companySiteId: siteId, newName: newPlantName }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRenamingSiteId(null);
      setNewPlantName('');
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleUpgradeTracker = async (siteId) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPGRADE_SOLAR_TRACKER',
          payload: { companySiteId: siteId }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const selectedSiteObj = companySites.find((cs) => cs.id === selectedPlantId);

  return (
    <div className="p-6 max-w-6xl 2xl:max-w-7xl mx-auto text-slate-100">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Factory className="w-6 h-6 text-emerald-400" />
            {dict.plants.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{dict.plants.subtitle}</p>
        </div>

        {/* Filter by plant & Quick Add Equipment Button */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <span className="text-slate-400 font-semibold">Santral Filtresi:</span>
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Tüm Santraller ({installedAssets.length} Ünite)</option>
            {companySites.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.plant_name}
              </option>
            ))}
          </select>
          {selectedPlantId !== 'all' && onNavigateToShop && (
            <button
              onClick={() => {
                const cs = companySites.find((c) => c.id === selectedPlantId);
                onNavigateToShop(selectedPlantId, cs?.sites?.region_type);
              }}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ekipman Ekle (Mağaza)</span>
            </button>
          )}
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

      {/* Solar Tracker Equipment Module for Solar & Hybrid Plants */}
      {selectedSiteObj && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Akıllı Güneş Takip Sistemi (Solar Tracker)</span>
                {selectedSiteObj.has_solar_tracker ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Aktif (+%25 Üretim)
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Kurulabilir
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedSiteObj.has_solar_tracker
                  ? 'Güneş panelleri güneşi otomatik takip ediyor; günlük elektrik üretiminiz %25 artırıldı.'
                  : 'Güneş panellerinizin açısını sabahtan akşama güneşe yönlendirerek üretim verimini %25 artırabilirsiniz.'}
              </p>
            </div>
          </div>

          {!selectedSiteObj.has_solar_tracker && (
            <button
              onClick={() => handleUpgradeTracker(selectedSiteObj.id)}
              disabled={Number(company?.cash || 0) < 28000}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 whitespace-nowrap disabled:opacity-50"
            >
              Tracker Kur ($28.000)
            </button>
          )}
        </div>
      )}

      {/* Installed Units List */}
      <div className="space-y-4">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400">
            <p className="mb-3">Henüz kurulu ekipman bulunmuyor. Ekipman Mağazası'ndan rüzgâr türbini veya güneş dizisi satın alabilirsiniz.</p>
            {onNavigateToShop && (
              <button
                onClick={() => {
                  const cs = companySites.find((c) => c.id === selectedPlantId);
                  onNavigateToShop(selectedPlantId !== 'all' ? selectedPlantId : null, cs?.sites?.region_type);
                }}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ekipman Mağazası'na Git</span>
              </button>
            )}
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const catalog = asset.equipment_catalog || {};
            const condition = Number(asset.condition || 100);
            const conditionColor =
              condition > 75 ? 'bg-emerald-500' : condition > 45 ? 'bg-amber-500' : 'bg-red-500';

            const cSite = companySites.find((cs) => cs.id === asset.company_site_id);

            // 1-week (168 game hours) construction duration
            const isConstructionType = ['wind_turbine', 'solar_pack'].includes(catalog.equipment_type);
            const elapsedHours = Math.max(0, (Number(clock?.gameHour) || 0) - Number(asset.installed_game_hour || 0));
            const isUnderConstruction = isConstructionType && elapsedHours < 168;
            const progressPct = Math.min(100, Math.max(0, Math.floor((elapsedHours / 168) * 100)));
            const daysRemaining = Math.max(1, Math.ceil((168 - elapsedHours) / 24));

            return (
              <div
                key={asset.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0 relative mt-0.5 shadow-sm">
                    <Image
                      src={getEquipmentImage(catalog.equipment_type)}
                      alt={catalog.model_name || 'Equipment'}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-base text-white">{catalog.model_name}</h4>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {catalog.equipment_type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-400 mb-3">
                      <span>Santral: <strong className="text-slate-200">{cSite?.plant_name || 'Bilinmiyor'}</strong></span>
                      <span>•</span>
                      <span>Kapasite: <strong className="text-emerald-400">{catalog.capacity_kw} kW</strong></span>
                      <span>•</span>
                      {isUnderConstruction ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                          <span>🚧 Kurulumda</span>
                          <span className="font-mono">%{progressPct}</span>
                          <span className="text-amber-400/80 font-normal">({daysRemaining} gün kaldı)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                          <span>Üretimde</span>
                        </span>
                      )}
                    </div>

                    {/* Condition progress */}
                    <div className="flex items-center gap-3 w-64">
                      <span className="text-xs text-slate-400 font-semibold">{dict.plants.condition}:</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${conditionColor} transition-all`}
                          style={{ width: `${condition}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200">%{condition.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Maintenance Button */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    disabled={isUnderConstruction || condition >= 99 || maintenanceLoadingId === asset.id || Number(company?.cash || 0) < 5000}
                    onClick={() => handleMaintenance(asset.id)}
                    title={isUnderConstruction ? 'Ekipman şu anda 1 haftalık kurulum aşamasındadır.' : undefined}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                      !isUnderConstruction && condition < 99 && Number(company?.cash || 0) >= 5000
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    {maintenanceLoadingId === asset.id ? (
                      'Bakım Yapılıyor...'
                    ) : (
                      <span>{lang === 'tr' ? `Periyodik Bakım Yap (${formatMoney(5000, { decimals: 0 })})` : `Perform Maintenance (${formatMoney(5000, { decimals: 0 })})`}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

