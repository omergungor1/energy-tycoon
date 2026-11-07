import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCurrentGameHour, getGameDate } from '@/lib/simulation/clock';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');
    const requestedCompanySiteId = searchParams.get('companySiteId') || searchParams.get('siteId');

    const admin = createAdminClient();

    // 1. Resolve target company (authenticated user, requested query param, or fallback to first company)
    let companyId = requestedCompanyId;

    if (!companyId) {
      try {
        const supabase = await createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();

        if (user) {
          const { data: comp } = await admin
            .from('companies')
            .select('id')
            .eq('owner_user_id', user.id)
            .single();

          if (comp) {
            companyId = comp.id;
          }
        }
      } catch (authErr) {
        // Fallback to query param or default company below
      }
    }

    if (!companyId) {
      const { data: fallbackComp } = await admin
        .from('companies')
        .select('id')
        .order('cash', { ascending: false })
        .limit(1)
        .single();

      if (fallbackComp) {
        companyId = fallbackComp.id;
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 2. Fetch current simulation state
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
    const currentDay = Math.floor(currentGameHour / 24);

    let rows = [];
    let siteInfo = null;
    let siteFinancials = null;

    if (requestedCompanySiteId) {
      // 3A. Fetch plant-specific settlements and details
      const isNum = !isNaN(Number(requestedCompanySiteId)) && !requestedCompanySiteId.includes('-');
      let siteQuery = admin
        .from('company_sites')
        .select('*, world_sites(*)')
        .eq('company_id', companyId);

      if (isNum) {
        siteQuery = siteQuery.eq('site_id', Number(requestedCompanySiteId));
      } else {
        siteQuery = siteQuery.eq('id', requestedCompanySiteId);
      }

      const { data: cSite } = await siteQuery.maybeSingle();

      if (cSite) {
        siteInfo = {
          companySiteId: cSite.id,
          siteId: cSite.site_id,
          plantName: cSite.plant_name || cSite.world_sites?.name || `Santral #${cSite.site_id}`,
          siteName: cSite.world_sites?.name || `Arazi #${cSite.site_id}`,
          regionType: cSite.world_sites?.region_type || 'wind',
          tenureType: cSite.tenure_type,
          leasePriceAnnual: Number(cSite.world_sites?.lease_price_annual || 0),
          purchasePrice: Number(cSite.world_sites?.purchase_price || 0)
        };

        const [settlementsRes, installedAssetsRes, ledgersRes] = await Promise.all([
          admin
            .from('hourly_energy_settlements')
            .select('game_hour, direct_sold_kwh, battery_sold_kwh, price_per_kwh, gross_revenue, net_revenue')
            .eq('company_site_id', cSite.id)
            .order('game_hour', { ascending: true }),
          admin
            .from('installed_assets')
            .select('*, equipment_catalog(*)')
            .eq('company_site_id', cSite.id),
          admin
            .from('ledger_entries')
            .select('*')
            .eq('company_id', companyId)
        ]);

        const settlements = settlementsRes.data || [];
        const assets = installedAssetsRes.data || [];
        const allLedgers = ledgersRes.data || [];

        // Daily aggregation from settlements
        const dayMap = new Map();
        for (const s of settlements) {
          const day = Math.floor(Number(s.game_hour) / 24);
          const kwh = Number(s.direct_sold_kwh || 0) + Number(s.battery_sold_kwh || 0);
          const rev = Number(s.net_revenue || 0);
          const existing = dayMap.get(day) || {
            game_day: day,
            start_hour: day * 24,
            end_hour: day * 24 + 23,
            hours_count: 0,
            total_revenue: 0,
            total_kwh: 0,
            avg_price: 0
          };
          existing.hours_count += 1;
          existing.total_revenue += rev;
          existing.total_kwh += kwh;
          dayMap.set(day, existing);
        }

        for (const item of dayMap.values()) {
          item.avg_price = item.total_kwh > 0 ? item.total_revenue / item.total_kwh : 0;
        }

        rows = Array.from(dayMap.values()).sort((a, b) => a.game_day - b.game_day);

        // Calculate plant-specific lifetime financial totals
        const totalRev = rows.reduce((acc, r) => acc + r.total_revenue, 0);
        const totalKwh = rows.reduce((acc, r) => acc + r.total_kwh, 0);
        const avgPrice = totalKwh > 0 ? totalRev / totalKwh : 0;

        // Calculate expenses: maintenance service and land lease
        let totalExpenses = 0;
        allLedgers.forEach((l) => {
          const amt = Math.abs(Number(l.amount || 0));
          const meta = l.metadata || {};
          const isThisSite =
            meta.company_site_id === cSite.id ||
            meta.site_id === cSite.site_id ||
            (l.description && (l.description.includes(cSite.plant_name) || l.description.includes(cSite.world_sites?.name)));

          if (isThisSite && ['maintenance_service', 'site_lease'].includes(l.entry_type)) {
            totalExpenses += amt;
          }
        });

        // Add conservative baseline OPEX if ledgers are fresh (e.g. ~4% of revenue for standard grid/site upkeep)
        if (totalExpenses === 0 && totalRev > 0) {
          totalExpenses = Number((totalRev * 0.045).toFixed(2));
        }

        const netProfit = Math.max(0, totalRev - totalExpenses);
        const profitMargin = totalRev > 0 ? Number(((netProfit / totalRev) * 100).toFixed(1)) : 100;

        // Current hourly run rate from last settlement or installed capacity
        const lastSettlement = settlements[settlements.length - 1];
        const latestHourlyRev = lastSettlement ? Number(lastSettlement.net_revenue || 0) : 0;
        const latestHourlyKwh = lastSettlement
          ? Number(lastSettlement.direct_sold_kwh || 0) + Number(lastSettlement.battery_sold_kwh || 0)
          : 0;

        siteFinancials = {
          totalRevenue: Number(totalRev.toFixed(2)),
          totalExpenses: Number(totalExpenses.toFixed(2)),
          netProfit: Number(netProfit.toFixed(2)),
          profitMarginPct: profitMargin,
          totalKwh: Number(totalKwh.toFixed(1)),
          avgPricePerKwh: Number(avgPrice.toFixed(4)),
          latestHourlyRevenue: Number(latestHourlyRev.toFixed(2)),
          latestHourlyKwh: Number(latestHourlyKwh.toFixed(1)),
          installedAssetsCount: assets.length
        };
      }
    } else {
      // 3B. Call Postgres RPC function to aggregate daily revenue for the entire company
      const { data: rpcRows, error: rpcErr } = await admin.rpc(
        'get_company_daily_revenue',
        { p_company_id: companyId }
      );

      if (rpcErr) {
        console.error('RPC Error get_company_daily_revenue:', rpcErr);
        // Fallback to direct query if RPC error
        const { data: allSets } = await admin
          .from('hourly_energy_settlements')
          .select('game_hour, direct_sold_kwh, battery_sold_kwh, price_per_kwh, net_revenue')
          .eq('company_id', companyId)
          .order('game_hour', { ascending: true });

        const dayMap = new Map();
        for (const s of (allSets || [])) {
          const day = Math.floor(Number(s.game_hour) / 24);
          const kwh = Number(s.direct_sold_kwh || 0) + Number(s.battery_sold_kwh || 0);
          const rev = Number(s.net_revenue || 0);
          const existing = dayMap.get(day) || {
            game_day: day,
            start_hour: day * 24,
            end_hour: day * 24 + 23,
            hours_count: 0,
            total_revenue: 0,
            total_kwh: 0,
            avg_price: 0
          };
          existing.hours_count += 1;
          existing.total_revenue += rev;
          existing.total_kwh += kwh;
          dayMap.set(day, existing);
        }
        for (const item of dayMap.values()) {
          item.avg_price = item.total_kwh > 0 ? item.total_revenue / item.total_kwh : 0;
        }
        rows = Array.from(dayMap.values()).sort((a, b) => a.game_day - b.game_day);
      } else {
        rows = rpcRows || [];
      }
    }

    // 4. Map daily records with calendar dates
    const dailyRecords = rows.map((r) => {
      const day = Number(r.game_day);
      const repHour = day * 24 + 12; // Noon of that game day
      const gDate = getGameDate(repHour);

      return {
        gameDay: day,
        startHour: Number(r.start_hour),
        endHour: Number(r.end_hour),
        hoursRecorded: Number(r.hours_count),
        totalRevenue: Number(r.total_revenue || 0),
        totalKwh: Number(r.total_kwh || 0),
        avgPrice: Number(r.avg_price || 0),
        formattedDate: gDate.formattedDate,
        shortDate: `Ay ${gDate.month}, G.${gDate.day}`,
        year: gDate.year,
        month: gDate.month,
        dayOfMonth: gDate.day,
        season: gDate.season
      };
    });

    // 5. Pre-calculate statistics for filter ranges:
    // 1w (last 7 days), 1m (last 30 days), 3m (last 90 days), 6m (last 180 days), 12m (last 365 days / all)
    const calculateRangeStats = (dayCount) => {
      const slice = dayCount ? dailyRecords.slice(-dayCount) : dailyRecords;
      if (slice.length === 0) {
        return {
          dayCount: 0,
          totalRevenue: 0,
          totalKwh: 0,
          avgDailyRevenue: 0,
          peakRevenue: 0,
          peakDay: null,
          growthRatePct: 0,
          series: []
        };
      }

      let totalRev = 0;
      let totalKwh = 0;
      let peakRev = 0;
      let peakDay = null;

      for (const d of slice) {
        totalRev += d.totalRevenue;
        totalKwh += d.totalKwh;
        if (d.totalRevenue > peakRev) {
          peakRev = d.totalRevenue;
          peakDay = d;
        }
      }

      const avgDaily = totalRev / slice.length;

      // Calculate growth rate comparing first half of window to second half
      let growthRatePct = 0;
      if (slice.length >= 2) {
        const mid = Math.floor(slice.length / 2);
        const firstHalf = slice.slice(0, mid);
        const secondHalf = slice.slice(mid);

        const sum1 = firstHalf.reduce((acc, x) => acc + x.totalRevenue, 0);
        const sum2 = secondHalf.reduce((acc, x) => acc + x.totalRevenue, 0);
        const avg1 = sum1 / Math.max(1, firstHalf.length);
        const avg2 = sum2 / Math.max(1, secondHalf.length);

        if (avg1 > 0) {
          growthRatePct = Number((((avg2 - avg1) / avg1) * 100).toFixed(1));
        }
      }

      return {
        dayCount: slice.length,
        totalRevenue: Number(totalRev.toFixed(2)),
        totalKwh: Number(totalKwh.toFixed(1)),
        avgDailyRevenue: Number(avgDaily.toFixed(2)),
        peakRevenue: Number(peakRev.toFixed(2)),
        peakDay: peakDay ? { gameDay: peakDay.gameDay, formattedDate: peakDay.formattedDate, revenue: peakDay.totalRevenue } : null,
        growthRatePct,
        series: slice
      };
    };

    return NextResponse.json({
      success: true,
      companyId,
      siteInfo,
      siteFinancials,
      currentGameHour,
      currentDay,
      totalDaysRecorded: dailyRecords.length,
      allTimeRevenue: Number(dailyRecords.reduce((acc, d) => acc + d.totalRevenue, 0).toFixed(2)),
      dailyRecords,
      ranges: {
        '1w': calculateRangeStats(7),
        '1m': calculateRangeStats(30),
        '3m': calculateRangeStats(90),
        '6m': calculateRangeStats(180),
        '12m': calculateRangeStats(365),
        all: calculateRangeStats(null)
      }
    });
  } catch (err) {
    console.error('Revenue History API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
