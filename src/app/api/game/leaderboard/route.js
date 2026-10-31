import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCompanyNetWorth } from '@/lib/simulation/finance';
import { calculateCurrentGameHour, getGameDate } from '@/lib/simulation/clock';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Fetch simulation state for current game clock
    const { data: simState } = await admin
      .from('simulation_state')
      .select('*')
      .eq('id', 1)
      .single();

    const simEpoch = simState || { epoch_real_utc_ms: Date.now(), epoch_game_hour: 0, world_seed: 42 };
    const currentGameHour = calculateCurrentGameHour(
      Date.now(),
      Number(simEpoch.epoch_real_utc_ms),
      Number(simEpoch.epoch_game_hour)
    );
    const clock = getGameDate(currentGameHour);

    // 2. Fetch top 5 real active companies only
    const { data: companies, error: compErr } = await admin
      .from('companies')
      .select('id, name, level, cash, xp, status, created_at')
      .eq('status', 'active')
      .order('cash', { ascending: false })
      .limit(5);

    if (compErr) {
      throw compErr;
    }

    const compIds = (companies || []).map((c) => c.id);

    // 3. Fetch company sites and installed assets
    let companySites = [];
    let installedAssets = [];

    if (compIds.length > 0) {
      const [sitesRes, assetsRes] = await Promise.all([
        admin
          .from('company_sites')
          .select('*, world_sites(id, name, region_type, center_x, center_z, purchase_price, base_wind_potential, base_solar_potential)')
          .in('company_id', compIds),
        admin
          .from('installed_assets')
          .select('*, equipment_catalog(id, model_name, equipment_type, cost_usd, capacity_kw)')
          .in('company_id', compIds)
      ]);

      companySites = sitesRes.data || [];
      installedAssets = assetsRes.data || [];
    }

    // 4. Calculate Net Worth and format leaderboard items
    const formattedLeaders = (companies || []).map((comp) => {
      const cSites = companySites.filter((s) => s.company_id === comp.id);
      const cAssets = installedAssets.filter((a) => a.company_id === comp.id);

      const finance = calculateCompanyNetWorth({
        cash: comp.cash || 0,
        installedAssets: cAssets,
        companySites: cSites,
        gridConnections: [],
        activeLoans: []
      });

      // Calculate generation capacity
      let totalCapacityKw = 0;
      for (const a of cAssets) {
        if (a.equipment_catalog?.equipment_type !== 'battery') {
          totalCapacityKw += Number(a.equipment_catalog?.capacity_kw || 0);
        }
      }

      // Primary site for car spawning and preview
      const primarySite = cSites[0]?.world_sites || {
        id: 1,
        name: 'Whispering Pines Ridge',
        region_type: 'wind',
        center_x: -450,
        center_z: -320
      };

      // Player game day calculation
      const createdMs = comp.created_at ? new Date(comp.created_at).getTime() : Date.now();
      const elapsedHours = Math.max(1, Math.floor((Date.now() - createdMs) / (150 * 1000)));
      const playerDay = Math.max(1, Math.floor(elapsedHours / 24));

      return {
        id: comp.id,
        name: comp.name,
        level: comp.level || 1,
        xp: comp.xp || 0,
        cash: Number(comp.cash || 0),
        netWorth: finance.netWorth,
        totalCapacityKw,
        siteCount: cSites.length,
        assetCount: cAssets.length,
        playerDay,
        primarySite: {
          id: primarySite.id,
          name: primarySite.name,
          region_type: primarySite.region_type,
          center_x: Number(primarySite.center_x),
          center_z: Number(primarySite.center_z)
        }
      };
    });

    // Sort real players by net worth descending and ensure strictly top 5
    formattedLeaders.sort((a, b) => b.netWorth - a.netWorth);
    const top5Leaders = formattedLeaders.slice(0, 5);

    return NextResponse.json({
      success: true,
      clock,
      leaderboard: top5Leaders
    });
  } catch (err) {
    console.error('Public Leaderboard API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
