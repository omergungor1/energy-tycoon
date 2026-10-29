// Energy Tycoon - Clock & Calendar Simulation
// Rule: 24x speed; 1 real hour = 1 game day (24 game hours); 1 game hour = 2.5 real minutes.
// 1 game year = 365 game days = 8760 game hours.

export const REAL_MS_PER_GAME_HOUR = (60 * 60 * 1000) / 24; // 150,000 ms = 2.5 minutes
export const GAME_HOURS_PER_DAY = 24;
export const GAME_DAYS_PER_YEAR = 365;
export const GAME_HOURS_PER_YEAR = GAME_HOURS_PER_DAY * GAME_DAYS_PER_YEAR; // 8760 hours
export const GAME_DAYS_PER_MONTH = 30; // Approx month for accounting

/**
 * Calculates total elapsed game hours from real-time UTC timestamp
 */
export function calculateCurrentGameHour(currentUtcMs, epochRealUtcMs, epochGameHour = 0) {
  const elapsedRealMs = Math.max(0, currentUtcMs - epochRealUtcMs);
  const elapsedGameHours = Math.floor(elapsedRealMs / REAL_MS_PER_GAME_HOUR);
  return Number(epochGameHour) + elapsedGameHours;
}

/**
 * Decomposes a game hour into human-readable game calendar date
 */
export function getGameDate(gameHour) {
  const h = Number(gameHour);
  const year = Math.floor(h / GAME_HOURS_PER_YEAR) + 1;
  const hourOfYear = h % GAME_HOURS_PER_YEAR;
  const dayOfYear = Math.floor(hourOfYear / GAME_HOURS_PER_DAY) + 1;
  const hourOfDay = hourOfYear % GAME_HOURS_PER_DAY; // 0 to 23

  // Months (approx 30 days per month)
  const month = Math.min(12, Math.floor((dayOfYear - 1) / 30.42) + 1);
  const dayOfMonth = Math.floor(((dayOfYear - 1) % 30.42)) + 1;

  // Season
  let season = 'spring';
  if (dayOfYear >= 80 && dayOfYear < 172) season = 'spring';
  else if (dayOfYear >= 172 && dayOfYear < 264) season = 'summer';
  else if (dayOfYear >= 264 && dayOfYear < 355) season = 'autumn';
  else season = 'winter';

  // Day / Night cycle (Daylight from 06:00 to 20:00)
  const isNight = hourOfDay < 6 || hourOfDay >= 20;

  return {
    gameHour: h,
    year,
    month,
    day: dayOfMonth,
    dayOfYear,
    hour: hourOfDay,
    season,
    isNight,
    formattedHour: `${String(hourOfDay).padStart(2, '0')}:00`,
    formattedDate: `Yıl ${year}, Ay ${month}, Gün ${dayOfMonth}`
  };
}

/**
 * Daylight factor curve [0.0 - 1.0] for solar generation
 */
export function getDaylightFactor(hourOfDay) {
  if (hourOfDay < 6 || hourOfDay >= 20) return 0.0;
  // Peak at 13:00 (1 PM)
  const radians = ((hourOfDay - 6) / 14) * Math.PI;
  return Math.max(0, Math.sin(radians));
}

