// Energy Tycoon - Energy Production Simulation
// Simple linear models as specified in GDD Sections 06 & D3

import { getDaylightFactor, getGameDate } from './clock.js';

function pseudoRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Calculates current wind speed for a site at a given game hour
 */
export function getSiteWindSpeed(site, gameHour, worldSeed = 42) {
  const basePotential = Number(site.base_wind_potential || 0.75); // 0.0 - 1.0
  const h = Number(gameHour);
  const hourOfDay = h % 24;

  // Diurnal wind pattern (afternoon thermal wind increase)
  const thermalWind = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI) * 1.5;

  // Deterministic weather wave (cycles every 18-36 hours)
  const synopticWave = Math.sin((h / 18) * Math.PI) * 3.5;

  // Local site jitter
  const noise = (pseudoRandom(worldSeed * 777 + site.id * 1000 + h) - 0.5) * 2.0;

  // Average base wind speed between 5.0 and 14.0 m/s depending on potential
  const avgSpeed = 4.0 + (basePotential * 9.0);
  const windSpeed = Math.max(0, avgSpeed + thermalWind + synopticWave + noise);

  return Number(windSpeed.toFixed(2));
}

/**
 * Calculates solar irradiance factor for a site at a given game hour
 */
export function getSiteSolarFactor(site, gameHour, worldSeed = 42) {
  const basePotential = Number(site.base_solar_potential || 0.85); // 0.0 - 1.0
  const h = Number(gameHour);
  const hourOfDay = h % 24;

  const daylight = getDaylightFactor(hourOfDay);
  if (daylight <= 0) return 0;

  // Cloud cover variation
  const cloudNoise = pseudoRandom(worldSeed * 333 + site.id * 500 + h);
  const cloudFactor = cloudNoise < 0.20 ? 0.45 : cloudNoise < 0.40 ? 0.75 : 1.0; // Clear, partial, overcast

  return Number((daylight * basePotential * cloudFactor).toFixed(3));
}

/**
 * Calculates electricity production (kWh) for a single installed asset in 1 game hour
 */
export function calculateAssetProduction(asset, catalog, site, gameHour, worldSeed = 42, companySite = null) {
  if (asset.status !== 'generating') {
    return 0;
  }

  const capacityKw = Number(catalog.capacity_kw || 0);
  const conditionFactor = Math.max(0.40, Number(asset.condition || 100) / 100.0);
  const degradationFactor = Number(asset.degradation_factor || 1.0);
  const efficiency = Number(catalog.efficiency || 1.0);

  if (catalog.equipment_type === 'wind_turbine') {
    const specs = catalog.specs || {};
    const cutIn = Number(specs.cut_in_speed_ms || 3.0);
    const ratedSpeed = Number(specs.rated_speed_ms || 12.0);
    const cutOut = Number(specs.cut_out_speed_ms || 25.0);

    const windSpeed = getSiteWindSpeed(site, gameHour, worldSeed);

    if (windSpeed < cutIn || windSpeed > cutOut) {
      return 0;
    }

    // GDD Formula: clamp((wind_speed - cut_in) / (rated_speed - cut_in), 0, 1)
    const windFactor = Math.min(1.0, Math.max(0.0, (windSpeed - cutIn) / (ratedSpeed - cutIn)));
    const kwh = capacityKw * windFactor * conditionFactor * degradationFactor * efficiency;
    return Number(kwh.toFixed(2));
  }

  if (catalog.equipment_type === 'solar_pack') {
    const solarFactor = getSiteSolarFactor(site, gameHour, worldSeed);
    if (solarFactor <= 0) return 0;

    // Single-axis solar tracking upgrade provides +25% generation yield
    const trackerBoost = companySite?.has_solar_tracker ? 1.25 : 1.0;

    // GDD Formula: panel_kW * daylight_factor * site_solar_factor * age_factor * trackerBoost * 1_hour
    const kwh = capacityKw * solarFactor * conditionFactor * degradationFactor * efficiency * trackerBoost;
    return Number(kwh.toFixed(2));
  }

  return 0;
}

