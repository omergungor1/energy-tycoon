'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import LeaderboardModal from '@/components/modals/LeaderboardModal';
import MarketModal from '@/components/modals/MarketModal';
import DriveOverlay from '@/components/ui/DriveOverlay';
import WalkOverlay from '@/components/ui/WalkOverlay';
import CinematicOverlay from '@/components/ui/CinematicOverlay';
import { CurrencyProvider } from '@/context/CurrencyContext';
import {
  X,
  Globe,
  Wind,
  Sun,
  Layers,
  ShieldCheck,
  Car,
  Footprints,
  Film,
  ShoppingBag,
  Factory,
  BatteryCharging,
  Landmark,
  BarChart3,
  Trophy,
  Settings
} from 'lucide-react';

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [lang, setLang] = useState('tr');
  const [inspectedSite, setInspectedSite] = useState(null);
  const [focusedSite, setFocusedSite] = useState(null);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Vehicle Exploration Driving Mode State
  const [isDrivingMode, setIsDrivingMode] = useState(false);
  const [drivingCameraMode, setDrivingCameraMode] = useState('cockpit');
  const [vehicleStats, setVehicleStats] = useState({});

  // Pedestrian Walk & Run Exploration Mode State
  const [isWalkingMode, setIsWalkingMode] = useState(false);
  const [walkingCameraMode, setWalkingCameraMode] = useState('chase');
  const [walkerStats, setWalkerStats] = useState({});

  // Cinematic Auto-Camera Tour Mode State
  const [isCinematicMode, setIsCinematicMode] = useState(false);
  const [cinematicTourType, setCinematicTourType] = useState('grand'); // 'grand' | 'plants' | 'scenic'
  const [cinematicSpeed, setCinematicSpeed] = useState(1.0);
  const [isCinematicUiHidden, setIsCinematicUiHidden] = useState(false);

  const [touchInput, setTouchInput] = useState({});

  // Auto exit exploration & cinematic modes if a management modal is opened
  useEffect(() => {
    if (activeTab) {
      if (isDrivingMode) setIsDrivingMode(false);
      if (isWalkingMode) setIsWalkingMode(false);
      if (isCinematicMode) setIsCinematicMode(false);
    }
  }, [activeTab, isDrivingMode, isWalkingMode, isCinematicMode]);

  // Global Keyboard shortcuts (Escape & 'H' for UI toggle in cinematic mode)
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape') {
        if (isCinematicMode) {
          setIsCinematicMode(false);
        } else if (isDrivingMode) {
          setIsDrivingMode(false);
        } else if (isWalkingMode) {
          setIsWalkingMode(false);
        } else if (activeTab) {
          setActiveTab(null);
        } else if (inspectedSite) {
          setInspectedSite(null);
        }
      } else if (e.key === 'KeyH' || e.key === 'h' || e.key === 'H') {
        if (isCinematicMode) {
          setIsCinematicUiHidden((prev) => !prev);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, inspectedSite, isDrivingMode, isWalkingMode, isCinematicMode]);

  // Compute player's active owned and leased sites for the top selector dropdown
  const mySites = useMemo(() => {
    if (!gameState?.companySites) return [];
    return gameState.companySites.map((cs) => {
      const ws =
        cs.world_sites ||
        gameState.worldSites?.find((w) => w.id === cs.site_id) ||
        {};
      return {
        companySiteId: cs.id,
        siteId: cs.site_id,
        plantName: cs.plant_name || ws.name || `Santral #${cs.site_id}`,
        siteName: ws.name || `Arazi #${cs.site_id}`,
        regionType: ws.region_type || 'wind',
        tenureType: cs.tenure_type || 'lease',
        centerX: ws.center_x ?? 0,
        centerZ: ws.center_z ?? 0,
        hasSolarTracker: Boolean(cs.has_solar_tracker),
        windPotential: ws.wind_potential,
        solarPotential: ws.solar_potential
      };
    });
  }, [gameState?.companySites, gameState?.worldSites]);

  // Focus and auto-zoom directly to a player's plant
  const handleFocusPlant = useCallback((siteId) => {
    setFocusedSite({ siteId, timestamp: Date.now() });
    setActiveTab(null);
  }, []);

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
    <CurrencyProvider>
      <div className="w-screen h-screen bg-slate-950 overflow-hidden relative font-sans select-none">
        {/* Top HUD (Hidden during vehicle driving/walking mode, or when cinematic UI is hidden) */}
        {!isDrivingMode && !isWalkingMode && !(isCinematicMode && isCinematicUiHidden) && (
          <TopHud
            company={gameState.company}
            user={gameState.user}
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
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenMarket={() => setIsMarketOpen(true)}
            mySites={mySites}
            focusedSite={focusedSite}
            onFocusPlant={handleFocusPlant}
          />
        )}

        {/* Main Content Area */}
        <main className={`w-full h-full pb-0 relative ${isDrivingMode || isWalkingMode || isCinematicMode ? 'pt-0' : 'pt-14 sm:pt-16'}`}>
          {/* 3D Map View: Always mounted, active, and alive in the background */}
          <div className="w-full h-full block">
            <WorldCanvas
              worldSites={gameState.worldSites}
              companySites={gameState.companySites}
              installedAssets={gameState.installedAssets}
              clock={gameState.clock}
              settings={settings}
              focusedSite={focusedSite}
              onSelectSite={(site) => setInspectedSite(site)}
              isDrivingMode={isDrivingMode}
              drivingCameraMode={drivingCameraMode}
              onDrivingCameraModeChange={setDrivingCameraMode}
              touchInput={touchInput}
              onVehicleStatsUpdate={setVehicleStats}
              onExitDrivingMode={() => setIsDrivingMode(false)}
              isWalkingMode={isWalkingMode}
              walkingCameraMode={walkingCameraMode}
              onWalkingCameraModeChange={setWalkingCameraMode}
              onWalkerStatsUpdate={setWalkerStats}
              onExitWalkingMode={() => setIsWalkingMode(false)}
              isCinematicMode={isCinematicMode}
              cinematicTourType={cinematicTourType}
              cinematicSpeed={cinematicSpeed}
              onExitCinematicMode={() => setIsCinematicMode(false)}
            />

            {/* Floating Island Exploration Launcher Buttons (Bottom Right) */}
            {!isDrivingMode && !isWalkingMode && !isCinematicMode && !activeTab && (
              <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2 sm:gap-2.5">
                {/* 1. Cinematic Auto-Camera Tour Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCinematicMode(true);
                    setIsCinematicUiHidden(false);
                  }}
                  title={lang === 'tr' ? 'Sinematik Kamera Turu (Ekran Koruyucu Modu)' : 'Cinematic Island Tour (Screensaver Mode)'}
                  className="w-12 h-12 sm:w-13 sm:h-13 bg-slate-900/90 hover:bg-amber-950/90 text-amber-400 hover:text-amber-300 border border-amber-500/50 hover:border-amber-400 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group cursor-pointer"
                >
                  <Film className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                </button>

                {/* 2. Pedestrian Walking & Sprint Exploration Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setIsWalkingMode(true);
                    setWalkingCameraMode('chase');
                  }}
                  title={lang === 'tr' ? 'Yaya Keşif / Yürüme Modu (Adayı Keşfet)' : 'Walking Exploration Mode (Explore Island)'}
                  className="w-12 h-12 sm:w-13 sm:h-13 bg-slate-900/90 hover:bg-cyan-950/90 text-cyan-400 hover:text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group cursor-pointer"
                >
                  <Footprints className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                {/* 3. Drivable Buggy Exploration Mode */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDrivingMode(true);
                    setDrivingCameraMode('cockpit'); // Starts inside vehicle view as requested
                  }}
                  title={lang === 'tr' ? 'Araç Sürüş Modu (Adayı Keşfet)' : 'Drive Buggy Mode (Explore Island)'}
                  className="w-12 h-12 sm:w-13 sm:h-13 bg-slate-900/90 hover:bg-emerald-950/90 text-emerald-400 hover:text-emerald-300 border border-emerald-500/50 hover:border-emerald-400 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group cursor-pointer"
                >
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 group-hover:rotate-6 transition-transform" />
                </button>
              </div>
            )}

            {/* Active Driving Telemetry, Camera Switcher & Mobile Controls HUD */}
            {isDrivingMode && (
              <DriveOverlay
                stats={vehicleStats}
                cameraMode={drivingCameraMode}
                onCameraModeChange={setDrivingCameraMode}
                onTouchInputChange={(input) => setTouchInput((prev) => ({ ...prev, ...input }))}
                onExit={() => setIsDrivingMode(false)}
                lang={lang}
              />
            )}

            {/* Active Pedestrian Walking Telemetry & Controls HUD */}
            {isWalkingMode && (
              <WalkOverlay
                stats={walkerStats}
                cameraMode={walkingCameraMode}
                onCameraModeChange={setWalkingCameraMode}
                onTouchInputChange={(input) => setTouchInput((prev) => ({ ...prev, ...input }))}
                onExit={() => setIsWalkingMode(false)}
                lang={lang}
              />
            )}

            {/* Active Cinematic Camera Tour Director HUD */}
            {isCinematicMode && (
              <CinematicOverlay
                tourType={cinematicTourType}
                onTourTypeChange={setCinematicTourType}
                speedMultiplier={cinematicSpeed}
                onSpeedChange={setCinematicSpeed}
                isUiHidden={isCinematicUiHidden}
                onToggleHideUi={() => setIsCinematicUiHidden((prev) => !prev)}
                onExit={() => setIsCinematicMode(false)}
                lang={lang}
              />
            )}
          </div>

          {/* Floating Modal Over Live 3D Map for Management Panels */}
          {activeTab && ['shop', 'sites', 'plants', 'battery', 'finance', 'market', 'leaderboard', 'settings'].includes(activeTab) && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-150"
              onClick={(e) => {
                // Click outside modal card to close
                if (e.target === e.currentTarget) {
                  setActiveTab(null);
                }
              }}
            >
              <div
                className="bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-150 relative text-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      {activeTab === 'shop' && <ShoppingBag className="w-4 h-4" />}
                      {activeTab === 'sites' && <Globe className="w-4 h-4" />}
                      {activeTab === 'plants' && <Factory className="w-4 h-4" />}
                      {activeTab === 'battery' && <BatteryCharging className="w-4 h-4" />}
                      {activeTab === 'finance' && <Landmark className="w-4 h-4" />}
                      {activeTab === 'market' && <BarChart3 className="w-4 h-4" />}
                      {activeTab === 'leaderboard' && <Trophy className="w-4 h-4" />}
                      {activeTab === 'settings' && <Settings className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                        {activeTab === 'shop' && (lang === 'tr' ? 'Ekipman Mağazası' : 'Equipment Shop')}
                        {activeTab === 'sites' && (lang === 'tr' ? 'Yatırım Arazileri & Sahalar' : 'Investment Sites')}
                        {activeTab === 'plants' && (lang === 'tr' ? 'Santrallerim & Tesis Yönetimi' : 'My Power Plants')}
                        {activeTab === 'battery' && (lang === 'tr' ? 'Batarya Depolama & Akıllı Arbitraj' : 'Battery & Smart Arbitrage')}
                        {activeTab === 'finance' && (lang === 'tr' ? 'Finans & Kredi Yönetimi' : 'Finance & Bank Loans')}
                        {activeTab === 'market' && (lang === 'tr' ? 'Elektrik Spot Piyasası' : 'Electricity Market')}
                        {activeTab === 'leaderboard' && (lang === 'tr' ? 'Liderlik Sıralaması' : 'Leaderboard')}
                        {activeTab === 'settings' && (lang === 'tr' ? 'Oyun & Grafik Ayarları' : 'Settings')}
                      </h3>
                      <span className="text-[10px] text-slate-400">Energy Tycoon Yönetim Paneli</span>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setActiveTab(null)}
                    title={lang === 'tr' ? 'Kapat (ESC veya Dışarı Tıklayın)' : 'Close (ESC or click outside)'}
                    className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 scrollbar-thin">
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

                  {activeTab === 'battery' && (
                    <BatteryPanel
                      batterySettings={gameState.batterySettings}
                      companySites={gameState.companySites}
                      installedAssets={gameState.installedAssets}
                      priceChart={gameState.priceChart}
                      spotPrice={gameState.spotPrice}
                      clock={gameState.clock}
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

                  {activeTab === 'market' && (
                    <MarketPanel
                      spotPrice={gameState.spotPrice}
                      priceChart={gameState.priceChart}
                      clock={gameState.clock}
                      lang={lang}
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
              </div>
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
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${inspectedSite.region_type === 'wind'
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
            finance={gameState.finance}
            lang={lang}
          />

          {/* Leaderboard & Company Profile Modal (Triggered by clicking company avatar / level in HUD) */}
          <LeaderboardModal
            isOpen={isLeaderboardOpen}
            onClose={() => setIsLeaderboardOpen(false)}
            company={gameState.company}
            leaderboard={gameState.leaderboard}
            finance={gameState.finance}
            totalCapacityKw={gameState.totalCapacityKw}
            mySites={mySites}
            lang={lang}
          />

          {/* Electricity Market & Spot Chart Modal (Triggered by clicking spot price pill in HUD) */}
          <MarketModal
            isOpen={isMarketOpen}
            onClose={() => setIsMarketOpen(false)}
            spotPrice={gameState.spotPrice}
            priceChart={gameState.priceChart}
            clock={gameState.clock}
            lang={lang}
          />
        </main>
      </div>
    </CurrencyProvider>
  );
}
