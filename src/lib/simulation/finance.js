// Energy Tycoon - Financial Engine & Net Worth Calculation
// Section 10 of GDD: Net Worth = Cash + Assets Value + Owned Land + Grid Infrastructure - Debt

export const LOAN_TERMS = {
  1: { termYears: 1, annualInterest: 0.08, termMonths: 12 },
  3: { termYears: 3, annualInterest: 0.10, termMonths: 36 },
  5: { termYears: 5, annualInterest: 0.12, termMonths: 60 }
};

/**
 * Calculates current net worth of the company
 */
export function calculateCompanyNetWorth({
  cash = 0,
  installedAssets = [],
  companySites = [],
  gridConnections = [],
  activeLoans = []
}) {
  const cashVal = Number(cash || 0);

  // Asset book value (cost minus depreciation based on condition and age)
  let assetsBookValue = 0;
  for (const a of installedAssets) {
    const cost = Number(a.equipment_catalog?.cost_usd || 0);
    const condition = Number(a.condition || 100) / 100.0;
    const degradation = Number(a.degradation_factor || 1.0);
    assetsBookValue += cost * condition * degradation;
  }

  // Owned land value (Sites owned by company)
  let ownedLandValue = 0;
  for (const cs of companySites) {
    if (cs.tenure_type === 'own') {
      ownedLandValue += Number(cs.world_sites?.purchase_price || 0);
    }
  }

  // Grid infrastructure value
  let infrastructureValue = 0;
  for (const gc of gridConnections) {
    const capacity = Number(gc.capacity_mw || 2.0);
    infrastructureValue += capacity * 25000.0; // $25k per MW connection value
  }

  // Total liabilities / outstanding loans
  let totalDebt = 0;
  for (const l of activeLoans) {
    if (l.status === 'active') {
      totalDebt += Number(l.remaining_balance || 0);
    }
  }

  const netWorth = cashVal + assetsBookValue + ownedLandValue + infrastructureValue - totalDebt;

  // Maximum loan borrowing limit: 50% of net worth minus existing debt
  const maxBorrowingPower = Math.max(0, (netWorth * 0.50) - totalDebt);

  return {
    netWorth: Number(netWorth.toFixed(2)),
    cashVal: Number(cashVal.toFixed(2)),
    assetsBookValue: Number(assetsBookValue.toFixed(2)),
    ownedLandValue: Number(ownedLandValue.toFixed(2)),
    infrastructureValue: Number(infrastructureValue.toFixed(2)),
    totalDebt: Number(totalDebt.toFixed(2)),
    maxBorrowingPower: Number(maxBorrowingPower.toFixed(2))
  };
}

/**
 * Calculates second-hand resale value and lifespan breakdown of an installed equipment unit
 * Considers brand-new catalog price, consumed lifespan, and physical condition.
 */
export function calculateEquipmentResaleValue(catalog, asset, currentHour = 0) {
  const costUsd = Number(catalog?.cost_usd || 100000);
  const lifespanYears = Number(catalog?.lifespan_game_years || 25);
  const totalLifespanHours = lifespanYears * 8760;

  const installedHour = Number(asset?.installed_game_hour || 0);
  const ageHours = Math.max(0, Number(currentHour || 0) - installedHour);
  const ageYears = ageHours / 8760;

  // Percentage of lifespan consumed (0% to 100%)
  const consumedPct = Math.min(100, Math.max(0, (ageHours / totalLifespanHours) * 100));
  const remainingLifespanPct = Math.max(0, 100 - consumedPct);

  // Equipment health/condition (0% to 100%)
  const conditionPct = Math.min(100, Math.max(0, Number(asset?.condition ?? 100)));

  // Resale percentage:
  // Brand new secondary market baseline: 85%
  // Scaled by remaining lifespan and condition, with a guaranteed minimum 15% scrap metal floor
  const rawPct = 0.85 * (remainingLifespanPct / 100) * (0.35 + 0.65 * (conditionPct / 100));
  const resalePct = Math.min(85, Math.max(15, Math.round(rawPct * 100)));
  const resalePriceUsd = Math.round((costUsd * resalePct) / 100);

  return {
    costUsd,
    resalePriceUsd,
    resalePct,
    consumedLifespanPct: Math.round(consumedPct * 10) / 10,
    remainingLifespanPct: Math.round(remainingLifespanPct * 10) / 10,
    ageYears: Math.round(ageYears * 10) / 10,
    lifespanYears,
    conditionPct: Math.round(conditionPct)
  };
}


