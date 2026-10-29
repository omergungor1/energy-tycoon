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

