// Energy Tycoon - Spot Electricity Market Simulation
// Rule: Shared global spot price per game hour, bounded between $0.045 and $0.165 per kWh ($45 - $165 / MWh).
// Typical peak hours: 17:00 - 21:00 (Evening demand peak) and 08:00 - 11:00 (Morning ramp).
// Off-peak valley: 02:00 - 05:00 (Night trough).
// Fixed market commission: 2.5% (0.025).

export const MARKET_COMMISSION_RATE = 0.025; // 2.5%
export const MIN_PRICE_PER_KWH = 0.045; // $45 / MWh
export const MAX_PRICE_PER_KWH = 0.165; // $165 / MWh
export const BASE_PRICE_PER_KWH = 0.085; // $85 / MWh

// Pseudo-random deterministic hash
function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Deterministically computes the spot electricity price for a specific game hour
 */
export function getHourlySpotPrice(gameHour, worldSeed = 42) {
  const h = Number(gameHour);
  const hourOfDay = h % 24;

  // Base diurnal demand curve (normalized -1.0 to 1.0)
  // Peaks at 19:00 (evening peak) and 09:00 (morning peak)
  const morningPeak = Math.exp(-Math.pow(hourOfDay - 9, 2) / 8);
  const eveningPeak = Math.exp(-Math.pow(hourOfDay - 19, 2) / 10);
  const nightTrough = Math.exp(-Math.pow(hourOfDay - 3, 2) / 6);

  const demandFactor = (morningPeak * 0.25) + (eveningPeak * 0.45) - (nightTrough * 0.25);

  // Controlled deterministic volatility from world seed & hour
  const noise = (pseudoRandom(worldSeed * 1337 + h) - 0.5) * 0.030;

  // Weekly fluctuation (e.g. slight weekend dip)
  const dayOfWeek = Math.floor(h / 24) % 7;
  const weekendDip = (dayOfWeek === 5 || dayOfWeek === 6) ? -0.008 : 0.004;

  const rawPrice = BASE_PRICE_PER_KWH + (demandFactor * 0.045) + noise + weekendDip;
  const clampedPrice = Math.max(MIN_PRICE_PER_KWH, Math.min(MAX_PRICE_PER_KWH, rawPrice));

  return {
    gameHour: h,
    hourOfDay,
    pricePerKwh: Number(clampedPrice.toFixed(4)),
    pricePerMwh: Number((clampedPrice * 1000).toFixed(2))
  };
}

/**
 * Returns prices for a range of hours (e.g. past 24h or next 24h forecast)
 */
export function getPriceRange(startHour, endHour, worldSeed = 42) {
  const result = [];
  for (let h = startHour; h <= endHour; h++) {
    result.push(getHourlySpotPrice(h, worldSeed));
  }
  return result;
}

