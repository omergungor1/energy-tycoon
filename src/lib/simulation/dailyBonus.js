/**
 * Daily Login Streak & Bonus System
 * Rewards players with progressive cash and XP for regular daily logins.
 * Motto: "Yatırımlarını aralıksız büyüt!"
 */

export const DAILY_BONUS_MOTTO = {
  tr: 'Yatırımlarını aralıksız büyüt! Kesintisiz enerji, kesintisiz kazanç.',
  en: 'Keep your investments growing uninterrupted! Continuous power, continuous profit.'
};

export const DAILY_REWARDS_SCHEDULE = [
  {
    day: 1,
    cash: 5000,
    xp: 50,
    titleTr: 'Temel Girişimci Teşviki',
    titleEn: 'Starter Entrepreneur Grant',
    descriptionTr: 'Enerji şebekesine yeni gün başlangıç sübvansiyonu.',
    descriptionEn: 'Daily starter grid operations grant.'
  },
  {
    day: 2,
    cash: 8000,
    xp: 75,
    titleTr: 'Şebeke Dengeleme Desteği',
    titleEn: 'Grid Balancing Subsidy',
    descriptionTr: 'İstikrarlı frekans yönetimi ve sistem güvenliği primi.',
    descriptionEn: 'Stable frequency control and grid reliability subsidy.'
  },
  {
    day: 3,
    cash: 12000,
    xp: 100,
    titleTr: 'Temiz Enerji AR-GE Fonu',
    titleEn: 'Clean Energy R&D Fund',
    descriptionTr: 'Yeni nesil türbin ve panel araştırmaları teşvik ödülü.',
    descriptionEn: 'Next-gen turbine & solar panel research incentive.'
  },
  {
    day: 4,
    cash: 18000,
    xp: 150,
    titleTr: 'Yenilenebilir İnovasyon Primi',
    titleEn: 'Renewable Innovation Premium',
    descriptionTr: 'Yüksek kapasite faktörü ve verimli üretim ikramiyesi.',
    descriptionEn: 'High capacity factor & generation efficiency premium.'
  },
  {
    day: 5,
    cash: 25000,
    xp: 200,
    titleTr: 'Yeşil Dönüşüm İkramiyesi',
    titleEn: 'Green Transition Bounty',
    descriptionTr: 'Karbon emisyonunu sıfırlayan lider şirket ödülü.',
    descriptionEn: 'Zero-carbon leader company dividend.'
  },
  {
    day: 6,
    cash: 35000,
    xp: 300,
    titleTr: 'Yüksek Verimlilik Temettüsü',
    titleEn: 'Peak Efficiency Dividend',
    descriptionTr: 'Ada genelinde rekor enerji arzı sağlama ödülü.',
    descriptionEn: 'Island-wide record energy delivery reward.'
  },
  {
    day: 7,
    cash: 50000,
    xp: 500,
    isMega: true,
    titleTr: 'Büyük Tycoon Konglomerat Hibesi',
    titleEn: 'Mega Tycoon Conglomerate Grant',
    descriptionTr: 'Haftalık kesintisiz seri tamamlandı! Şirketinize büyük kalkınma fonu aktarıldı.',
    descriptionEn: 'Full 7-day streak achieved! Major clean energy conglomerate development fund awarded.'
  }
];

/**
 * Returns formatted YYYY-MM-DD string for a given timestamp
 */
export function getFormattedDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD date strings
 */
export function getCalendarDayDifference(fromDateStr, toDateStr) {
  if (!fromDateStr || !toDateStr) return 999;
  const from = new Date(fromDateStr + 'T00:00:00Z');
  const to = new Date(toDateStr + 'T00:00:00Z');
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates current streak status and next reward details for a company
 */
export function getDailyStreakInfo(company, clientDateStr = null) {
  const todayStr = clientDateStr || getFormattedDateString();
  const lastClaimDate = company?.last_daily_bonus_date || null;
  const currentStreak = Number(company?.daily_streak || 0);

  const dayDiff = lastClaimDate ? getCalendarDayDifference(lastClaimDate, todayStr) : 999;
  const isClaimedToday = dayDiff === 0;

  let nextStreak = 1;
  if (isClaimedToday) {
    nextStreak = currentStreak;
  } else if (dayDiff === 1) {
    nextStreak = currentStreak + 1; // Consecutive day streak
  } else {
    nextStreak = 1; // Missed day, resets back to day 1
  }

  // Determine reward day in the 7-day cyclical calendar (1 through 7)
  const targetDay = isClaimedToday
    ? ((Math.max(1, currentStreak) - 1) % 7) + 1
    : ((nextStreak - 1) % 7) + 1;

  const reward = DAILY_REWARDS_SCHEDULE[targetDay - 1];

  // Milestone bonus multiplier for long streaks (e.g. 14+ days, 30+ days)
  let streakMultiplier = 1.0;
  if (nextStreak >= 30) {
    streakMultiplier = 1.5; // +50% for 30+ day masters!
  } else if (nextStreak >= 14) {
    streakMultiplier = 1.25; // +25% for 2+ weeks!
  }

  const finalCashReward = Math.round(reward.cash * streakMultiplier);
  const finalXpReward = Math.round(reward.xp * streakMultiplier);

  return {
    todayStr,
    lastClaimDate,
    dayDiff,
    isClaimedToday,
    canClaim: !isClaimedToday,
    currentStreak,
    nextStreak,
    targetDay,
    reward: {
      ...reward,
      cash: finalCashReward,
      xp: finalXpReward,
      baseCash: reward.cash,
      baseXp: reward.xp,
      multiplier: streakMultiplier
    },
    schedule: DAILY_REWARDS_SCHEDULE.map((s) => ({
      ...s,
      isClaimed: isClaimedToday ? s.day <= targetDay : s.day < targetDay,
      isCurrent: s.day === targetDay
    }))
  };
}

