import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCurrentGameHour, getGameDate } from '@/lib/simulation/clock';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Get company
    const { data: company, error: compErr } = await admin
      .from('companies')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 2. Get current game hour
    const { data: simState } = await admin
      .from('simulation_state')
      .select('*')
      .eq('id', 1)
      .single();

    const currentGameHour = calculateCurrentGameHour(
      Date.now(),
      Number(simState?.epoch_real_utc_ms || Date.now()),
      Number(simState?.epoch_game_hour || 0)
    );

    // 3. Fetch all production, settlements, ledger entries, and company sites
    const [prodRes, settlementsRes, ledgerRes, sitesRes] = await Promise.all([
      admin
        .from('hourly_production')
        .select('*')
        .eq('company_id', company.id)
        .order('game_hour', { ascending: true }),
      admin
        .from('hourly_energy_settlements')
        .select('*')
        .eq('company_id', company.id)
        .order('game_hour', { ascending: true }),
      admin
        .from('ledger_entries')
        .select('*')
        .eq('company_id', company.id)
        .order('game_hour', { ascending: false }),
      admin
        .from('company_sites')
        .select('id, site_id, plant_name, world_sites(name)')
        .eq('company_id', company.id)
    ]);

    const prods = prodRes.data || [];
    const settlements = settlementsRes.data || [];
    const ledgers = ledgerRes.data || [];
    const cSites = sitesRes.data || [];

    // Map company sites for name resolution
    const siteMap = new Map();
    cSites.forEach((cs) => {
      const name = cs.plant_name || cs.world_sites?.name || `Santral #${cs.site_id}`;
      siteMap.set(cs.id, name);
      siteMap.set(String(cs.site_id), name);
    });

    // Helper to calculate aggregations for a game hour range
    const calculateRangeStats = (startH, endH) => {
      const rangeProds = prods.filter(
        (p) => Number(p.game_hour) >= startH && Number(p.game_hour) <= endH
      );
      const rangeSets = settlements.filter(
        (s) => Number(s.game_hour) >= startH && Number(s.game_hour) <= endH
      );
      const rangeLedgers = ledgers.filter(
        (l) => Number(l.game_hour) >= startH && Number(l.game_hour) <= endH
      );

      // Energy totals
      let totalGenKwh = 0;
      let windKwh = 0;
      let solarKwh = 0;
      let totalSoldKwh = 0;
      let storedKwh = 0;

      for (const p of rangeProds) {
        totalGenKwh += Number(p.total_kwh || 0);
        windKwh += Number(p.wind_kwh || 0);
        solarKwh += Number(p.solar_kwh || 0);
        totalSoldKwh += Number(p.sold_kwh || 0);
        storedKwh += Number(p.stored_kwh || 0);
      }

      // Financial revenue totals from settlements
      let grossRev = 0;
      let marketFees = 0;
      let netRev = 0;

      for (const s of rangeSets) {
        grossRev += Number(s.gross_revenue || 0);
        marketFees += Number(s.market_fee || 0);
        netRev += Number(s.net_revenue || 0);
      }

      const avgPrice = totalSoldKwh > 0 ? grossRev / totalSoldKwh : 0;

      // Cash Flow breakdown from ledger entries
      let totalInflows = 0;
      let totalOutflows = 0;
      const breakdown = {
        electricitySales: 0,
        grants: 0,
        loanDisbursements: 0,
        equipmentPurchases: 0,
        siteLeases: 0,
        sitePurchases: 0,
        solarTrackerUpgrades: 0,
        loanRepayments: 0,
        otherExpenses: 0
      };

      for (const l of rangeLedgers) {
        const amt = Number(l.amount || 0);
        if (amt >= 0) {
          totalInflows += amt;
          if (l.entry_type === 'electricity_sales') breakdown.electricitySales += amt;
          else if (l.entry_type === 'initial_grant') breakdown.grants += amt;
          else if (l.entry_type === 'loan_disbursement') breakdown.loanDisbursements += amt;
        } else {
          const absAmt = Math.abs(amt);
          totalOutflows += absAmt;
          if (l.entry_type === 'equipment_purchase') breakdown.equipmentPurchases += absAmt;
          else if (l.entry_type === 'site_lease') breakdown.siteLeases += absAmt;
          else if (l.entry_type === 'site_purchase') breakdown.sitePurchases += absAmt;
          else if (l.entry_type === 'upgrade_solar_tracker') breakdown.solarTrackerUpgrades += absAmt;
          else if (l.entry_type === 'loan_repayment') breakdown.loanRepayments += absAmt;
          else breakdown.otherExpenses += absAmt;
        }
      }

      // Hourly data points for charts (up to last 24 points in range)
      const hourlyMap = new Map();
      for (const s of rangeSets) {
        const gh = Number(s.game_hour);
        const existing = hourlyMap.get(gh) || {
          gameHour: gh,
          kwh: 0,
          revenue: 0,
          price: s.price_per_kwh
        };
        existing.kwh += Number(s.direct_sold_kwh || 0) + Number(s.battery_sold_kwh || 0);
        existing.revenue += Number(s.net_revenue || 0);
        hourlyMap.set(gh, existing);
      }

      const hourlySeries = Array.from(hourlyMap.values())
        .sort((a, b) => a.gameHour - b.gameHour)
        .slice(-24);

      return {
        startHour: startH,
        endHour: endH,
        totalGenKwh: Number(totalGenKwh.toFixed(1)),
        windKwh: Number(windKwh.toFixed(1)),
        solarKwh: Number(solarKwh.toFixed(1)),
        totalSoldKwh: Number(totalSoldKwh.toFixed(1)),
        storedKwh: Number(storedKwh.toFixed(1)),
        grossRevenue: Number(grossRev.toFixed(2)),
        marketFees: Number(marketFees.toFixed(2)),
        netRevenue: Number(netRev.toFixed(2)),
        avgPricePerKwh: Number(avgPrice.toFixed(4)),
        totalInflows: Number(totalInflows.toFixed(2)),
        totalOutflows: Number(totalOutflows.toFixed(2)),
        netCashFlow: Number((totalInflows - totalOutflows).toFixed(2)),
        breakdown: {
          electricitySales: Number(breakdown.electricitySales.toFixed(2)),
          grants: Number(breakdown.grants.toFixed(2)),
          loanDisbursements: Number(breakdown.loanDisbursements.toFixed(2)),
          equipmentPurchases: Number(breakdown.equipmentPurchases.toFixed(2)),
          siteLeases: Number(breakdown.siteLeases.toFixed(2)),
          sitePurchases: Number(breakdown.sitePurchases.toFixed(2)),
          solarTrackerUpgrades: Number(breakdown.solarTrackerUpgrades.toFixed(2)),
          loanRepayments: Number(breakdown.loanRepayments.toFixed(2)),
          otherExpenses: Number(breakdown.otherExpenses.toFixed(2))
        },
        hourlySeries
      };
    };

    // Calculate ranges:
    // Today: Start of today (or last 24h if morning)
    const todayStart = Math.max(0, currentGameHour - (currentGameHour % 24));
    const todayStats = calculateRangeStats(
      currentGameHour - todayStart < 6 ? Math.max(0, currentGameHour - 24) : todayStart,
      currentGameHour
    );

    // Yesterday: Full 24h prior to today
    const yesterdayStart = Math.max(0, todayStart - 24);
    const yesterdayEnd = Math.max(0, todayStart - 1);
    const yesterdayStats = calculateRangeStats(yesterdayStart, yesterdayEnd);

    // Last 7 Days (168 hours)
    const weekStart = Math.max(0, currentGameHour - 168);
    const weekStats = calculateRangeStats(weekStart, currentGameHour);

    // All Time (from hour 0)
    const allStats = calculateRangeStats(0, currentGameHour);

    // Recent 50 ledger entries formatted with game date (Only day and hour as requested)
    const formattedLedger = ledgers.slice(0, 50).map((item) => {
      const gDate = getGameDate(Number(item.game_hour || 0));
      let desc = item.description || '';
      const meta = item.metadata ? { ...item.metadata } : {};

      // Enrich electricity sales with site name if missing
      if (item.entry_type === 'electricity_sales') {
        let siteName = meta.plant_name || meta.site_name || null;
        if (!siteName && meta.company_site_id) {
          siteName = siteMap.get(meta.company_site_id) || null;
        }
        if (!siteName && meta.site_id) {
          siteName = siteMap.get(String(meta.site_id)) || null;
        }
        if (!siteName && item.idempotency_key) {
          const parts = item.idempotency_key.split('_');
          if (parts.length >= 3 && parts[0] === 'energy') {
            const cSiteId = parts[2];
            siteName = siteMap.get(cSiteId) || null;
          }
        }
        if (siteName) {
          meta.plant_name = siteName;
          meta.site_name = siteName;
          if (!desc.startsWith(siteName)) {
            desc = `${siteName} • ${desc}`;
          }
        }
      }

      return {
        id: item.id,
        gameHour: item.game_hour,
        day: gDate.day,
        hour: gDate.formattedHour,
        formattedTime: `Gün ${gDate.day}, ${gDate.formattedHour}`,
        entryType: item.entry_type,
        amount: Number(item.amount || 0),
        balanceAfter: Number(item.balance_after || 0),
        description: desc,
        metadata: meta
      };
    });

    return NextResponse.json({
      success: true,
      currentCash: Number(company.cash || 0),
      currentGameHour,
      ranges: {
        today: todayStats,
        yesterday: yesterdayStats,
        week: weekStats,
        all: allStats
      },
      ledgerEntries: formattedLedger
    });
  } catch (err) {
    console.error('Treasury API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

