'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  Crown,
  X,
  Zap,
  DollarSign,
  Factory,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Eye,
  MapPin
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

export default function LeaderboardModal({
  isOpen,
  onClose,
  company,
  leaderboard = [],
  finance = {},
  totalCapacityKw = 0,
  mySites = [],
  lang = 'tr'
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatMoney } = useCurrency();

  // XP & Level calculations
  const currentXp = Number(company?.xp || 0);
  const currentLevel = Number(company?.level || 1);
  const xpInCurrentLevel = currentXp % 1000;
  const xpProgressPct = Math.min(100, (xpInCurrentLevel / 1000) * 100);
  const xpRemaining = 1000 - xpInCurrentLevel;

  // Find user rank in leaderboard
  const userRank = useMemo(() => {
    if (!company?.id || !leaderboard.length) return 1;
    const idx = leaderboard.findIndex((c) => c.id === company.id);
    return idx !== -1 ? idx + 1 : '-';
  }, [company?.id, leaderboard]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 modal-backdrop-safe"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => {
        e.stopPropagation();
        if (e.ctrlKey) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 modal-content-safe"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation();
          if (e.ctrlKey) e.preventDefault();
        }}
      >
        {/* MODAL HEADER */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2 flex-wrap">
                <span>{lang === 'tr' ? 'Liderlik Sıralaması & Şirket Profili' : 'Leaderboard & Company Profile'}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/80 shrink-0">
                  {lang === 'tr' ? `Sıra #${userRank}` : `Rank #${userRank}`}
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-400 mt-0.5">
                {lang === 'tr'
                  ? 'Küresel enerji piyasası sıralaması, şirketinizin seviyesi ve piyasa gücü.'
                  : 'Global energy tycoon ranking, company level and market influence.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Kapat"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
          {/* COMPANY PROFILE & LEVEL CARD */}
          <div className="bg-gradient-to-br from-slate-950/80 via-slate-900 to-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              {/* Left Identity */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl text-emerald-400">
                      {(company?.name || 'E').slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full shadow border border-amber-300">
                    Lv.{currentLevel}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-white tracking-wide">
                      {company?.name || 'Enerji Şirketi'}
                    </h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {lang === 'tr' ? 'Onaylı Şirket' : 'Verified'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Award className="w-3.5 h-3.5" />
                      Seviye {currentLevel}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-300">
                      Toplam {currentXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="flex-1 md:max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {lang === 'tr' ? 'Seviye İlerlemesi' : 'Level Progress'}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {xpInCurrentLevel} / 1,000 XP ({xpProgressPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${xpProgressPct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  {lang === 'tr'
                    ? `Seviye ${currentLevel + 1} için ${xpRemaining} XP gerekli`
                    : `${xpRemaining} XP needed for Level ${currentLevel + 1}`}
                </div>
              </div>
            </div>

            {/* 4 Key Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === 'tr' ? 'Küresel Sıra' : 'Global Rank'}
                  </div>
                  <div className="text-sm font-black text-amber-300 font-mono">
                    #{userRank}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === 'tr' ? 'Şirket Değeri' : 'Net Worth'}
                  </div>
                  <div className="text-sm font-black text-emerald-400 font-mono truncate">
                    {formatMoney(finance?.netWorth ?? company?.cash ?? 0, { decimals: 0 })}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === 'tr' ? 'Kurulu Güç' : 'Total Capacity'}
                  </div>
                  <div className="text-sm font-black text-cyan-300 font-mono">
                    {(totalCapacityKw / 1000).toFixed(1)} MW
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <Factory className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    {lang === 'tr' ? 'Aktif Tesisler' : 'Active Plants'}
                  </div>
                  <div className="text-sm font-black text-purple-300 font-mono">
                    {mySites.length} {lang === 'tr' ? 'Santral' : 'Sites'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GLOBAL LEADERBOARD TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                  {lang === 'tr' ? 'Küresel Şirket Sıralaması' : 'Global Tycoon Rankings'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {leaderboard.length} {lang === 'tr' ? 'Şirket Listeleniyor' : 'Companies'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 w-14 text-center">{dict.leaderboard.rank}</th>
                    <th className="py-3 px-4">{dict.leaderboard.company}</th>
                    <th className="py-3 px-3 text-center">{dict.leaderboard.level}</th>
                    <th className="py-3 px-4 text-right">Şirket Değeri (Net Varlık)</th>
                    <th className="py-3 px-4 text-center w-36">Harita & Keşif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        {lang === 'tr' ? 'Henüz sıralama verisi bulunmuyor.' : 'No leaderboard data available.'}
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((comp, idx) => {
                      const rank = idx + 1;
                      const isMe = comp.id === company?.id;

                      const rankIcon =
                        rank === 1 ? (
                          <Crown className="w-4 h-4 text-amber-400 mx-auto" />
                        ) : rank === 2 ? (
                          <Trophy className="w-4 h-4 text-slate-300 mx-auto" />
                        ) : rank === 3 ? (
                          <Trophy className="w-4 h-4 text-amber-600 mx-auto" />
                        ) : (
                          <span className="font-mono text-sm text-slate-400 font-bold">
                            {rank}
                          </span>
                        );

                      return (
                        <tr
                          key={comp.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-emerald-950/30 hover:bg-emerald-950/40 border-l-4 border-l-emerald-500'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center">
                            {rankIcon}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              <span>{comp.name}</span>
                              {isMe && (
                                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
                                  SİZ
                                </span>
                              )}
                            </div>
                            {comp.siteCount !== undefined && (
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center gap-1.5">
                                <span className="text-slate-400">
                                  {comp.siteCount || 0} Saha • {comp.assetCount || 0} Ünite
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px]">
                              <Award className="w-3 h-3 text-amber-400" />
                              Lv.{comp.level}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                              {formatMoney(comp.netWorth ?? comp.cash, { decimals: 0 })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Kasa: {formatMoney(comp.cash, { decimals: 0 })}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isMe ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-1 rounded-xl">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>Kendi Haritanız</span>
                              </span>
                            ) : (
                              <Link
                                href={`/game?guest=true&companyId=${comp.id}`}
                                onClick={() => onClose?.()}
                                title={`${comp.name} arazisini ve santrallerini 3D haritada ziyaret et`}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 active:scale-95 transition-all cursor-pointer group"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform" />
                                <span>Haritayı Gör</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

