import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateCurrentGameHour } from '@/lib/simulation/clock';
import { calculateCompanyNetWorth, LOAN_TERMS } from '@/lib/simulation/finance';
import { getDailyStreakInfo } from '@/lib/simulation/dailyBonus';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, payload } = body;

    const admin = createAdminClient();

    // 1. Get user's company
    const { data: company, error: compErr } = await admin
      .from('companies')
      .select('*')
      .eq('owner_user_id', user.id)
      .single();

    if (compErr || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Current game hour from simulation state
    const { data: simState } = await admin.from('simulation_state').select('*').eq('id', 1).single();
    const currentHour = calculateCurrentGameHour(
      Date.now(),
      Number(simState?.epoch_real_utc_ms || Date.now()),
      Number(simState?.epoch_game_hour || 0)
    );

    // =========================================================================
    // ACTION 1: BUY_EQUIPMENT
    // =========================================================================
    if (action === 'BUY_EQUIPMENT') {
      const { catalogId, companySiteId, position } = payload || {};
      if (!catalogId || !companySiteId) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      // Verify site belongs to company
      const { data: cSite } = await admin
        .from('company_sites')
        .select('*')
        .eq('id', companySiteId)
        .eq('company_id', company.id)
        .single();

      if (!cSite) {
        return NextResponse.json({ error: 'Invalid plant site' }, { status: 403 });
      }

      // Fetch catalog equipment
      const { data: item } = await admin
        .from('equipment_catalog')
        .select('*')
        .eq('id', catalogId)
        .single();

      if (!item) {
        return NextResponse.json({ error: 'Equipment model not found' }, { status: 404 });
      }

      // Check level requirement
      if (company.level < item.min_level_required) {
        return NextResponse.json({
          error: `Yetersiz Seviye: Bu ekipman için Seviye ${item.min_level_required} gereklidir.`
        }, { status: 400 });
      }

      // Check funds
      const cost = Number(item.cost_usd);
      if (Number(company.cash) < cost) {
        return NextResponse.json({ error: 'Yetersiz nakit bakiye!' }, { status: 400 });
      }

      const newBalance = Number((Number(company.cash) - cost).toFixed(2));

      // Deduct cash
      await admin.from('companies').update({ cash: newBalance }).eq('id', company.id);

      // Orderly spaced lattice placement across the expansive power plant territory
      const { data: existingAssets } = await admin
        .from('installed_assets')
        .select('id, position_x, position_z')
        .eq('company_site_id', cSite.id);

      const assetCount = (existingAssets || []).length;

      // Realistic 40m - 60m wake spacing positions across the expansive site
      const TURBINE_SLOTS = [
        { x: -32, z: -24 },
        { x: 34, z: 26 },
        { x: 38, z: -28 },
        { x: -36, z: 32 },
        { x: 0, z: -48 },
        { x: 0, z: 48 },
        { x: -52, z: 0 },
        { x: 52, z: 0 }
      ];
      const slot = TURBINE_SLOTS[assetCount % TURBINE_SLOTS.length];
      const posX = Number(position?.x ?? slot.x);
      const posZ = Number(position?.z ?? slot.z);

      const { data: installedAsset, error: installErr } = await admin
        .from('installed_assets')
        .insert({
          company_id: company.id,
          company_site_id: cSite.id,
          catalog_id: item.id,
          position_x: posX,
          position_y: 0,
          position_z: posZ,
          rotation_y: (assetCount * 45) % 360,
          installed_game_hour: currentHour,
          condition: 100.0,
          degradation_factor: 1.0,
          last_maintenance_game_hour: currentHour,
          next_maintenance_game_hour: currentHour + 4380,
          status: 'generating',
          salvage_value: Number((cost * 0.15).toFixed(2))
        })
        .select('*, equipment_catalog(*)')
        .single();

      if (installErr) {
        throw new Error('Failed to install asset: ' + installErr.message);
      }

      // Auto-upgrade grid connection capacity if total site generation capacity exceeds it
      if (item.equipment_type !== 'battery') {
        const { data: gridConn } = await admin
          .from('grid_connections')
          .select('*')
          .eq('company_site_id', cSite.id)
          .single();

        if (gridConn) {
          const { data: allSiteAssets } = await admin
            .from('installed_assets')
            .select('*, equipment_catalog(*)')
            .eq('company_site_id', cSite.id);

          const totalKw = (allSiteAssets || []).reduce(
            (sum, a) =>
              sum +
              (a.equipment_catalog?.equipment_type !== 'battery'
                ? Number(a.equipment_catalog?.capacity_kw || 0)
                : 0),
            0
          );
          const neededMw = Math.ceil(totalKw / 1000.0);
          if (neededMw > Number(gridConn.capacity_mw || 0)) {
            await admin
              .from('grid_connections')
              .update({ capacity_mw: neededMw })
              .eq('id', gridConn.id);
          }
        }
      }

      // Ledger entry
      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `buy_equip_${company.id}_${Date.now()}_${Math.random()}`,
        entry_type: 'equipment_purchase',
        amount: -cost,
        balance_after: newBalance,
        game_hour: currentHour,
        description: `${item.model_name} Satın Alındı ve ${cSite.plant_name} Santraline Kuruldu`,
        metadata: { catalog_id: item.id, cost, site_id: cSite.id }
      });

      return NextResponse.json({
        success: true,
        message: `${item.model_name} satın alındı! 1 haftalık vinç ve montaj kurulum süreci sahada başladı.`,
        newBalance,
        asset: installedAsset
      });
    }

    // =========================================================================
    // ACTION 2: LEASE_SITE
    // =========================================================================
    if (action === 'LEASE_SITE') {
      const { siteId, years = 1 } = payload || {};
      const { data: site } = await admin.from('world_sites').select('*').eq('id', siteId).single();
      if (!site) return NextResponse.json({ error: 'Arazi bulunamadı' }, { status: 404 });

      // Check if already leased/owned
      const { data: existing } = await admin
        .from('company_sites')
        .select('*')
        .eq('company_id', company.id)
        .eq('site_id', siteId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Bu araziye zaten sahipsiniz veya kiraladınız.' }, { status: 400 });
      }

      const leaseCost = Number(site.lease_price_annual) * Number(years);
      if (Number(company.cash) < leaseCost) {
        return NextResponse.json({ error: 'Yetersiz nakit bakiye!' }, { status: 400 });
      }

      const newBalance = Number((Number(company.cash) - leaseCost).toFixed(2));
      await admin.from('companies').update({ cash: newBalance }).eq('id', company.id);

      // Create company site
      const leaseDurationHours = Number(years) * 8760;
      const { data: newSite, error: siteErr } = await admin
        .from('company_sites')
        .insert({
          company_id: company.id,
          site_id: site.id,
          tenure_type: 'lease',
          lease_expires_game_hour: currentHour + leaseDurationHours,
          is_explored: true,
          plant_name: `${site.name} Santrali`
        })
        .select()
        .single();

      if (siteErr) throw new Error(siteErr.message);

      // Grid connection
      await admin.from('grid_connections').insert({
        company_id: company.id,
        company_site_id: newSite.id,
        capacity_mw: 2.0,
        distance_km: site.grid_distance_km,
        connection_fee_paid: 0
      });

      // Default battery setting
      await admin.from('battery_settings').insert({
        company_id: company.id,
        company_site_id: newSite.id,
        stored_kwh: 0,
        min_sell_price: 0.0800,
        reserve_percentage: 20.0,
        charge_mode: 'smart'
      });

      // Ledger entry
      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `lease_site_${company.id}_${site.id}_${Date.now()}`,
        entry_type: 'site_lease',
        amount: -leaseCost,
        balance_after: newBalance,
        game_hour: currentHour,
        description: `${site.name} sahası ${years} oyun yıllığına kiralandı`,
        metadata: { site_id: site.id, years, leaseCost }
      });

      return NextResponse.json({
        success: true,
        message: `${site.name} başarıyla kiralandı!`,
        newBalance,
        site: newSite
      });
    }

    // =========================================================================
    // ACTION 3: BUY_SITE
    // =========================================================================
    if (action === 'BUY_SITE') {
      const { siteId } = payload || {};
      const { data: site } = await admin.from('world_sites').select('*').eq('id', siteId).single();
      if (!site) return NextResponse.json({ error: 'Arazi bulunamadı' }, { status: 404 });

      const purchaseCost = Number(site.purchase_price);
      if (Number(company.cash) < purchaseCost) {
        return NextResponse.json({ error: 'Yetersiz nakit bakiye!' }, { status: 400 });
      }

      const newBalance = Number((Number(company.cash) - purchaseCost).toFixed(2));
      await admin.from('companies').update({ cash: newBalance }).eq('id', company.id);

      // If already leased, convert to own
      const { data: existing } = await admin
        .from('company_sites')
        .select('*')
        .eq('company_id', company.id)
        .eq('site_id', siteId)
        .maybeSingle();

      if (existing) {
        await admin
          .from('company_sites')
          .update({ tenure_type: 'own', lease_expires_game_hour: null })
          .eq('id', existing.id);
      } else {
        const { data: newSite } = await admin
          .from('company_sites')
          .insert({
            company_id: company.id,
            site_id: site.id,
            tenure_type: 'own',
            lease_expires_game_hour: null,
            is_explored: true,
            plant_name: `${site.name} Santrali`
          })
          .select()
          .single();

        await admin.from('grid_connections').insert({
          company_id: company.id,
          company_site_id: newSite.id,
          capacity_mw: 2.0,
          distance_km: site.grid_distance_km,
          connection_fee_paid: 0
        });

        await admin.from('battery_settings').insert({
          company_id: company.id,
          company_site_id: newSite.id,
          stored_kwh: 0,
          min_sell_price: 0.0800,
          reserve_percentage: 20.0,
          charge_mode: 'smart'
        });
      }

      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `buy_site_${company.id}_${site.id}_${Date.now()}`,
        entry_type: 'site_purchase',
        amount: -purchaseCost,
        balance_after: newBalance,
        game_hour: currentHour,
        description: `${site.name} arazisinin tapusu satın alındı`,
        metadata: { site_id: site.id, purchaseCost }
      });

      return NextResponse.json({
        success: true,
        message: `${site.name} tapusu şirketinize tescil edildi!`,
        newBalance
      });
    }

    // =========================================================================
    // ACTION 4: SET_BATTERY_RULES
    // =========================================================================
    if (action === 'SET_BATTERY_RULES') {
      const { companySiteId, minSellPrice, reservePercentage } = payload || {};
      const { error: bErr } = await admin
        .from('battery_settings')
        .update({
          min_sell_price: Number(minSellPrice || 0.0800),
          reserve_percentage: Number(reservePercentage || 20.0)
        })
        .eq('company_id', company.id)
        .eq('company_site_id', companySiteId);

      if (bErr) throw new Error(bErr.message);

      return NextResponse.json({
        success: true,
        message: 'Batarya arbitraj kuralları kaydedildi.'
      });
    }

    // =========================================================================
    // ACTION 5: SERVICE_MAINTENANCE
    // =========================================================================
    if (action === 'SERVICE_MAINTENANCE') {
      const { assetId } = payload || {};
      const maintenanceFee = 5000.00; // Fixed $5,000 standard service

      if (Number(company.cash) < maintenanceFee) {
        return NextResponse.json({ error: 'Yetersiz bakiye (Bakım bedeli: $5.000)' }, { status: 400 });
      }

      const { data: asset } = await admin
        .from('installed_assets')
        .select('*')
        .eq('id', assetId)
        .eq('company_id', company.id)
        .single();

      if (!asset) return NextResponse.json({ error: 'Ekipman bulunamadı' }, { status: 404 });

      const newBalance = Number((Number(company.cash) - maintenanceFee).toFixed(2));
      await admin.from('companies').update({ cash: newBalance }).eq('id', company.id);

      await admin
        .from('installed_assets')
        .update({
          condition: 100.0,
          status: 'generating',
          last_maintenance_game_hour: currentHour,
          next_maintenance_game_hour: currentHour + 4380 // 6 game months
        })
        .eq('id', asset.id);

      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `maint_${asset.id}_${currentHour}`,
        entry_type: 'maintenance_service',
        amount: -maintenanceFee,
        balance_after: newBalance,
        game_hour: currentHour,
        description: `Periyodik Ekipman Bakım Hizmeti (#${asset.id.slice(0, 8)})`,
        metadata: { asset_id: asset.id }
      });

      return NextResponse.json({
        success: true,
        message: 'Bakım başarıyla yapıldı. Kondisyon %100 seviyesine getirildi.',
        newBalance
      });
    }

    // =========================================================================
    // ACTION: UPGRADE_SOLAR_TRACKER
    // =========================================================================
    if (action === 'UPGRADE_SOLAR_TRACKER') {
      const { companySiteId } = payload || {};
      const trackerCost = 28000.00; // $28,000 upgrade investment

      if (!companySiteId) {
        return NextResponse.json({ error: 'Santral sahası belirtilmedi' }, { status: 400 });
      }

      const { data: cSite } = await admin
        .from('company_sites')
        .select('*, world_sites(*)')
        .eq('id', companySiteId)
        .eq('company_id', company.id)
        .single();

      if (!cSite) {
        return NextResponse.json({ error: 'Geçersiz santral sahası' }, { status: 404 });
      }

      if (cSite.has_solar_tracker) {
        return NextResponse.json({ error: 'Bu santralde Güneş Takip Sistemi zaten kurulu!' }, { status: 400 });
      }

      if (Number(company.cash) < trackerCost) {
        return NextResponse.json({
          error: `Yetersiz bakiye! Güneş Takip Sistemi kurulum bedeli: $${trackerCost.toLocaleString()}`
        }, { status: 400 });
      }

      const newBalance = Number((Number(company.cash) - trackerCost).toFixed(2));
      await admin.from('companies').update({ cash: newBalance }).eq('id', company.id);

      await admin
        .from('company_sites')
        .update({ has_solar_tracker: true })
        .eq('id', cSite.id);

      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `tracker_${cSite.id}_${Date.now()}`,
        entry_type: 'infrastructure_upgrade',
        amount: -trackerCost,
        balance_after: newBalance,
        game_hour: currentHour,
        description: `Akıllı Güneş Takip Sistemi (Solar Tracker) Kuruldu: ${cSite.plant_name}`,
        metadata: { site_id: cSite.id, upgrade: 'solar_tracker', cost: trackerCost }
      });

      return NextResponse.json({
        success: true,
        message: `${cSite.plant_name} santraline Akıllı Güneş Takip Sistemi kuruldu! Güneş panelleri artık güneşi takip ederek %25 daha fazla elektrik üretecek.`,
        newBalance
      });
    }

    // =========================================================================
    // ACTION 6: REQUEST_LOAN
    // =========================================================================
    if (action === 'REQUEST_LOAN') {
      const { principal, termYears = 1 } = payload || {};
      const p = Number(principal);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ error: 'Geçersiz kredi tutarı' }, { status: 400 });
      }

      const termConfig = LOAN_TERMS[termYears] || LOAN_TERMS[1];

      // Calculate Net Worth & check statutory 50% limit
      const [installedAssetsRes, companySitesRes, gridRes, loansRes] = await Promise.all([
        admin.from('installed_assets').select('*, equipment_catalog(*)').eq('company_id', company.id),
        admin.from('company_sites').select('*, world_sites(*)').eq('company_id', company.id),
        admin.from('grid_connections').select('*').eq('company_id', company.id),
        admin.from('loans').select('*').eq('company_id', company.id).eq('status', 'active')
      ]);

      const fin = calculateCompanyNetWorth({
        cash: company.cash,
        installedAssets: installedAssetsRes.data || [],
        companySites: companySitesRes.data || [],
        gridConnections: gridRes.data || [],
        activeLoans: loansRes.data || []
      });

      if (p > fin.maxBorrowingPower) {
        return NextResponse.json({
          error: `Kredi Limiti Aşıldı: Maksimum çekebileceğiniz tutar: $${fin.maxBorrowingPower.toLocaleString()}`
        }, { status: 400 });
      }

      // Amortization: Equal monthly payment = (Principal * (1 + annualInterest * termYears)) / totalMonths
      const totalRepayment = p * (1 + (termConfig.annualInterest * termConfig.termYears));
      const monthlyPayment = Number((totalRepayment / termConfig.termMonths).toFixed(2));

      const newBalance = Number((Number(company.cash) + p).toFixed(2));
      await admin.from('companies').update({ cash: newBalance }).eq('id', company.id);

      const { data: newLoan, error: loanErr } = await admin
        .from('loans')
        .insert({
          company_id: company.id,
          principal: p,
          interest_rate_annual: termConfig.annualInterest,
          term_game_years: termConfig.termYears,
          monthly_installment: monthlyPayment,
          remaining_balance: Number(totalRepayment.toFixed(2)),
          overdue_installments: 0,
          status: 'active'
        })
        .select()
        .single();

      if (loanErr) throw new Error(loanErr.message);

      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `loan_disb_${newLoan.id}`,
        entry_type: 'loan_disbursement',
        amount: p,
        balance_after: newBalance,
        game_hour: currentHour,
        description: `Ticari Yatırım Kredisi Kullandırıldı ($${p.toLocaleString()} - ${termConfig.termYears} Yıl Vade)`,
        metadata: { loan_id: newLoan.id, principal: p }
      });

      return NextResponse.json({
        success: true,
        message: `$${p.toLocaleString()} tutarındaki kredi onaylandı ve hesabınıza aktarıldı!`,
        newBalance,
        loan: newLoan
      });
    }

    // =========================================================================
    // ACTION 7: RENAME_SITE
    // =========================================================================
    if (action === 'RENAME_SITE') {
      const { companySiteId, newName } = payload || {};
      if (!newName || newName.trim().length === 0) {
        return NextResponse.json({ error: 'Geçersiz santral adı' }, { status: 400 });
      }

      await admin
        .from('company_sites')
        .update({ plant_name: newName.trim() })
        .eq('id', companySiteId)
        .eq('company_id', company.id);

      return NextResponse.json({ success: true, message: 'Santral adı güncellendi.' });
    }

    // =========================================================================
    // ACTION 8: REPAY_LOAN (Early Payoff / Partial Repayment)
    // =========================================================================
    if (action === 'REPAY_LOAN') {
      const { loanId, amount } = payload || {};
      const payAmount = Number(amount);
      if (isNaN(payAmount) || payAmount <= 0) {
        return NextResponse.json({ error: 'Geçersiz ödeme tutarı' }, { status: 400 });
      }

      const { data: loan, error: loanErr } = await admin
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .eq('company_id', company.id)
        .single();

      if (loanErr || !loan) {
        return NextResponse.json({ error: 'Kredi bulunamadı' }, { status: 404 });
      }

      const currentBalance = Number(company.cash || 0);
      const actualPayment = Math.min(payAmount, Number(loan.remaining_balance));

      if (currentBalance < actualPayment) {
        return NextResponse.json({
          error: `Yetersiz Bakiye: Ödeme tutarı ($${actualPayment.toLocaleString()}), kasanızdaki nakitten ($${currentBalance.toLocaleString()}) fazladır.`
        }, { status: 400 });
      }

      const newRemaining = Number((Number(loan.remaining_balance) - actualPayment).toFixed(2));
      const newCash = Number((currentBalance - actualPayment).toFixed(2));
      const newStatus = newRemaining <= 0 ? 'paid_off' : 'active';

      await admin.from('companies').update({ cash: newCash }).eq('id', company.id);
      await admin.from('loans').update({
        remaining_balance: newRemaining,
        status: newStatus
      }).eq('id', loanId);

      // Ledger entry
      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `repay_loan_${loanId}_${Date.now()}`,
        entry_type: 'loan_repayment',
        amount: -actualPayment,
        balance_after: newCash,
        game_hour: currentHour,
        description: `Kredi Borç Ödemesi (#${loanId.slice(0, 8)} - $${actualPayment.toLocaleString()})`,
        metadata: { loan_id: loanId, payment: actualPayment, remaining: newRemaining }
      });

      return NextResponse.json({
        success: true,
        message: `$${actualPayment.toLocaleString()} tutarındaki kredi borcu başarıyla ödendi! ${newRemaining <= 0 ? 'Kredi tamamen kapatıldı.' : `Kalan borç: $${newRemaining.toLocaleString()}`}`,
        newBalance: newCash,
        remainingBalance: newRemaining
      });
    }

    // =========================================================================
    // ACTION 9: CLAIM_DAILY_BONUS (Real-World Daily Login Streak & Rewards)
    // =========================================================================
    if (action === 'CLAIM_DAILY_BONUS') {
      const { clientDateStr } = payload || {};
      const streakInfo = getDailyStreakInfo(company, clientDateStr);

      if (!streakInfo.canClaim) {
        return NextResponse.json({
          error: 'Bugünkü giriş ödülünüzü zaten aldınız! Yeni ödülünüz yarın hazır olacak.',
          alreadyClaimed: true,
          streak: streakInfo.currentStreak
        }, { status: 400 });
      }

      const reward = streakInfo.reward;
      const newCash = Number((Number(company.cash || 0) + reward.cash).toFixed(2));
      const newXp = Number(company.xp || 0) + reward.xp;
      const newLevel = Math.floor(newXp / 1000) + 1;
      const newStreak = streakInfo.nextStreak;
      const todayStr = streakInfo.todayStr;

      // Update company
      await admin.from('companies').update({
        cash: newCash,
        xp: newXp,
        level: newLevel,
        daily_streak: newStreak,
        last_daily_bonus_date: todayStr,
        total_daily_bonuses_claimed: Number(company.total_daily_bonuses_claimed || 0) + 1
      }).eq('id', company.id);

      // Record in ledger
      await admin.from('ledger_entries').insert({
        company_id: company.id,
        idempotency_key: `daily_bonus_${company.id}_${todayStr}`,
        entry_type: 'daily_bonus',
        amount: reward.cash,
        balance_after: newCash,
        game_hour: currentHour,
        description: `Günlük Giriş Bonusu (Gün ${newStreak}): ${reward.titleTr} (+$${reward.cash.toLocaleString()})`,
        metadata: {
          streak: newStreak,
          dayInCycle: streakInfo.targetDay,
          cash: reward.cash,
          xp: reward.xp,
          date: todayStr
        }
      });

      // Send company notification
      await admin.from('company_notifications').insert({
        company_id: company.id,
        type: 'bonus',
        title: `🎁 ${newStreak}. Gün Giriş Ödülü Alındı!`,
        message: `Tebrikler! ${newStreak} günlük aralıksız giriş serisi tamamlandı. Kasanıza $${reward.cash.toLocaleString()} nakit ve ${reward.xp} XP eklendi. Yatırımlarını aralıksız büyüt!`,
        game_hour: currentHour,
        is_read: false
      });

      return NextResponse.json({
        success: true,
        message: `Tebrikler! ${newStreak}. gün giriş ödülü (+$${reward.cash.toLocaleString()}, +${reward.xp} XP) kasanıza aktarıldı.`,
        reward,
        newStreak,
        newCash,
        newXp,
        newLevel,
        targetDay: streakInfo.targetDay
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Actions API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
