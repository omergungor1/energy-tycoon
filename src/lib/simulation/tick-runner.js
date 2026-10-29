// Energy Tycoon - Master Simulation Tick Runner
// Server-authoritative execution of offline catch-up and hourly cycles

import { createAdminClient } from '../supabase/admin.js';
import { calculateCurrentGameHour } from './clock.js';
import { getHourlySpotPrice, getPriceRange, MARKET_COMMISSION_RATE } from './market.js';
import { calculateAssetProduction } from './production.js';
import { dispatchSiteEnergy } from './batteries.js';

export async function processCompanySimulationTick(companyId) {
  const supabase = createAdminClient();

  // 1. Fetch simulation state
  const { data: simState, error: simErr } = await supabase
    .from('simulation_state')
    .select('*')
    .eq('id', 1)
    .single();

  if (simErr || !simState) {
    throw new Error('Simulation state not found: ' + (simErr?.message || ''));
  }

  const targetGameHour = calculateCurrentGameHour(
    Date.now(),
    Number(simState.epoch_real_utc_ms),
    Number(simState.epoch_game_hour)
  );

  // 2. Fetch company and sites
  const { data: company, error: compErr } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (compErr || !company) {
    throw new Error('Company not found: ' + (compErr?.message || ''));
  }

  // Find last processed hour for this company
  const { data: lastSettlement } = await supabase
    .from('hourly_energy_settlements')
    .select('game_hour')
    .eq('company_id', companyId)
    .order('game_hour', { ascending: false })
    .limit(1);

  let lastProcessedHour = lastSettlement && lastSettlement.length > 0
    ? Number(lastSettlement[0].game_hour)
    : 0;

  // Catch-up: process missing hours up to targetGameHour (cap at 72 hours per tick batch)
  const hoursToProcess = [];
  const maxHoursInBatch = 72;
  const startHour = lastProcessedHour + 1;
  const endHour = Math.min(targetGameHour, startHour + maxHoursInBatch - 1);

  if (startHour <= endHour) {
    for (let h = startHour; h <= endHour; h++) {
      hoursToProcess.push(h);
    }
  }

  if (hoursToProcess.length === 0) {
    return {
      success: true,
      processedHoursCount: 0,
      currentHour: targetGameHour,
      company
    };
  }

  // 3. Load company's sites, installed assets, catalog, grid connections, battery settings
  const { data: companySites } = await supabase
    .from('company_sites')
    .select('*, world_sites(*)')
    .eq('company_id', companyId);

  const { data: installedAssets } = await supabase
    .from('installed_assets')
    .select('*, equipment_catalog(*)')
    .eq('company_id', companyId);

  const { data: gridConns } = await supabase
    .from('grid_connections')
    .select('*')
    .eq('company_id', companyId);

  const { data: batterySettingsList } = await supabase
    .from('battery_settings')
    .select('*')
    .eq('company_id', companyId);

  let totalNetRevenueGained = 0;
  let totalKwhGenerated = 0;
  let runningCash = Number(company.cash);
  let runningXp = Number(company.xp);

  const productionBatch = [];
  const settlementBatch = [];
  const ledgerBatch = [];

  for (const h of hoursToProcess) {
    const market = getHourlySpotPrice(h, simState.world_seed);
    const forecast = getPriceRange(h, h + 24, simState.world_seed);
    const next24hMax = Math.max(...forecast.map(p => p.pricePerKwh));

    for (const cSite of (companySites || [])) {
      const siteAssets = (installedAssets || []).filter(a => a.company_site_id === cSite.id);
      const gridConn = (gridConns || []).find(g => g.company_site_id === cSite.id);
      const bSettings = (batterySettingsList || []).find(b => b.company_site_id === cSite.id);
      const batteryAssets = siteAssets.filter(a => a.equipment_catalog?.equipment_type === 'battery');

      let siteWindKwh = 0;
      let siteSolarKwh = 0;

      for (const asset of siteAssets) {
        const prod = calculateAssetProduction(
          asset,
          asset.equipment_catalog,
          cSite.world_sites,
          h,
          simState.world_seed,
          cSite
        );
        if (asset.equipment_catalog?.equipment_type === 'wind_turbine') {
          siteWindKwh += prod;
        } else if (asset.equipment_catalog?.equipment_type === 'solar_pack') {
          siteSolarKwh += prod;
        }
      }

      const siteTotalGenKwh = siteWindKwh + siteSolarKwh;
      totalKwhGenerated += siteTotalGenKwh;

      // 2 MW default grid line capacity = 2000 kW
      const gridCapacityKw = (gridConn?.capacity_mw || 2.0) * 1000.0;

      const energyResult = dispatchSiteEnergy({
        totalGeneratedKwh: siteTotalGenKwh,
        batterySettings: bSettings,
        batteryAssets: batteryAssets.map(b => b.equipment_catalog),
        gridCapacityKw,
        currentPricePerKwh: market.pricePerKwh,
        next24hMaxPrice: next24hMax
      });

      // Financials
      const grossRev = energyResult.totalSoldKwh * market.pricePerKwh;
      const fee = grossRev * MARKET_COMMISSION_RATE;
      const netRev = Math.max(0, grossRev - fee);

      totalNetRevenueGained += netRev;
      runningCash += netRev;

      // Update battery stored energy in memory
      if (bSettings) {
        bSettings.stored_kwh = energyResult.newStoredEnergyKwh;
      }

      // Record hourly production
      productionBatch.push({
        company_id: companyId,
        company_site_id: cSite.id,
        game_hour: h,
        wind_kwh: Number(siteWindKwh.toFixed(2)),
        solar_kwh: Number(siteSolarKwh.toFixed(2)),
        total_kwh: Number(siteTotalGenKwh.toFixed(2)),
        stored_kwh: energyResult.energyToBatteryKwh,
        curtailed_kwh: energyResult.curtailedKwh,
        sold_kwh: energyResult.totalSoldKwh
      });

      // Record energy settlement
      settlementBatch.push({
        company_id: companyId,
        company_site_id: cSite.id,
        game_hour: h,
        direct_sold_kwh: energyResult.directSoldKwh,
        battery_sold_kwh: energyResult.batterySoldKwh,
        price_per_kwh: market.pricePerKwh,
        gross_revenue: Number(grossRev.toFixed(2)),
        market_fee: Number(fee.toFixed(2)),
        net_revenue: Number(netRev.toFixed(2))
      });

      // Ledger entry (if there was electricity revenue)
      if (netRev > 0) {
        ledgerBatch.push({
          company_id: companyId,
          idempotency_key: `energy_${companyId}_${cSite.id}_${h}`,
          entry_type: 'electricity_sales',
          amount: Number(netRev.toFixed(2)),
          balance_after: Number(runningCash.toFixed(2)),
          game_hour: h,
          description: `Elektrik Satış Geliri (Saat ${h % 24}:00, ${energyResult.totalSoldKwh} kWh @ $${market.pricePerKwh}/kWh)`,
          metadata: {
            game_hour: h,
            kwh_sold: energyResult.totalSoldKwh,
            price_per_kwh: market.pricePerKwh,
            market_fee: fee
          }
        });
      }
    }

    // Award XP: 1 XP per 50 kWh generated
    runningXp += Math.floor(totalKwhGenerated / 50);
  }

  // Level up calculation (every 1000 XP = 1 Level)
  const newLevel = Math.max(company.level, Math.floor(runningXp / 1000) + 1);

  // 4. Batch inserts and updates in Supabase
  if (productionBatch.length > 0) {
    await supabase.from('hourly_production').upsert(productionBatch, { onConflict: 'company_site_id,game_hour' });
  }
  if (settlementBatch.length > 0) {
    await supabase.from('hourly_energy_settlements').upsert(settlementBatch, { onConflict: 'company_site_id,game_hour' });
  }
  if (ledgerBatch.length > 0) {
    await supabase.from('ledger_entries').upsert(ledgerBatch, { onConflict: 'idempotency_key' });
  }

  // Update battery settings
  for (const bSettings of (batterySettingsList || [])) {
    await supabase
      .from('battery_settings')
      .update({ stored_kwh: bSettings.stored_kwh })
      .eq('id', bSettings.id);
  }

  // Update company cash, xp, level
  const { data: updatedCompany } = await supabase
    .from('companies')
    .update({
      cash: Number(runningCash.toFixed(2)),
      xp: runningXp,
      level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq('id', companyId)
    .select()
    .single();

  return {
    success: true,
    processedHoursCount: hoursToProcess.length,
    fromHour: startHour,
    toHour: endHour,
    totalNetRevenueGained: Number(totalNetRevenueGained.toFixed(2)),
    totalKwhGenerated: Number(totalKwhGenerated.toFixed(2)),
    company: updatedCompany || company
  };
}

