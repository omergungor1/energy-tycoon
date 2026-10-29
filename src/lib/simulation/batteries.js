// Energy Tycoon - Battery Storage & Smart Arbitrage
// Sections 08 & D4 of GDD

/**
 * Dispatches hourly production into battery storage and/or grid sales based on rules
 */
export function dispatchSiteEnergy({
  totalGeneratedKwh,
  batterySettings,
  batteryAssets,
  gridCapacityKw, // Grid line limit in kW (e.g. 2000 kW = 2000 kWh/hour max)
  currentPricePerKwh,
  next24hMaxPrice
}) {
  let storedEnergy = Number(batterySettings?.stored_kwh || 0);
  const minSellPrice = Number(batterySettings?.min_sell_price || 0.0800);
  const reservePct = Number(batterySettings?.reserve_percentage || 20.0); // % reserved
  const chargeMode = batterySettings?.charge_mode || 'smart';

  // Calculate total battery capacity on this site
  let totalBatteryCapacityKwh = 0;
  let avgRoundTripEfficiency = 0.94;

  for (const b of batteryAssets) {
    const specs = b.specs || {};
    const cap = Number(specs.capacity_kwh || b.capacity_kw || 1000);
    totalBatteryCapacityKwh += cap;
    if (specs.round_trip_efficiency) {
      avgRoundTripEfficiency = Number(specs.round_trip_efficiency);
    }
  }

  const reserveKwh = (totalBatteryCapacityKwh * reservePct) / 100.0;
  const availableBatterySpaceKwh = Math.max(0, totalBatteryCapacityKwh - storedEnergy);

  let energyToBatteryKwh = 0;
  let energyFromBatteryKwh = 0;
  let directSoldKwh = 0;
  let batterySoldKwh = 0;
  let curtailedKwh = 0;

  // Decide whether to charge or discharge
  const isGoodTimeToSell = currentPricePerKwh >= minSellPrice || currentPricePerKwh >= (next24hMaxPrice * 0.95);

  if (totalBatteryCapacityKwh > 0 && !isGoodTimeToSell && availableBatterySpaceKwh > 0) {
    // Charge battery with available generation
    energyToBatteryKwh = Math.min(totalGeneratedKwh, availableBatterySpaceKwh);
    const remainingGen = totalGeneratedKwh - energyToBatteryKwh;

    // Remaining generation goes to grid up to grid limit
    directSoldKwh = Math.min(remainingGen, gridCapacityKw);
    curtailedKwh = Math.max(0, remainingGen - gridCapacityKw);

    storedEnergy += energyToBatteryKwh;
  } else if (totalBatteryCapacityKwh > 0 && isGoodTimeToSell && storedEnergy > reserveKwh) {
    // Discharge battery up to grid limit after direct sales
    directSoldKwh = Math.min(totalGeneratedKwh, gridCapacityKw);
    curtailedKwh = Math.max(0, totalGeneratedKwh - gridCapacityKw);

    const remainingGridMargin = Math.max(0, gridCapacityKw - directSoldKwh);
    const dischargeableKwh = Math.max(0, storedEnergy - reserveKwh);

    energyFromBatteryKwh = Math.min(dischargeableKwh, remainingGridMargin);
    batterySoldKwh = energyFromBatteryKwh * avgRoundTripEfficiency;

    storedEnergy -= energyFromBatteryKwh;
  } else {
    // No battery or hold: direct sell to grid
    directSoldKwh = Math.min(totalGeneratedKwh, gridCapacityKw);
    curtailedKwh = Math.max(0, totalGeneratedKwh - gridCapacityKw);
  }

  const totalSoldKwh = directSoldKwh + batterySoldKwh;

  return {
    totalGeneratedKwh,
    directSoldKwh: Number(directSoldKwh.toFixed(2)),
    batterySoldKwh: Number(batterySoldKwh.toFixed(2)),
    totalSoldKwh: Number(totalSoldKwh.toFixed(2)),
    curtailedKwh: Number(curtailedKwh.toFixed(2)),
    newStoredEnergyKwh: Number(storedEnergy.toFixed(2)),
    energyToBatteryKwh: Number(energyToBatteryKwh.toFixed(2)),
    energyFromBatteryKwh: Number(energyFromBatteryKwh.toFixed(2))
  };
}

