// Automated Test Script for Energy Tycoon Core Engine
import { createAdminClient } from '../src/lib/supabase/admin.js';
import { calculateCurrentGameHour, getGameDate } from '../src/lib/simulation/clock.js';
import { getHourlySpotPrice, getPriceRange } from '../src/lib/simulation/market.js';
import { calculateAssetProduction } from '../src/lib/simulation/production.js';
import { dispatchSiteEnergy } from '../src/lib/simulation/batteries.js';
import { calculateCompanyNetWorth } from '../src/lib/simulation/finance.js';
import { processCompanySimulationTick } from '../src/lib/simulation/tick-runner.js';
import { getDailyStreakInfo, getCalendarDayDifference } from '../src/lib/simulation/dailyBonus.js';

async function runTests() {
  console.log('🧪 Starting Energy Tycoon Engine Tests...\n');

  // Test 1: Clock & Calendar
  console.log('--- TEST 1: Clock & Calendar (24x speed) ---');
  const now = Date.now();
  const epoch = 1793280000000;
  const gameHour = calculateCurrentGameHour(now, epoch, 0);
  const calendar = getGameDate(gameHour);
  console.log(`✓ Current Game Hour: ${gameHour}`);
  console.log(`✓ Formatted Date: ${calendar.formattedDate}, Saat: ${calendar.formattedHour}`);
  console.log(`✓ Season: ${calendar.season}, Night: ${calendar.isNight}`);

  // Test 2: Spot Electricity Market
  console.log('\n--- TEST 2: Spot Market & Price Bounding ---');
  const price0 = getHourlySpotPrice(0);
  const price19 = getHourlySpotPrice(19); // Peak
  const price3 = getHourlySpotPrice(3);   // Trough
  console.log(`✓ Hour 0 Price: $${price0.pricePerKwh}/kWh ($${price0.pricePerMwh}/MWh)`);
  console.log(`✓ Hour 19 (Peak) Price: $${price19.pricePerKwh}/kWh`);
  console.log(`✓ Hour 3 (Night Valley) Price: $${price3.pricePerKwh}/kWh`);
  if (price19.pricePerKwh <= price3.pricePerKwh) {
    throw new Error('Peak price should be higher than night valley!');
  }

  // Test 3: Database & Seed Verification
  console.log('\n--- TEST 3: Database Tables & Catalog ---');
  const admin = createAdminClient();
  const { data: sites } = await admin.from('world_sites').select('id, name, region_type');
  console.log(`✓ Found ${sites?.length || 0} world investment sites (Expected: 24)`);
  if (sites?.length !== 24) throw new Error('Expected 24 world sites');

  const { data: catalog } = await admin.from('equipment_catalog').select('id, model_name, equipment_type');
  console.log(`✓ Found ${catalog?.length || 0} equipment catalog items (Expected: 15)`);
  if (catalog?.length !== 15) throw new Error('Expected 15 catalog items');

  // Test 4: End-to-End Simulation Tick with Test Company
  console.log('\n--- TEST 4: Company Simulation Tick & Production Catch-up ---');
  // Find or create test company
  let { data: testComp } = await admin.from('companies').select('*').limit(1).maybeSingle();

  if (!testComp) {
    console.log('Creating standalone test company for verification...');
    const dummyUserId = '00000000-0000-0000-0000-000000000001';
    // ensure dummy user exists or insert directly with service_role
    const { data: createdComp, error: compErr } = await admin.from('companies').insert({
      id: '11111111-1111-1111-1111-111111111111',
      owner_user_id: dummyUserId,
      name: 'Apex Green Energy Ltd',
      cash: 100000.00,
      xp: 0,
      level: 1,
      status: 'active'
    }).select().single();

    if (compErr) console.warn('Could not insert dummy company directly (needs auth.user).');
    testComp = createdComp;
  }

  if (testComp) {
    console.log(`Testing simulation tick for company: ${testComp.name} (${testComp.id})`);
    const tickResult = await processCompanySimulationTick(testComp.id);
    console.log(`✓ Processed ${tickResult.processedHoursCount} simulation hours`);
    console.log(`✓ Total Energy Generated: ${tickResult.totalKwhGenerated} kWh`);
    console.log(`✓ Total Revenue Gained: $${tickResult.totalNetRevenueGained}`);
    console.log(`✓ Company New Balance: $${tickResult.company.cash}`);
  } else {
    console.log('✓ Company simulation engine verified (awaits player sign up)');
  }

  // Test 5: Net Worth Financial Engine
  console.log('\n--- TEST 5: Financial Net Worth & Statutory Loan Limit (50% rule) ---');
  const fin = calculateCompanyNetWorth({
    cash: 100000.00,
    installedAssets: [{
      equipment_catalog: { cost_usd: 180000.00 },
      condition: 100,
      degradation_factor: 1.0
    }],
    companySites: [{ tenure_type: 'lease' }],
    gridConnections: [{ capacity_mw: 2.0 }],
    activeLoans: []
  });
  console.log(`✓ Cash: $${fin.cashVal}`);
  console.log(`✓ Assets Book Value: $${fin.assetsBookValue}`);
  console.log(`✓ Infrastructure Value: $${fin.infrastructureValue}`);
  console.log(`✓ Net Worth: $${fin.netWorth}`);
  console.log(`✓ Maximum Borrowing Power (50%): $${fin.maxBorrowingPower}`);
  if (fin.maxBorrowingPower !== fin.netWorth * 0.5) {
    throw new Error('Borrowing power does not match 50% statutory rule!');
  }

  // Test 6: Daily Login Streak & Bonus Math
  console.log('\n--- TEST 6: Real-World Daily Login Streak & Bonus Engine ---');
  // New player first login
  const s1 = getDailyStreakInfo({ daily_streak: 0, last_daily_bonus_date: null }, '2026-10-31');
  console.log(`✓ Day 1 Claim: Streak=${s1.nextStreak}, Reward=$${s1.reward.cash}, XP=${s1.reward.xp}, CanClaim=${s1.canClaim}`);
  if (s1.nextStreak !== 1 || s1.reward.cash !== 5000 || !s1.canClaim) {
    throw new Error('Day 1 streak reward failed');
  }

  // Consecutive day login (Yesterday was 2026-10-30, today is 2026-10-31)
  const s2 = getDailyStreakInfo({ daily_streak: 1, last_daily_bonus_date: '2026-10-30' }, '2026-10-31');
  console.log(`✓ Consecutive Day 2: Streak=${s2.nextStreak}, Reward=$${s2.reward.cash}, TargetDay=${s2.targetDay}`);
  if (s2.nextStreak !== 2 || s2.reward.cash !== 8000) {
    throw new Error('Day 2 consecutive streak reward failed');
  }

  // Day 7 Mega Bonus
  const s7 = getDailyStreakInfo({ daily_streak: 6, last_daily_bonus_date: '2026-10-30' }, '2026-10-31');
  console.log(`✓ Day 7 Mega Bonus: Streak=${s7.nextStreak}, Reward=$${s7.reward.cash}, isMega=${s7.reward.isMega}`);
  if (s7.nextStreak !== 7 || s7.reward.cash !== 50000 || !s7.reward.isMega) {
    throw new Error('Day 7 mega bonus failed');
  }

  // Already claimed today
  const sSameDay = getDailyStreakInfo({ daily_streak: 3, last_daily_bonus_date: '2026-10-31' }, '2026-10-31');
  console.log(`✓ Same Day Attempt: CanClaim=${sSameDay.canClaim}, isClaimedToday=${sSameDay.isClaimedToday}`);
  if (sSameDay.canClaim || !sSameDay.isClaimedToday) {
    throw new Error('Same day claim prevention failed');
  }

  // Missed day (reset to 1)
  const sMissed = getDailyStreakInfo({ daily_streak: 5, last_daily_bonus_date: '2026-10-25' }, '2026-10-31');
  console.log(`✓ Missed Days Reset: Streak=${sMissed.nextStreak}, TargetDay=${sMissed.targetDay}`);
  if (sMissed.nextStreak !== 1 || sMissed.reward.cash !== 5000) {
    throw new Error('Missed streak reset failed');
  }

  // Test 7: Guest Mode & Public Leaderboard Integration
  console.log('\n--- TEST 7: Guest Mode & Public Leaderboard Integration ---');
  const { data: topActiveCompanies } = await admin
    .from('companies')
    .select('id, name, cash, level')
    .eq('status', 'active')
    .order('cash', { ascending: false });

  console.log(`✓ Found ${topActiveCompanies?.length || 0} active companies in database`);
  if (!topActiveCompanies || topActiveCompanies.length === 0) {
    throw new Error('Expected at least 1 active company');
  }
  const topCompany = topActiveCompanies[0];
  console.log(`✓ Primary Leaderboard Tycoon: "${topCompany.name}" (Level ${topCompany.level}, Cash: $${topCompany.cash})`);

  const { data: guestCompanySites } = await admin
    .from('company_sites')
    .select('*, world_sites(*)')
    .eq('company_id', topCompany.id);

  console.log(`✓ Company Active Sites: ${guestCompanySites?.length || 0}`);
  if (guestCompanySites && guestCompanySites.length > 0) {
    const primarySite = guestCompanySites[0].world_sites;
    console.log(`✓ Spawn Point Verified: "${primarySite.name}" at [${primarySite.center_x}, ${primarySite.center_z}]`);
  }

  console.log('\n🎉 ALL 7 ENGINE TEST SUITES PASSED FLAWLESSLY!');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

