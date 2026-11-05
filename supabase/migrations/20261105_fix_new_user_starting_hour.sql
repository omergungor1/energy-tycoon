-- Migration: Fix New User Initial Game Hour & Prevent Retroactive Energy Simulation
-- Ensures newly registered users start at current game hour instead of game hour 0

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_site_id INT := 1; -- Whispering Pines Ridge (starter site)
  v_company_site_id UUID;
  v_starter_turbine_id TEXT := 'turb_vestas_v90';
  v_epoch_real_ms BIGINT := 1793280000000;
  v_epoch_game_hour BIGINT := 0;
  v_current_game_hour BIGINT := 0;
  v_now_ms BIGINT;
BEGIN
  -- Read simulation state to determine current game hour
  SELECT epoch_real_utc_ms, epoch_game_hour
  INTO v_epoch_real_ms, v_epoch_game_hour
  FROM public.simulation_state
  WHERE id = 1;

  v_now_ms := (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT;
  v_current_game_hour := COALESCE(v_epoch_game_hour, 0) + FLOOR(GREATEST(0, v_now_ms - COALESCE(v_epoch_real_ms, v_now_ms)) / 150000)::BIGINT;

  -- 1. Create Profile
  INSERT INTO public.profiles (id, display_name, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'language', 'tr')
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create Company with $100,000 cash grant
  INSERT INTO public.companies (owner_user_id, name, cash, xp, level, status, visits_enabled)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1) || ' Energy Corp'),
    100000.00,
    0,
    1,
    'active',
    true
  )
  RETURNING id INTO v_company_id;

  -- 3. Initial Ledger Entry ($100,000 grant at current game hour)
  INSERT INTO public.ledger_entries (
    company_id,
    idempotency_key,
    entry_type,
    amount,
    balance_after,
    game_hour,
    description,
    metadata
  )
  VALUES (
    v_company_id,
    'grant_' || v_company_id::text,
    'initial_grant',
    100000.00,
    100000.00,
    v_current_game_hour,
    'Initial Government Energy Entrepreneurship Grant',
    jsonb_build_object('grant_type', 'starter_fund', 'amount', 100000)
  );

  -- 4. Assign Starter Leased Site (Site #1) for 1 game year from founding
  INSERT INTO public.company_sites (
    company_id,
    site_id,
    tenure_type,
    lease_expires_game_hour,
    is_explored,
    plant_name
  )
  VALUES (
    v_company_id,
    v_site_id,
    'lease',
    v_current_game_hour + 8760, -- 1 game year from founding
    true,
    'Alpha Wind Farm'
  )
  RETURNING id INTO v_company_site_id;

  -- 5. Create 2MW Starter Grid Connection
  INSERT INTO public.grid_connections (
    company_id,
    company_site_id,
    capacity_mw,
    distance_km,
    connection_fee_paid
  )
  VALUES (
    v_company_id,
    v_company_site_id,
    2.00,
    3.50,
    0.00
  );

  -- 6. Create Default Battery Settings for site
  INSERT INTO public.battery_settings (
    company_id,
    company_site_id,
    stored_kwh,
    min_sell_price,
    reserve_percentage,
    charge_mode
  )
  VALUES (
    v_company_id,
    v_company_site_id,
    0.00,
    0.0800,
    20.00,
    'smart'
  );

  -- 7. Install 1 Operating Starter Wind Turbine (ready immediately at founding hour)
  INSERT INTO public.installed_assets (
    company_id,
    company_site_id,
    catalog_id,
    position_x,
    position_y,
    position_z,
    rotation_y,
    installed_game_hour,
    condition,
    degradation_factor,
    last_maintenance_game_hour,
    next_maintenance_game_hour,
    status,
    salvage_value
  )
  VALUES (
    v_company_id,
    v_company_site_id,
    v_starter_turbine_id,
    0.00,
    0.00,
    0.00,
    0.00,
    GREATEST(0, v_current_game_hour - 168),
    100.00,
    1.0000,
    v_current_game_hour,
    v_current_game_hour + 4380,
    'generating',
    25000.00
  );

  -- 8. Welcome Notification
  INSERT INTO public.company_notifications (
    company_id,
    type,
    title,
    message,
    game_hour
  )
  VALUES (
    v_company_id,
    'welcome',
    'Energy Tycoon Dünyasına Hoş Geldiniz!',
    'Şirketiniz $100.000 hibe, 1 yıllık kiralık arazi ve üretime hazır 1 adet rüzgâr türbini ile kuruldu. İlk elektrik üretiminiz şebekeye akmaya başladı!',
    v_current_game_hour
  );

  RETURN NEW;
END;
$$;
