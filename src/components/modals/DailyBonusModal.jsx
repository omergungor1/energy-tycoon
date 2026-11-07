'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Gift,
  Check,
  CheckCircle2,
  Lock,
  Trophy,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  Lightbulb,
  Clock,
  Crown,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getDailyStreakInfo, DAILY_BONUS_MOTTO } from '@/lib/simulation/dailyBonus';
import { useCurrency } from '@/context/CurrencyContext';

// Multi-stage celebratory fireworks confetti burst
const triggerCelebrationConfetti = () => {
  if (typeof window === 'undefined') return;
  try {
    // Stage 1: Center blast
    confetti({
      particleCount: 75,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#06b6d4', '#6366f1'],
      zIndex: 99999
    });

    // Stage 2: Left & right angled cannons
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 65,
        origin: { x: 0.15, y: 0.65 },
        colors: ['#10b981', '#fbbf24', '#38bdf8', '#a855f7'],
        zIndex: 99999
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 65,
        origin: { x: 0.85, y: 0.65 },
        colors: ['#10b981', '#fbbf24', '#38bdf8', '#a855f7'],
        zIndex: 99999
      });
    }, 180);

    // Stage 3: Golden stars & sparkling rain
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 110,
        origin: { y: 0.45 },
        shapes: ['star', 'circle'],
        colors: ['#ffd700', '#f59e0b', '#10b981', '#ffffff'],
        scalar: 1.25,
        zIndex: 99999
      });
    }, 380);
  } catch (err) {
    console.warn('Confetti trigger error:', err);
  }
};

