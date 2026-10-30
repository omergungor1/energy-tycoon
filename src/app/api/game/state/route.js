import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCurrentGameHour, getGameDate } from '@/lib/simulation/clock';
import { getHourlySpotPrice, getPriceRange } from '@/lib/simulation/market';
import { calculateCompanyNetWorth } from '@/lib/simulation/finance';
import { processCompanySimulationTick } from '@/lib/simulation/tick-runner';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Get or create company for this user
    let { data: company } = await admin
      .from('companies')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    // If company does not exist (trigger race condition or existing user), initialize it now
    if (!company) {
      const defaultName = (user.user_metadata?.company_name || user.email?.split('@')[0] || 'CleanEnergy') + ' Corp';
      const { data: newComp, error: createCompErr } = await admin
        .from('companies')
        .insert({
          owner_user_id: user.id,
          name: defaultName,
          cash: 100000.00,
          xp: 0,
          level: 1,
          status: 'active',
          visits_enabled: true
        })
        .select()
        .single();

      if (createCompErr) {
        throw new Error('Failed to create company: ' + createCompErr.message);
      }
      company = newComp;

      // Assign starter site & starter turbine
      const { data: cSite } = await admin
        .from('company_sites')
        .insert({
          company_id: company.id,
          site_id: 1,
          tenure_type: 'lease',
          lease_expires_game_hour: 8760,
          is_explored: true,
          plant_name: 'Alpha Wind Farm'
        })
        .select()
        .single();

      if (cSite) {
        await admin.from('grid_connections').insert({
          company_id: company.id,
          company_site_id: cSite.id,
          capacity_mw: 2.0,
          distance_km: 3.5,
          connection_fee_paid: 0
        });

        await admin.from('battery_settings').insert({
          company_id: company.id,
          company_site_id: cSite.id,
          stored_kwh: 0,
          min_sell_price: 0.0800,
          reserve_percentage: 20.0,
          charge_mode: 'smart'
        });

        await admin.from('installed_assets').insert({
          company_id: company.id,
          company_site_id: cSite.id,
          catalog_id: 'turb_vestas_v90',
          position_x: 0,
          position_y: 0,
          position_z: 0,
          installed_game_hour: 0,
          condition: 100.0,
          degradation_factor: 1.0,
          last_maintenance_game_hour: 0,
          next_maintenance_game_hour: 4380,
          status: 'generating',
          salvage_value: 25000.0
        });
      }

      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `grant_${company.id}`,
        entry_type: 'initial_grant',
        amount: 100000.00,
        balance_after: 100000.00,
        game_hour: 0,
        description: 'Initial Government Energy Entrepreneurship Grant',
        metadata: { amount: 100000 }
      });
    }

    // 2. Run simulation tick to catch up any offline hours
    await processCompanySimulationTick(company.id);

    // Re-fetch updated company
    const { data: freshCompany } = await admin
      .from('companies')
      .select('*')
      .eq('id', company.id)
      .single();

    // 3. Load full game state data in parallel
    const [
      simStateRes,
      worldSitesRes,
      catalogRes,
      companySitesRes,
      installedAssetsRes,
      gridRes,
      batteryRes,
      loansRes,
      notificationsRes,
      recentSettlementsRes,
      leaderboardRes
    ] = await Promise.all([
      admin.from('simulation_state').select('*').eq('id', 1).single(),
      admin.from('world_sites').select('*').order('id', { ascending: true }),
      admin.from('equipment_catalog').select('*').order('cost_usd', { ascending: true }),
      admin.from('company_sites').select('*, world_sites(*)').eq('company_id', company.id),
      admin.from('installed_assets').select('*, equipment_catalog(*)').eq('company_id', company.id),
      admin.from('grid_connections').select('*').eq('company_id', company.id),
      admin.from('battery_settings').select('*').eq('company_id', company.id),
      admin.from('loans').select('*').eq('company_id', company.id).eq('status', 'active'),
      admin.from('company_notifications').select('*').eq('company_id', company.id).order('created_at', { ascending: false }).limit(20),
      admin.from('hourly_energy_settlements').select('*').eq('company_id', company.id).order('game_hour', { ascending: false }).limit(24),
      admin.from('companies').select('id, name, level, cash, xp').order('cash', { ascending: false }).limit(20)
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

    // Calculate Financial Net Worth
    const finance = calculateCompanyNetWorth({
      cash: freshCompany?.cash || 0,
      installedAssets: installedAssetsRes.data || [],
      companySites: companySitesRes.data || [],
      gridConnections: gridRes.data || [],
      activeLoans: loansRes.data || []
    });

    // Total generation capacity in kW
    let totalCapacityKw = 0;
    for (const a of (installedAssetsRes.data || [])) {
      if (a.equipment_catalog?.equipment_type !== 'battery') {
        totalCapacityKw += Number(a.equipment_catalog?.capacity_kw || 0);
      }
    }

    return NextResponse.json({
      success: true,
      clock,
      spotPrice,
      priceChart,
      company: freshCompany || company,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0]
      },
      worldSites: worldSitesRes.data || [],
      equipmentCatalog: catalogRes.data || [],
      companySites: companySitesRes.data || [],
      installedAssets: installedAssetsRes.data || [],
      gridConnections: gridRes.data || [],
      batterySettings: batteryRes.data || [],
      activeLoans: loansRes.data || [],
      notifications: notificationsRes.data || [],
      recentSettlements: recentSettlementsRes.data || [],
      leaderboard: leaderboardRes.data || [],
      finance,
      totalCapacityKw
    });
  } catch (err) {
    console.error('State API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
