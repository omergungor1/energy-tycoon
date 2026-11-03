import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCurrentGameHour, getGameDate } from '@/lib/simulation/clock';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');

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

    // 3. Call Postgres RPC function to aggregate daily revenue
    const { data: rpcRows, error: rpcErr } = await admin.rpc(
      'get_company_daily_revenue',
      { p_company_id: companyId }
    );

    if (rpcErr) {
      console.error('RPC Error get_company_daily_revenue:', rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    const rows = rpcRows || [];

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
