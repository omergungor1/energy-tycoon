'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Crown,
  Award,
  Car,
  MapPin,
  TrendingUp,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Wind,
  Sun,
  Flame,
  CheckCircle2
} from 'lucide-react';

function formatCurrency(val) {
  const num = Number(val || 0);
  return '$' + Math.round(num).toLocaleString('en-US');
}

export default function AuthLeaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchLeaders() {
      try {
        const res = await fetch('/api/game/leaderboard');
        if (!res.ok) throw new Error('Sıralama yüklenemedi');
        const data = await res.json();
        if (isMounted) {
          setLeaders(data.leaderboard || []);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchLeaders();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Decorative ambient background accents */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Liderlik Sıralaması
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Top 5 Oyuncu
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simülasyondaki en başarılı gerçek enerji şirketleri
              </p>
            </div>
          </div>
        </div>

        {/* Guest Mode Explanatory Banner */}
        <div className="mt-3.5 p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] sm:text-xs text-slate-300 flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Car className="w-3.5 h-3.5" />
          </div>
          <div className="leading-relaxed">
            <strong className="text-emerald-300 font-semibold">Giriş Yapmadan Ziyaret Edin:</strong>{' '}
            İstediğiniz şirketi seçip <span className="text-white font-medium">Misafir Modu</span> ile arazisinde araba sürerek dolaşabilir, santrallerini 3D keşfedebilirsiniz.
          </div>
        </div>
      </div>

      {/* Leaderboard List / Cards */}
      <div className="relative z-10 space-y-3 flex-1 overflow-y-auto max-h-[380px] sm:max-h-[460px] pr-1 scrollbar-thin">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-7 h-7 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Sıralama yükleniyor...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Sıralama bilgisi şu an güncelleniyor.
          </div>
        ) : leaders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Henüz liderlik tablosunda kayıtlı şirket bulunmuyor.
          </div>
        ) : (
          leaders.map((comp, idx) => {
            const rank = idx + 1;
            const isFirst = rank === 1;
            const isSecond = rank === 2;
            const isThird = rank === 3;

            return (
              <div
                key={comp.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all relative group ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 border-amber-500/40 hover:border-amber-400 shadow-lg shadow-amber-950/20'
                    : isSecond
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                    : isThird
                    ? 'bg-slate-900/80 border-amber-800/40 hover:border-amber-700/60'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Rank & Company Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                        isFirst
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-md'
                          : isSecond
                          ? 'bg-slate-300/15 text-slate-200 border-slate-300/30'
                          : isThird
                          ? 'bg-amber-700/20 text-amber-400 border-amber-600/30'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isFirst ? <Crown className="w-5 h-5 text-amber-400" /> : `#${rank}`}
                    </div>

                    {/* Company Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-white truncate">
                          {comp.name}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.2 rounded-full text-[10px]">
                          <Award className="w-3 h-3" />
                          Lv.{comp.level}
                        </span>
                      </div>

                      {/* Primary Site & Region Badge */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          {comp.primarySite?.name || 'Ana Saha'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">
                          {comp.assetCount || 1} Ünite Santral
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Financials & Guest View CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        Şirket Değeri
                      </div>
                      <div className="font-mono font-black text-sm sm:text-base text-emerald-400">
                        {formatCurrency(comp.netWorth || comp.cash)}
                      </div>
                    </div>

                    {/* "Misafir Modda Görüntüle" Button */}
                    <Link
                      href={`/game?guest=true&companyId=${comp.id}`}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 group-hover:scale-105"
                      title={`${comp.name} arazisini misafir olarak araba ile keşfet`}
                    >
                      <Car className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Misafir Modda Görüntüle</span>
                      <ArrowRight className="w-3 h-3 text-cyan-200 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Conversion Prompt */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 relative z-10 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Misafir modunda hiçbir üyelik veya indirme gerekmez</span>
        </div>
        <span className="hidden sm:inline font-mono text-slate-500">v2.4 Live Island</span>
      </div>
    </div>
  );
}

