import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCurrentGameHour, getGameDate } from '@/lib/simulation/clock';
import { getHourlySpotPrice, getPriceRange } from '@/lib/simulation/market';
import { calculateCompanyNetWorth } from '@/lib/simulation/finance';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedCompanyId = searchParams.get('companyId');

    const admin = createAdminClient();

    // 1. Simulation clock & world assets
    const [simStateRes, worldSitesRes, catalogRes] = await Promise.all([
      admin.from('simulation_state').select('*').eq('id', 1).single(),
      admin.from('world_sites').select('*').order('id', { ascending: true }),
      admin.from('equipment_catalog').select('*').order('cost_usd', { ascending: true })
    ]);

    const simState = simStateRes.data || { epoch_real_utc_ms: Date.now(), epoch_game_hour: 0, world_seed: 42 };
    const currentGameHour = calculateCurrentGameHour(
      Date.now(),
      Number(simState.epoch_real_utc_ms),
      Number(simState.epoch_game_hour)
    );

    const clock = getGameDate(currentGameHour);
    const spotPrice = getHourlySpotPrice(currentGameHour, simState.world_seed);
    const priceChart = getPriceRange(Math.max(0, currentGameHour - 24), currentGameHour + 24, simState.world_seed);
    const worldSites = worldSitesRes.data || [];
    const equipmentCatalog = catalogRes.data || [];

    // 2. Query Real Player Company
    let targetCompany = null;
    if (requestedCompanyId) {
      const { data: comp } = await admin
        .from('companies')
        .select('*')
        .eq('id', requestedCompanyId)
        .eq('status', 'active')
        .maybeSingle();
      targetCompany = comp;
    }

    // Fallback to top real company if not found or not specified
    if (!targetCompany) {
      const { data: topComps } = await admin
        .from('companies')
        .select('*')
        .eq('status', 'active')
        .order('cash', { ascending: false })
        .limit(1);

      targetCompany = topComps?.[0] || null;
    }

    if (!targetCompany) {
      return NextResponse.json({ error: 'Görüntülenecek aktif oyuncu şirketi bulunamadı.' }, { status: 404 });
    }

    // 3. Fetch company's real sites, assets and loans
    const [compSitesRes, assetsRes, loansRes] = await Promise.all([
      admin
        .from('company_sites')
        .select('*, world_sites(*)')
        .eq('company_id', targetCompany.id),
      admin
        .from('installed_assets')
        .select('*, equipment_catalog(*)')
        .eq('company_id', targetCompany.id),
      admin
        .from('loans')
        .select('*')
        .eq('company_id', targetCompany.id)
        .eq('status', 'active')
    ]);

    const compSites = compSitesRes.data || [];
    const installedAssets = assetsRes.data || [];
    const activeLoans = loansRes.data || [];

    // Calculate Net Worth
    const finance = calculateCompanyNetWorth({
      cash: targetCompany.cash || 0,
      installedAssets,
      companySites: compSites,
      gridConnections: [],
      activeLoans
    });

    // Calculate capacity
    let totalCapacityKw = 0;
    for (const a of installedAssets) {
      if (a.equipment_catalog?.equipment_type !== 'battery') {
        totalCapacityKw += Number(a.equipment_catalog?.capacity_kw || 0);
      }
    }

    // Calculate player game day
    const createdMs = targetCompany.created_at ? new Date(targetCompany.created_at).getTime() : Date.now();
    const elapsedHours = Math.max(1, Math.floor((Date.now() - createdMs) / (150 * 1000)));
    const playerDay = Math.max(1, Math.floor(elapsedHours / 24));

    // Determine primary spawn coordinates (site center)
    const primarySite = compSites[0]?.world_sites || worldSites[0] || { center_x: -450, center_z: -320 };
    const spawnCoordinates = [Number(primarySite.center_x), Number(primarySite.center_z)];

    return NextResponse.json({
      success: true,
      isGuest: true,
      clock,
      spotPrice,
      priceChart,
      company: {
        id: targetCompany.id,
        name: targetCompany.name,
        level: targetCompany.level || 1,
        cash: Number(targetCompany.cash || 0),
        xp: targetCompany.xp || 0,
        status: targetCompany.status,
        created_at: targetCompany.created_at
      },
      companySites: compSites,
      installedAssets,
      worldSites,
      equipmentCatalog,
      finance,
      totalCapacityKw,
      playerDay,
      spawnCoordinates
    });
  } catch (err) {
    console.error('Public State API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
