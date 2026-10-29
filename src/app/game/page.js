'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import TopHud from '@/components/ui/TopHud';
import WorldCanvas from '@/components/game3d/WorldCanvas';
import ShopPanel from '@/components/panels/ShopPanel';
import SitesPanel from '@/components/panels/SitesPanel';
import PlantsPanel from '@/components/panels/PlantsPanel';
import MarketPanel from '@/components/panels/MarketPanel';
import BatteryPanel from '@/components/panels/BatteryPanel';
import FinancePanel from '@/components/panels/FinancePanel';
import LeaderboardPanel from '@/components/panels/LeaderboardPanel';
import SettingsPanel, { DEFAULT_SETTINGS } from '@/components/panels/SettingsPanel';
import TreasuryModal from '@/components/modals/TreasuryModal';
import { X, Globe, Wind, Sun, Layers, ShieldCheck } from 'lucide-react';

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [lang, setLang] = useState('tr');
  const [inspectedSite, setInspectedSite] = useState(null);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load persisted graphics and visual settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('energy_tycoon_settings');
      if (saved) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }, []);

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('energy_tycoon_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Settings save error:', e);
    }
  };

  // Fetch or refresh game state
  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch('/api/game/state');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setGameState(data);
      if (data.company?.language) {
        setLang(data.company.language);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGameState();

    // Regular interval to refresh clock, prices and production settlements
    const interval = setInterval(() => {
      fetchGameState();
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [fetchGameState]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-4">
        <Image
          src="/logo.png"
          alt="Energy Tycoon"
          width={72}
          height={72}
          className="w-18 h-18 object-contain animate-pulse drop-shadow-2xl"
          priority
        />
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <div className="text-xs font-bold tracking-widest uppercase text-emerald-400">
          Simülasyon Dünyası Yükleniyor...
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl max-w-md text-center">
          <p className="text-red-400 font-semibold mb-4">{error || 'Bağlantı kurulamadı'}</p>
          <button
            onClick={() => { setLoading(true); fetchGameState(); }}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative font-sans select-none">
      {/* Top HUD */}
      <TopHud
        company={gameState.company}
        finance={gameState.finance}
        clock={gameState.clock}
        spotPrice={gameState.spotPrice}
        totalCapacityKw={gameState.totalCapacityKw}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onLogout={handleLogout}
        onOpenTreasury={() => setIsTreasuryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="w-full h-full pt-28 pb-4 relative">
        {/* 3D Map View is always mounted for camera persistence */}
        <div className={`w-full h-full ${activeTab === 'map' ? 'block' : 'hidden'}`}>
          <WorldCanvas
            worldSites={gameState.worldSites}
            companySites={gameState.companySites}
            installedAssets={gameState.installedAssets}
            clock={gameState.clock}
            settings={settings}
            onSelectSite={(site) => setInspectedSite(site)}
          />
        </div>

        {/* Floating Modal Slide-Overs for Management Panels */}
        {activeTab !== 'map' && (
          <div className="w-full h-full overflow-y-auto bg-slate-950/95 backdrop-blur-md z-30 relative pb-16">
            {activeTab === 'shop' && (
              <ShopPanel
                catalog={gameState.equipmentCatalog}
                company={gameState.company}
                companySites={gameState.companySites}
                lang={lang}
                onActionSuccess={fetchGameState}
              />
            )}

            {activeTab === 'sites' && (
              <SitesPanel
                worldSites={gameState.worldSites}
                companySites={gameState.companySites}
                company={gameState.company}
                lang={lang}
                onActionSuccess={fetchGameState}
              />
            )}

            {activeTab === 'plants' && (
              <PlantsPanel
                companySites={gameState.companySites}
                installedAssets={gameState.installedAssets}
                company={gameState.company}
                lang={lang}
                onActionSuccess={fetchGameState}
              />
            )}

            {activeTab === 'market' && (
              <MarketPanel
                spotPrice={gameState.spotPrice}
                priceChart={gameState.priceChart}
                clock={gameState.clock}
                lang={lang}
              />
            )}

            {activeTab === 'battery' && (
              <BatteryPanel
                batterySettings={gameState.batterySettings}
                companySites={gameState.companySites}
                installedAssets={gameState.installedAssets}
                lang={lang}
                onActionSuccess={fetchGameState}
              />
            )}

            {activeTab === 'finance' && (
              <FinancePanel
                company={gameState.company}
                finance={gameState.finance}
                activeLoans={gameState.activeLoans}
                lang={lang}
                onActionSuccess={fetchGameState}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardPanel
                leaderboard={gameState.leaderboard}
                lang={lang}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                lang={lang}
              />
            )}
          </div>
        )}

        {/* 3D Inspected Site Quick Modal (when clicking a site on the 3D map) */}
        {inspectedSite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative text-slate-100">
              <button
                onClick={() => setInspectedSite(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between mb-3 pr-8">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {inspectedSite.id}
                  </span>
                  <h3 className="font-extrabold text-lg text-white">{inspectedSite.name}</h3>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                    inspectedSite.region_type === 'wind'
                      ? 'text-sky-300 bg-sky-950/70 border-sky-600/50'
                      : inspectedSite.region_type === 'solar'
                      ? 'text-amber-300 bg-amber-950/70 border-amber-600/50'
                      : 'text-purple-300 bg-purple-950/70 border-purple-600/50'
                  }`}
                >
                  {inspectedSite.region_type === 'wind' && <Wind className="w-3.5 h-3.5 text-sky-400" />}
                  {inspectedSite.region_type === 'solar' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  {inspectedSite.region_type === 'hybrid' && (
                    <span className="flex items-center -space-x-1">
                      <Wind className="w-3 h-3 text-sky-400" />
                      <Sun className="w-3 h-3 text-amber-400" />
                    </span>
                  )}
                  <span>
                    {inspectedSite.region_type === 'wind'
                      ? 'Rüzgâr'
                      : inspectedSite.region_type === 'solar'
                      ? 'Güneş'
                      : 'Hibrit'}
                  </span>
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                {lang === 'tr' ? inspectedSite.description_tr : inspectedSite.description_en}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-5">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Rüzgâr Potansiyeli</span>
                  <strong className="text-sky-400 font-mono">%{(Number(inspectedSite.base_wind_potential) * 100).toFixed(0)}</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Güneş Potansiyeli</span>
                  <strong className="text-amber-400 font-mono">%{(Number(inspectedSite.base_solar_potential) * 100).toFixed(0)}</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Alan</span>
                  <strong className="text-slate-200 font-mono">{inspectedSite.area_hectares} Ha</strong>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Trafo Mesafesi</span>
                  <strong className="text-cyan-400 font-mono">{inspectedSite.grid_distance_km} km</strong>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setInspectedSite(null);
                    setActiveTab('sites');
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20"
                >
                  Araziler Paneline Git
                </button>
                <button
                  onClick={() => {
                    setInspectedSite(null);
                    setActiveTab('shop');
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                >
                  Ekipman Kur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Treasury & Cash Flow Modal (Triggered by clicking cash pill in HUD) */}
        <TreasuryModal
          isOpen={isTreasuryOpen}
          onClose={() => setIsTreasuryOpen(false)}
          company={gameState.company}
          lang={lang}
        />
      </main>
    </div>
  );
}
