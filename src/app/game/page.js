'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import TopHud from '@/components/ui/TopHud';
import GuestHud from '@/components/ui/GuestHud';
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
import DailyBonusModal from '@/components/modals/DailyBonusModal';
import InvestmentGuideModal from '@/components/modals/InvestmentGuideModal';
import { getDailyStreakInfo } from '@/lib/simulation/dailyBonus';
import DriveOverlay from '@/components/ui/DriveOverlay';
import WalkOverlay from '@/components/ui/WalkOverlay';
import CinematicOverlay from '@/components/ui/CinematicOverlay';
import { CurrencyProvider } from '@/context/CurrencyContext';
import ambientMusic from '@/lib/audio/ambientMusic';
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
  Settings,
  LogOut,
  Sparkles,
  CheckCircle2,
  Cpu,
  HardHat,
  Clock,
  Zap
} from 'lucide-react';

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuestMode = searchParams.get('guest') === 'true';
  const guestCompanyId = searchParams.get('companyId');

  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [lang, setLang] = useState('tr');
  const [inspectedSite, setInspectedSite] = useState(null);
  const [shopInitialSiteId, setShopInitialSiteId] = useState(null);
  const [shopInitialType, setShopInitialType] = useState(null);
  const [focusedSite, setFocusedSite] = useState(null);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const hasAutoPromptedBonus = useRef(false);
  const hasAutoSpawnedGuest = useRef(false);
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
  const [cinematicTourType, setCinematicTourType] = useState('grand');
  const [cinematicSpeed, setCinematicSpeed] = useState(1.0);
  const [isCinematicUiHidden, setIsCinematicUiHidden] = useState(false);

  const [touchInput, setTouchInput] = useState({});

  const handleTouchInputChange = useCallback((input) => {
    setTouchInput((prev) => {
      let changed = false;
      for (const key in input) {
        if (prev[key] !== input[key]) {
          changed = true;
          break;
        }
      }
      return changed ? { ...prev, ...input } : prev;
    });
  }, []);

  // Auto-prompt Daily Login Bonus once per session if unclaimed today (only for logged-in players)
  useEffect(() => {
    if (isGuestMode) return;
    if (gameState?.company && !hasAutoPromptedBonus.current) {
      hasAutoPromptedBonus.current = true;
      const info = getDailyStreakInfo(gameState.company);
      if (info.canClaim) {
        setIsDailyBonusOpen(true);
      }
    }
  }, [isGuestMode, gameState?.company]);

  // In Guest Mode, automatically spawn directly into the vehicle on the player's site
  useEffect(() => {
    if (isGuestMode && gameState && !hasAutoSpawnedGuest.current) {
      hasAutoSpawnedGuest.current = true;
      setIsDrivingMode(true);
      setDrivingCameraMode('cockpit');
    }
  }, [isGuestMode, gameState]);

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
        const parsed = JSON.parse(saved);
        const hasCustomizedMarkers = parsed.markers_configured === true;
        setSettings((prev) => ({
          ...DEFAULT_SETTINGS,
          ...prev,
          ...parsed,
          showSiteBoundaries: false, // Closed by default upon entering the game as requested
          showSiteLabels: false, // Closed by default upon entering the game as requested
          bgMusicVolume: typeof parsed.bgMusicVolume === 'number' ? parsed.bgMusicVolume : 0.65,
          bgMusicEnabled: parsed.bgMusicEnabled !== undefined ? parsed.bgMusicEnabled : true
        }));
      }
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }, []);

  const handleUpdateSettings = (newSettings) => {
    const toSave = { ...newSettings, markers_configured: true };
    setSettings(toSave);
    try {
      localStorage.setItem('energy_tycoon_settings', JSON.stringify(toSave));
    } catch (e) {
      console.error('Settings save error:', e);
    }
  };

  // Synchronize background music with user settings
  useEffect(() => {
    if (typeof window === 'undefined') return;
    ambientMusic.setMusicEnabled(settings.bgMusicEnabled !== false);
    ambientMusic.setMusicVolume(typeof settings.bgMusicVolume === 'number' ? settings.bgMusicVolume : 0.65);
  }, [settings.bgMusicEnabled, settings.bgMusicVolume]);

  // Synchronize night mode with ambient music engine
  useEffect(() => {
    if (typeof window === 'undefined' || !gameState?.clock) return;
    ambientMusic.setMusicNightMode(gameState.clock.isNight ?? false);
  }, [gameState?.clock?.isNight]);

  // Unlock browser audio context on first user interaction (click/touch/key)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUnlockAudio = () => {
      if (settings.bgMusicEnabled ?? true) {
        ambientMusic.resumeIfEnabled();
      }
    };

    window.addEventListener('click', handleUnlockAudio, { once: true });
    window.addEventListener('pointerdown', handleUnlockAudio, { once: true });
    window.addEventListener('keydown', handleUnlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', handleUnlockAudio);
      window.removeEventListener('pointerdown', handleUnlockAudio);
      window.removeEventListener('keydown', handleUnlockAudio);
    };
  }, [settings.bgMusicEnabled]);

  // Fetch or refresh game state (supports both Guest Mode public state and authenticated state)
  const fetchGameState = useCallback(async () => {
    try {
      if (isGuestMode) {
        const query = guestCompanyId ? `?companyId=${encodeURIComponent(guestCompanyId)}` : '';
        const res = await fetch(`/api/game/public-state${query}`);
        if (!res.ok) throw new Error('Misafir simülasyon verisi yüklenemedi.');
        const data = await res.json();
        setGameState(data);
      } else {
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
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router, isGuestMode, guestCompanyId]);

  useEffect(() => {
    fetchGameState();

    // Regular interval to refresh clock, prices and production settlements
    const interval = setInterval(() => {
      fetchGameState();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchGameState]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const handleExitGuest = () => {
    router.push('/login');
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
          {isGuestMode ? 'Misafir Keşif Dünyası Hazırlanıyor...' : 'Simülasyon Dünyası Yükleniyor...'}
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl max-w-md text-center">
          <p className="text-red-400 font-semibold mb-4">{error || 'Bağlantı kurulamadı'}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setLoading(true);
                fetchGameState();
              }}
              className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              Tekrar Dene
            </button>
            {isGuestMode && (
              <button
                onClick={handleExitGuest}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Giriş Sayfasına Dön
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const initialSpawnCoordinates = gameState.spawnCoordinates || (mySites[0] ? [mySites[0].centerX, mySites[0].centerZ] : [-450, -320]);

  return (
    <CurrencyProvider>
      <div className="w-screen h-screen bg-slate-950 overflow-hidden relative font-sans select-none">
        {/* Top HUD (Rendered when NOT in vehicle driving/walking mode, and NOT in cinematic tour mode) */}
        {!isDrivingMode && !isWalkingMode && !isCinematicMode && (
          isGuestMode ? (
            <GuestHud
              company={gameState.company}
              finance={gameState.finance}
              playerDay={gameState.playerDay || 1}
              clock={gameState.clock}
              onExitGuestMode={handleExitGuest}
            />
          ) : (
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
              onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
              mySites={mySites}
              focusedSite={focusedSite}
              onFocusPlant={handleFocusPlant}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )
        )}

        {/* Floating Quick Exit Guest Button while driving or walking */}
        {isGuestMode && (isDrivingMode || isWalkingMode) && (
          <div className="fixed top-3 right-3 z-50 pointer-events-auto">
            <button
              type="button"
              onClick={handleExitGuest}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-red-950/90 border border-slate-700/80 hover:border-red-500/50 text-slate-200 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-xl shadow-2xl active:scale-95 transition-all cursor-pointer"
              title="Misafir Modundan Çık ve Giriş Sayfasına Dön"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Misafir Modundan Çık</span>
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`w-full h-full pb-0 relative ${isDrivingMode || isWalkingMode || isCinematicMode ? 'pt-0' : isGuestMode ? 'pt-16 sm:pt-18' : 'pt-14 sm:pt-16'}`}>
          {/* 3D Map View: Always mounted, active, and alive in the background */}
          <div className="w-full h-full block">
            <WorldCanvas
              worldSites={gameState.worldSites}
              companySites={gameState.companySites}
              installedAssets={gameState.installedAssets}
              clock={gameState.clock}
              settings={settings}
              focusedSite={focusedSite}
              initialSpawnCoords={initialSpawnCoordinates}
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
                    setDrivingCameraMode('cockpit');
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
                onTouchInputChange={handleTouchInputChange}
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
                onTouchInputChange={handleTouchInputChange}
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
                onExit={() => setIsCinematicMode(false)}
                lang={lang}
              />
            )}
          </div>

          {/* Floating Modal Over Live 3D Map for Management Panels (Only for logged-in players) */}
          {!isGuestMode && activeTab && ['shop', 'sites', 'plants', 'battery', 'finance', 'market', 'leaderboard', 'settings'].includes(activeTab) && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-150"
              onClick={(e) => {
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
                      initialSiteId={shopInitialSiteId}
                      initialType={shopInitialType}
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
                      clock={gameState.clock}
                      lang={lang}
                      onActionSuccess={fetchGameState}
                      onNavigateToShop={(siteId, siteType) => {
                        setShopInitialSiteId(siteId);
                        if (siteType === 'solar') setShopInitialType('solar_pack');
                        else if (siteType === 'wind') setShopInitialType('wind_turbine');
                        setActiveTab('shop');
                      }}
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
          {inspectedSite && (() => {
            const companySite = gameState?.companySites?.find((cs) => cs.site_id === inspectedSite.id);
            const siteAssets = companySite
              ? (gameState?.installedAssets || []).filter((a) => a.company_site_id === companySite.id)
              : [];

            const siteTotalCapacityKw = siteAssets.reduce((sum, a) => {
              if (a.equipment_catalog?.equipment_type !== 'battery') {
                return sum + Number(a.equipment_catalog?.capacity_kw || 0);
              }
              return sum;
            }, 0);

            const underConstructionCount = siteAssets.filter((a) => {
              const isConstructionType = ['wind_turbine', 'solar_pack'].includes(a.equipment_catalog?.equipment_type);
              const elapsedHours = Math.max(0, (Number(gameState?.clock?.gameHour) || 0) - Number(a.installed_game_hour || 0));
              return isConstructionType && elapsedHours < 168;
            }).length;

            return (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setInspectedSite(null);
                }}
              >
                <div
                  className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl relative text-slate-100 backdrop-blur-xl animate-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setInspectedSite(null)}
                    title={lang === 'tr' ? 'Kapat (ESC)' : 'Close (ESC)'}
                    className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Header: Plant / Site Name & Badges */}
                  <div className="pr-10 mb-3 shrink-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-emerald-500/30">
                        #{inspectedSite.id}
                      </span>
                      <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                        {companySite?.plant_name || inspectedSite.name}
                      </h3>

                      {/* Region Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          inspectedSite.region_type === 'wind'
                            ? 'text-sky-300 bg-sky-950/70 border-sky-600/50'
                            : inspectedSite.region_type === 'solar'
                              ? 'text-amber-300 bg-amber-950/70 border-amber-600/50'
                              : 'text-purple-300 bg-purple-950/70 border-purple-600/50'
                        }`}
                      >
                        {inspectedSite.region_type === 'wind' && <Wind className="w-3 h-3 text-sky-400" />}
                        {inspectedSite.region_type === 'solar' && <Sun className="w-3 h-3 text-amber-400" />}
                        {inspectedSite.region_type === 'hybrid' && (
                          <span className="flex items-center -space-x-1">
                            <Wind className="w-3 h-3 text-sky-400" />
                            <Sun className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                        <span>
                          {inspectedSite.region_type === 'wind' ? 'Rüzgâr' : inspectedSite.region_type === 'solar' ? 'Güneş' : 'Hibrit'}
                        </span>
                      </span>

                      {/* Ownership Badge */}
                      {companySite ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{companySite.lease_type === 'owned' ? 'Mülk' : 'Kiralık'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          <span>Boş Saha</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {inspectedSite.name} ({lang === 'tr' ? inspectedSite.description_tr : inspectedSite.description_en})
                    </p>
                  </div>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-4 gap-2 text-xs mb-3.5 shrink-0">
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Rüzgâr</span>
                      <strong className="text-sky-400 font-mono text-xs sm:text-sm">
                        %{(Number(inspectedSite.base_wind_potential) * 100).toFixed(0)}
                      </strong>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Güneş</span>
                      <strong className="text-amber-400 font-mono text-xs sm:text-sm">
                        %{(Number(inspectedSite.base_solar_potential) * 100).toFixed(0)}
                      </strong>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-center">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block truncate">Alan</span>
                      <strong className="text-slate-200 font-mono text-xs sm:text-sm">
                        {inspectedSite.area_hectares} Ha
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

                  {/* Attached Devices & Equipment List (User Core Feature!) */}
                  <div className="flex-1 overflow-hidden flex flex-col mb-3">
                    <div className="flex items-center justify-between mb-2 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                          Ekli Santral Cihazları ({siteAssets.length})
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {underConstructionCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>{underConstructionCount} Kurulumda</span>
                          </span>
                        )}
                        {companySite && !isGuestMode && (
                          <button
                            onClick={() => {
                              setShopInitialSiteId(companySite.id);
                              if (inspectedSite.region_type === 'solar') setShopInitialType('solar_pack');
                              else if (inspectedSite.region_type === 'wind') setShopInitialType('wind_turbine');
                              setInspectedSite(null);
                              setActiveTab('shop');
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 transition-all cursor-pointer"
                            title="Bu santrale yeni ekipman kur"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Ekipman Ekle</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {siteAssets.length > 0 ? (
                        siteAssets.map((asset) => {
                          const catalog = asset.equipment_catalog || {};
                          const isConstructionType = ['wind_turbine', 'solar_pack'].includes(catalog.equipment_type);
                          const currentHour = Number(gameState?.clock?.gameHour) || 0;
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
                                        Kalan Süre: <strong>{remainingDays > 0 ? `${remainingDays} Gün ${remHoursInDay} Saat` : `${remainingHours} Saat`}</strong>
                                      </span>
                                    </span>
                                    <span className="text-slate-500">1 Oyun Haftası</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                                  <span className="flex items-center gap-1 text-emerald-400/90">
                                    <Zap className="w-3 h-3 text-emerald-400" />
                                    <span>Şebekeye Kesintisiz Enerji Aktarılıyor</span>
                                  </span>
                                  <span className="font-mono text-slate-300">Sağlık: %{condition.toFixed(0)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : companySite ? (
                        <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-4 text-center">
                          <HardHat className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-70" />
                          <p className="text-xs text-slate-300 font-bold mb-1">Henüz Kurulu Cihaz Yok</p>
                          <p className="text-[11px] text-slate-400 mb-3">
                            Bu santral sahasına rüzgar türbini veya güneş paneli kurarak elektrik üretmeye başlayabilirsiniz.
                          </p>
                          <button
                            onClick={() => {
                              setShopInitialSiteId(companySite?.id || null);
                              if (inspectedSite.region_type === 'solar') setShopInitialType('solar_pack');
                              else if (inspectedSite.region_type === 'wind') setShopInitialType('wind_turbine');
                              setInspectedSite(null);
                              setActiveTab('shop');
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Ekipman Mağazası'nı Aç</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-4 text-center">
                          <Globe className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-70" />
                          <p className="text-xs text-slate-300 font-bold mb-1">Saha Portföyünüzde Değil</p>
                          <p className="text-[11px] text-slate-400">
                            Santral kurabilmek için önce bu araziyi kiralamanız veya satın almanız gerekmektedir.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex gap-2 shrink-0">
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
                            setShopInitialSiteId(companySite?.id || null);
                            if (inspectedSite.region_type === 'solar') setShopInitialType('solar_pack');
                            else if (inspectedSite.region_type === 'wind') setShopInitialType('wind_turbine');
                            setInspectedSite(null);
                            setActiveTab('shop');
                          }}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Ekipman Ekle (Mağaza)</span>
                        </button>
                        <button
                          onClick={() => {
                            setInspectedSite(null);
                            setActiveTab('plants');
                          }}
                          className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                          <Factory className="w-3.5 h-3.5 text-slate-400" />
                          <span>Santrallerim</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setInspectedSite(null);
                            setActiveTab('sites');
                          }}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Bu Sahayı Kirala veya Satın Al</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Treasury & Cash Flow Modal (Triggered by clicking cash pill in HUD) */}
          {!isGuestMode && (
            <TreasuryModal
              isOpen={isTreasuryOpen}
              onClose={() => setIsTreasuryOpen(false)}
              company={gameState.company}
              finance={gameState.finance}
              lang={lang}
            />
          )}

          {/* Leaderboard & Company Profile Modal (Triggered by clicking company avatar / level in HUD) */}
          {!isGuestMode && (
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
          )}

          {/* Electricity Market & Spot Chart Modal (Triggered by clicking spot price pill in HUD) */}
          {!isGuestMode && (
            <MarketModal
              isOpen={isMarketOpen}
              onClose={() => setIsMarketOpen(false)}
              spotPrice={gameState.spotPrice}
              priceChart={gameState.priceChart}
              clock={gameState.clock}
              lang={lang}
            />
          )}

          {/* Daily Login Streak & Bonus Modal (Only for registered logged-in players) */}
          {!isGuestMode && (
            <DailyBonusModal
              isOpen={isDailyBonusOpen}
              onClose={() => setIsDailyBonusOpen(false)}
              company={gameState.company}
              onBonusClaimed={() => {
                fetchGameState();
              }}
              onOpenGuide={() => {
                setIsDailyBonusOpen(false);
                setIsGuideOpen(true);
              }}
              lang={lang}
            />
          )}

          {/* Investment & Growth Strategy Guide Modal */}
          {!isGuestMode && (
            <InvestmentGuideModal
              isOpen={isGuideOpen}
              onClose={() => setIsGuideOpen(false)}
              lang={lang}
            />
          )}
        </main>
      </div>
    </CurrencyProvider>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <GameContent />
    </Suspense>
  );
}
