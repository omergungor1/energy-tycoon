'use client';

import React from 'react';
import { Trophy, Award, Crown } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export default function LeaderboardPanel({ leaderboard = [], lang }) {
  const dict = dictionaries[lang] || dictionaries.tr;

  return (
    <div className="p-6 max-w-4xl mx-auto text-slate-100">
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          {dict.leaderboard.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{dict.leaderboard.subtitle}</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-md overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-16 text-center">{dict.leaderboard.rank}</th>
              <th className="py-3.5 px-4">{dict.leaderboard.company}</th>
              <th className="py-3.5 px-4">{dict.leaderboard.level}</th>
              <th className="py-3.5 px-4 text-right">Kasa / Değer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  Henüz sıralama verisi bulunmuyor.
                </td>
              </tr>
            ) : (
              leaderboard.map((comp, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                const rankBadge =
                  rank === 1
                    ? 'text-amber-300 font-extrabold'
                    : rank === 2
                    ? 'text-slate-300 font-extrabold'
                    : rank === 3
                    ? 'text-amber-600 font-extrabold'
                    : 'text-slate-400';

                return (
                  <tr key={comp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      {rank === 1 ? (
                        <Crown className="w-4 h-4 text-amber-400 mx-auto" />
                      ) : (
                        <span className={`font-mono text-sm ${rankBadge}`}>{rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <span>{comp.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[11px]">
                        <Award className="w-3 h-3" />
                        Lv.{comp.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-300">
                      ${Number(comp.cash).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

