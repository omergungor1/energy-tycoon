'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Award, Crown, Eye, ShieldCheck } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

export default function LeaderboardPanel({ leaderboard = [], currentCompanyId, lang }) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatMoney } = useCurrency();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto text-slate-100">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          {dict.leaderboard.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{dict.leaderboard.subtitle}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider text-[11px]">
                <th className="py-3.5 px-3.5 w-14 text-center">{dict.leaderboard.rank}</th>
                <th className="py-3.5 px-4">{dict.leaderboard.company}</th>
                <th className="py-3.5 px-3 text-center">{dict.leaderboard.level}</th>
                <th className="py-3.5 px-4 text-right">Şirket Değeri (Net Varlık)</th>
                <th className="py-3.5 px-4 text-center w-36">Harita & Keşif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Henüz sıralama verisi bulunmuyor.
                  </td>
                </tr>
              ) : (
                leaderboard.map((comp, idx) => {
                  const rank = idx + 1;
                  const isMe = currentCompanyId && comp.id === currentCompanyId;
                  const rankBadge =
                    rank === 1
                      ? 'text-amber-300 font-extrabold'
                      : rank === 2
                      ? 'text-slate-300 font-extrabold'
                      : rank === 3
                      ? 'text-amber-600 font-extrabold'
                      : 'text-slate-400';

                  return (
                    <tr
                      key={comp.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isMe ? 'bg-emerald-950/30 hover:bg-emerald-950/40 border-l-4 border-l-emerald-500' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3.5 text-center">
                        {rank === 1 ? (
                          <Crown className="w-4 h-4 text-amber-400 mx-auto" />
                        ) : (
                          <span className={`font-mono text-sm ${rankBadge}`}>{rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span>{comp.name}</span>
                          {isMe && (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 tracking-wider">
                              SİZ
                            </span>
                          )}
                        </div>
                        {comp.siteCount !== undefined && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {comp.siteCount || 0} Saha • {comp.assetCount || 0} Ünite
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px]">
                          <Award className="w-3 h-3" />
                          Lv.{comp.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-emerald-400 text-xs sm:text-sm">
                          {formatMoney(comp.netWorth ?? comp.cash, { decimals: 0 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Kasa: {formatMoney(comp.cash, { decimals: 0 })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isMe ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-1 rounded-xl">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Kendi Haritanız</span>
                          </span>
                        ) : (
                          <Link
                            href={`/game?guest=true&companyId=${comp.id}`}
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
  );
}

