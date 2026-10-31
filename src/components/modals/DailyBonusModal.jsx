'use client';

import React, { useState } from 'react';
import {
  X,
  Flame,
  Gift,
  CheckCircle2,
  Lock,
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Lightbulb,
  Clock
} from 'lucide-react';
import { getDailyStreakInfo, DAILY_BONUS_MOTTO } from '@/lib/simulation/dailyBonus';
import { useCurrency } from '@/context/CurrencyContext';

export default function DailyBonusModal({
  isOpen = false,
  onClose = () => {},
  company = null,
  onBonusClaimed = () => {},
  onOpenGuide = null,
  lang = 'tr'
}) {
  const [loading, setLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { formatMoney } = useCurrency();

  if (!isOpen) return null;

  const streakInfo = getDailyStreakInfo(company);
  const { isClaimedToday, currentStreak, nextStreak, targetDay, reward, schedule } = streakInfo;

  const handleClaim = async () => {
    if (loading || isClaimedToday) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLAIM_DAILY_BONUS',
          payload: { clientDateStr: streakInfo.todayStr }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ödül alınırken bir hata oluştu.');
      }

      setClaimSuccess(data);
      if (onBonusClaimed) {
        onBonusClaimed(data);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glowing Ambient Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 flex items-start justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {lang === 'tr' ? 'Günlük Giriş Bonusu' : 'Daily Login Streak'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {currentStreak > 0 ? `${currentStreak} ${lang === 'tr' ? 'Gün' : 'Days'}` : (lang === 'tr' ? 'Yeni Başlangıç' : 'New Start')}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 font-medium mt-0.5">
                {lang === 'tr' ? DAILY_BONUS_MOTTO.tr : DAILY_BONUS_MOTTO.en}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Claim Success Celebration Banner */}
          {claimSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 flex items-center gap-3 animate-in zoom-in-95 duration-150">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs leading-relaxed">
                <strong className="text-emerald-300 font-bold block text-sm">
                  {lang === 'tr' ? 'Ödül Kasanıza Eklendi! 🎉' : 'Reward Claimed! 🎉'}
                </strong>
                <span>
                  {lang === 'tr'
                    ? `Kasanıza +${formatMoney(claimSuccess.reward?.cash || 0, { decimals: 0 })} ve +${claimSuccess.reward?.xp || 0} XP aktarıldı. Yarın serinizi devam ettirmeyi unutmayın!`
                    : `+${formatMoney(claimSuccess.reward?.cash || 0, { decimals: 0 })} and +${claimSuccess.reward?.xp || 0} XP added. Keep your streak alive tomorrow!`}
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs">
              {errorMessage}
            </div>
          )}

          {/* 7-Day Interactive Progress Track */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-orange-400" />
                {lang === 'tr' ? '7 Günlük Teşvik Takvimi' : '7-Day Reward Track'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {lang === 'tr' ? `Hedef: Gün ${targetDay}/7` : `Target: Day ${targetDay}/7`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {schedule.map((item) => {
                const isDayClaimed = item.isClaimed;
                const isTargetToday = item.isCurrent && !isClaimedToday;
                const isClaimedTodayItem = item.isCurrent && isClaimedToday;

                return (
                  <div
                    key={`reward_day_${item.day}`}
                    className={`relative rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all border ${
                      item.day === 7
                        ? isTargetToday
                          ? 'col-span-2 sm:col-span-1 bg-gradient-to-b from-amber-950/90 to-orange-950/90 border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-500/20 scale-102'
                          : 'col-span-2 sm:col-span-1 bg-amber-950/40 border-amber-500/30 text-amber-200'
                        : isTargetToday
                        ? 'bg-slate-800/95 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xl shadow-emerald-500/10 scale-102'
                        : isDayClaimed
                        ? 'bg-slate-950/60 border-slate-800 opacity-70'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {lang === 'tr' ? `${item.day}. Gün` : `Day ${item.day}`}
                      </span>
                      {isDayClaimed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isTargetToday ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                      )}
                    </div>

                    {/* Reward Icon */}
                    <div className="my-1">
                      {item.isMega ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Trophy className="w-4 h-4 animate-bounce" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Reward Cash */}
                    <span
                      className={`font-mono font-extrabold text-xs sm:text-sm ${
                        item.isMega
                          ? 'text-amber-300'
                          : isTargetToday
                          ? 'text-emerald-300'
                          : isDayClaimed
                          ? 'text-slate-500 line-through'
                          : 'text-slate-200'
                      }`}
                    >
                      {formatMoney(item.cash, { decimals: 0 })}
                    </span>

                    {/* XP Tag */}
                    <span className="text-[9px] font-mono text-cyan-400/90 mt-0.5">
                      +{item.xp} XP
                    </span>

                    {/* Mega Badge */}
                    {item.isMega && (
                      <span className="mt-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        MEGA
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Reward Details Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950/80 to-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isClaimedToday
                    ? (lang === 'tr' ? 'Bugünkü Ödülünüz Alındı' : 'Today’s Reward Claimed')
                    : (lang === 'tr' ? `Bugünün Ödülü (${targetDay}. Gün)` : `Today’s Reward (Day ${targetDay})`)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {lang === 'tr' ? reward.titleTr : reward.titleEn}
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                {lang === 'tr' ? reward.descriptionTr : reward.descriptionEn}
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-end shrink-0 gap-1">
              <div className="flex items-baseline gap-1 font-mono text-2xl font-black text-emerald-400">
                <span>+{formatMoney(reward.cash, { decimals: 0 })}</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300">
                +{reward.xp} XP Teşviki
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-4 sm:p-6 pt-3 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Investment Guide Shortcut */}
          {onOpenGuide ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGuide();
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'tr' ? 'Kasayı nasıl 10x büyütürüm? (Yatırım İpuçları)' : 'How to 10x my cash? (Investment Guide)'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <div />
          )}

          {/* Claim Action Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isClaimedToday ? (
              <button
                type="button"
                onClick={handleClaim}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Gift className="w-4 h-4 fill-slate-950" />
                <span>
                  {loading
                    ? (lang === 'tr' ? 'Aktarılıyor...' : 'Claiming...')
                    : (lang === 'tr' ? `Ödülü Al (+${formatMoney(reward.cash, { decimals: 0 })})` : `Claim Reward (+${formatMoney(reward.cash, { decimals: 0 })})`)}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-semibold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{lang === 'tr' ? 'Bugünkü ödül alındı! Sıradaki bonus yarın hazır.' : 'Claimed for today! Next reward unlocks tomorrow.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