// Procedural Web Audio victory chime
const playCelebrationSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  } catch {
    // Audio autoplay restricted, ignore
  }
};

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
  const [timeLeft, setTimeLeft] = useState('');
  const { formatMoney } = useCurrency();

  // Reset claimSuccess when modal re-opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live countdown to next calendar day reset (00:00 local time)
  useEffect(() => {
    if (!isOpen) return;

    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = Math.max(0, midnight.getTime() - now.getTime());

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (lang === 'tr') {
        setTimeLeft(`${hours}s ${minutes}d ${seconds}sn`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isOpen, lang]);

  if (!isOpen) return null;

  // Immediate UI synchronization after claiming
  const effectiveCompany = claimSuccess
    ? {
        ...company,
        daily_streak: claimSuccess.newStreak,
        last_daily_bonus_date: new Date().toISOString().slice(0, 10),
        cash: claimSuccess.newCash,
        xp: claimSuccess.newXp,
        level: claimSuccess.newLevel
      }
    : company;

  const streakInfo = getDailyStreakInfo(effectiveCompany);
  const { isClaimedToday, currentStreak, targetDay, reward, schedule } = streakInfo;
  const claimedCount = schedule.filter((s) => s.isClaimed).length;
  const progressPercent = Math.round((claimedCount / 7) * 100);

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
      triggerCelebrationConfetti();
      playCelebrationSound();

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 modal-backdrop-safe"
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
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] modal-content-safe"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation();
          if (e.ctrlKey) e.preventDefault();
        }}
      >
        {/* Glowing Ambient Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 flex items-start justify-between border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
              <Flame className="w-6 h-6 fill-amber-400 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  {lang === 'tr' ? 'Günlük Giriş Bonusu' : 'Daily Login Streak'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {currentStreak > 0
                    ? `${currentStreak} ${lang === 'tr' ? 'Gün' : 'Days'}`
                    : (lang === 'tr' ? 'Yeni Başlangıç' : 'Day 1')}
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
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Claim Success Celebration Banner */}
          {claimSuccess && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-teal-950/90 border-2 border-emerald-400/60 text-emerald-100 flex items-center gap-3 animate-in zoom-in-95 duration-200 shadow-xl shadow-emerald-500/20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0 shadow-md">
                <PartyPopper className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-xs leading-relaxed flex-1">
                <div className="flex items-center gap-2">
                  <strong className="text-emerald-300 font-black text-sm">
                    {lang === 'tr' ? 'Ödül Kasanıza Başarıyla Eklendi! 🎉' : 'Reward Successfully Claimed! 🎉'}
                  </strong>
                </div>
                <span className="text-emerald-200/90">
                  {lang === 'tr'
                    ? `Kasanıza +${formatMoney(claimSuccess.reward?.cash || 0, { decimals: 0 })} nakit ve +${claimSuccess.reward?.xp || 0} XP aktarıldı. Yarın serinizi devam ettirmeyi unutmayın!`
                    : `+${formatMoney(claimSuccess.reward?.cash || 0, { decimals: 0 })} and +${claimSuccess.reward?.xp || 0} XP added. Keep your streak alive tomorrow!`}
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Streak Progress & Countdown Timer Bar */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 sm:p-3.5 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  {lang === 'tr' ? '7 Günlük Giriş Takvimi' : '7-Day Reward Track'}
                </span>
                {reward?.multiplier > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-bold text-amber-300">
                    +{Math.round((reward.multiplier - 1) * 100)}% {lang === 'tr' ? 'Sadakat Bonusu' : 'Loyalty Bonus'}
                  </span>
                )}
              </div>

              {/* Countdown badge to next reset */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                <span>
                  {isClaimedToday
                    ? (lang === 'tr' ? 'Yarınki Ödül:' : 'Next Reward:')
                    : (lang === 'tr' ? 'Kalan Süre:' : 'Expires in:')}{' '}
                  <strong className="text-amber-300">{timeLeft || '--:--'}</strong>
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className="text-slate-400">
                  {lang === 'tr' ? 'Haftalık Seri İlerlemesi' : 'Weekly Streak Progress'}
                </span>
                <span className="text-emerald-400">
                  {claimedCount} / 7 {lang === 'tr' ? 'Gün' : 'Days'} (%{progressPercent})
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(4, progressPercent))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 7-Day Interactive Progress Track */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
            {schedule.map((item) => {
              const isDayClaimed = item.isClaimed;
              const isTargetToday = item.isCurrent && !isClaimedToday;

              // Calculate days away until unlock for locked future days
              let daysAway = 0;
              if (isClaimedToday) {
                daysAway = targetDay === 7 ? item.day : item.day - targetDay;
              } else {
                daysAway = item.day - targetDay;
              }
              const safeDaysAway = Math.max(1, daysAway);

              // -------------------------------------------------------------
              // STATE 1: CLAIMED DAY (Big Green Checkmark & Celebration Stamp)
              // -------------------------------------------------------------
              if (isDayClaimed) {
                return (
                  <div
                    key={`reward_day_${item.day}`}
                    className={`relative rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all border overflow-hidden ${
                      item.day === 7
                        ? 'col-span-2 sm:col-span-1 bg-gradient-to-b from-emerald-950/70 to-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                        : 'bg-gradient-to-b from-emerald-950/40 to-slate-950/70 border-emerald-500/35'
                    }`}
                  >
                    {/* Header */}
                    <div className="w-full flex items-center justify-between mb-1 z-10">
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {lang === 'tr' ? `${item.day}. Gün` : `Day ${item.day}`}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>

                    {/* Big Glorious Green Checkmark Centerpiece */}
                    <div className="relative my-1 z-10">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-md animate-pulse" />
                      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300">
                        <Check className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[3.5]" />
                      </div>
                    </div>

                    {/* "ALINDI ✓" Badge */}
                    <div className="z-10 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/40 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        {lang === 'tr' ? 'ALINDI' : 'CLAIMED'}
                      </span>
                    </div>

                    {/* Reward Cash (Strikethrough) */}
                    <div className="z-10 mt-1 flex flex-col items-center">
                      <span className="font-mono font-bold text-xs text-slate-400 line-through">
                        {formatMoney(item.cash, { decimals: 0 })}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400/80">
                        +{item.xp} XP
                      </span>
                    </div>
                  </div>
                );
              }

              // -------------------------------------------------------------
              // STATE 2: READY TO CLAIM TODAY (Pulsing highlight & bouncing action)
              // -------------------------------------------------------------
              if (isTargetToday) {
                return (
                  <div
                    key={`reward_day_${item.day}`}
                    className={`relative rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all border-2 z-10 scale-102 ${
                      item.day === 7
                        ? 'col-span-2 sm:col-span-1 bg-gradient-to-b from-amber-950 via-orange-950/90 to-yellow-950 border-amber-400 ring-4 ring-amber-400/40 shadow-2xl shadow-amber-500/30'
                        : 'bg-gradient-to-b from-emerald-950/95 via-slate-900 to-slate-950 border-emerald-400 ring-4 ring-emerald-400/40 shadow-2xl shadow-emerald-500/25'
                    }`}
                  >
                    {/* Header */}
                    <div className="w-full flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-extrabold text-white">
                        {lang === 'tr' ? `${item.day}. Gün` : `Day ${item.day}`}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>

                    {/* Icon */}
                    <div className="my-1">
                      {item.isMega ? (
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
                          <Trophy className="w-5 h-5 animate-bounce" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-md">
                          <Gift className="w-5 h-5 animate-bounce" />
                        </div>
                      )}
                    </div>

                    {/* "ŞİMDİ AL!" Action Pill */}
                    <span className="my-0.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 px-2 py-0.5 rounded-full shadow-md shadow-emerald-500/30">
                      <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                      {lang === 'tr' ? 'ŞİMDİ AL!' : 'CLAIM!'}
                    </span>

                    {/* Reward Cash */}
                    <span
                      className={`font-mono font-black text-xs sm:text-sm ${
                        item.isMega ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {formatMoney(item.cash, { decimals: 0 })}
                    </span>

                    {/* XP Tag */}
                    <span className="text-[9px] font-mono font-bold text-cyan-300">
                      +{item.xp} XP
                    </span>

                    {item.isMega && (
                      <span className="mt-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50">
                        MEGA
                      </span>
                    )}
                  </div>
                );
              }

              // -------------------------------------------------------------
              // STATE 3: LOCKED FUTURE DAY (Prominent Lock & Unlock Countdown)
              // -------------------------------------------------------------
              return (
                <div
                  key={`reward_day_${item.day}`}
                  className={`relative rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all border group ${
                    item.day === 7
                      ? 'col-span-2 sm:col-span-1 bg-amber-950/20 border-amber-500/25 hover:border-amber-400/40 text-amber-200/80'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700/80 text-slate-400'
                  }`}
                >
                  {/* Header */}
                  <div className="w-full flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {lang === 'tr' ? `${item.day}. Gün` : `Day ${item.day}`}
                    </span>
                    <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                  </div>

                  {/* Centered Lock Icon Badge */}
                  <div className="relative my-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 group-hover:scale-105 group-hover:border-slate-600 transition-all shadow-inner">
                      {item.isMega ? (
                        <Crown className="w-4 h-4 text-amber-500/70" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Reward Preview */}
                  <span className="font-mono font-bold text-xs text-slate-300">
                    {formatMoney(item.cash, { decimals: 0 })}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400/70">
                    +{item.xp} XP
                  </span>

                  {/* Unlock Timing Pill */}
                  <div className="mt-1.5 w-full py-0.5 px-1 rounded-md bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-1 text-[9px] font-bold text-amber-300/90 shadow-sm">
                    <Clock className="w-2.5 h-2.5 text-amber-400/90 shrink-0" />
                    <span className="truncate">
                      {safeDaysAway === 1
                        ? (lang === 'tr' ? 'Yarın Açılır' : 'Tomorrow')
                        : (lang === 'tr' ? `${safeDaysAway} Gün Sonra` : `${safeDaysAway}d Away`)}
                    </span>
                  </div>

                  {item.isMega && (
                    <span className="mt-1 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/20">
                      MEGA
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Today's Reward Details Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950/80 via-slate-900/90 to-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                {isClaimedToday ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                )}
                <span className={isClaimedToday ? 'text-emerald-400' : 'text-amber-400'}>
                  {isClaimedToday
                    ? (lang === 'tr' ? 'Bugünkü Ödülünüz Alındı' : 'Today’s Reward Claimed')
                    : (lang === 'tr' ? `Bugünün Ödülü (${targetDay}. Gün)` : `Today’s Reward (Day ${targetDay})`)}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                {lang === 'tr' ? reward.titleTr : reward.titleEn}
                {reward.isMega && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] font-black text-amber-300">
                    MEGA
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                {lang === 'tr' ? reward.descriptionTr : reward.descriptionEn}
              </p>
            </div>

            <div className="flex flex-col items-center sm:items-end shrink-0 gap-1">
              <div className="flex items-baseline gap-1 font-mono text-2xl font-black text-emerald-400 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
                <span>+{formatMoney(reward.cash, { decimals: 0 })}</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                +{reward.xp} XP Teşviki
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
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
              <span>
                {lang === 'tr'
                  ? 'Kasayı nasıl 10x büyütürüm? (Yatırım İpuçları)'
                  : 'How to 10x my cash? (Investment Guide)'}
              </span>
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
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:via-teal-300 hover:to-cyan-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Gift className="w-4 h-4 fill-slate-950" />
                <span>
                  {loading
                    ? (lang === 'tr' ? 'Kasanıza Aktarılıyor...' : 'Claiming...')
                    : (lang === 'tr'
                        ? `Ödülü Al (+${formatMoney(reward.cash, { decimals: 0 })}) 🎁`
                        : `Claim Reward (+${formatMoney(reward.cash, { decimals: 0 })}) 🎁`)}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {lang === 'tr'
                    ? 'Bugünkü ödülünüz alındı! Sıradaki bonus yarın açılacak.'
                    : 'Claimed for today! Next reward unlocks tomorrow.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
