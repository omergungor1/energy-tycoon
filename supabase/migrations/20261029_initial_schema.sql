-- ENERGY TYCOON DATABASE SCHEMA
-- Compliant with Supabase Postgres Best Practices & GDD v2.0

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. PROFILES & COMPANIES
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'tr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cash NUMERIC(18,2) NOT NULL DEFAULT 100000.00,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'bankrupt')),
  visits_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_companies_level_status ON public.companies (level, status);

--------------------------------------------------------------------------------
-- 2. WORLD SITES & COMPANY SITES
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.world_sites (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  region_type TEXT NOT NULL CHECK (region_type IN ('wind', 'solar', 'hybrid')),
  area_hectares NUMERIC(10,2) NOT NULL,
  purchase_price NUMERIC(18,2) NOT NULL,
  lease_price_annual NUMERIC(18,2) NOT NULL,
  grid_distance_km NUMERIC(8,2) NOT NULL,
  base_wind_potential NUMERIC(6,3) NOT NULL,
  base_solar_potential NUMERIC(6,3) NOT NULL,
  center_x NUMERIC(10,2) NOT NULL,
  center_z NUMERIC(10,2) NOT NULL,
  boundary_geojson JSONB DEFAULT '[]'::jsonb,
  description_tr TEXT,
  description_en TEXT
);

CREATE TABLE IF NOT EXISTS public.company_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  site_id INT NOT NULL REFERENCES public.world_sites(id),
  tenure_type TEXT NOT NULL CHECK (tenure_type IN ('lease', 'own')),
  lease_expires_game_hour BIGINT,
  is_explored BOOLEAN NOT NULL DEFAULT false,
  plant_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_company_site UNIQUE (company_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_company_sites_company ON public.company_sites (company_id);
CREATE INDEX IF NOT EXISTS idx_company_sites_site ON public.company_sites (site_id);

--------------------------------------------------------------------------------
-- 3. EQUIPMENT CATALOG & INVENTORY
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.equipment_catalog (
  id TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('wind_turbine', 'solar_pack', 'battery', 'substation')),
  manufacturer TEXT NOT NULL,
  cost_usd NUMERIC(18,2) NOT NULL,
  capacity_kw NUMERIC(10,2) NOT NULL,
  efficiency NUMERIC(5,3) NOT NULL DEFAULT 1.000,
  lifespan_game_years INT NOT NULL DEFAULT 25,
  min_level_required INT NOT NULL DEFAULT 1,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_tr TEXT,
  description_en TEXT
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  catalog_id TEXT NOT NULL REFERENCES public.equipment_catalog(id),
  quantity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'in_warehouse' CHECK (status IN ('ordered', 'in_transit', 'in_warehouse', 'allocated', 'installed')),
  purchase_cost NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_company ON public.inventory_items (company_id, status);

--------------------------------------------------------------------------------
-- 4. INSTALLED ASSETS & GRID CONNECTIONS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.installed_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_site_id UUID NOT NULL REFERENCES public.company_sites(id) ON DELETE CASCADE,
  catalog_id TEXT NOT NULL REFERENCES public.equipment_catalog(id),
  position_x NUMERIC(10,2) NOT NULL DEFAULT 0,
  position_y NUMERIC(10,2) NOT NULL DEFAULT 0,
  position_z NUMERIC(10,2) NOT NULL DEFAULT 0,
  rotation_y NUMERIC(10,2) NOT NULL DEFAULT 0,
  installed_game_hour BIGINT NOT NULL DEFAULT 0,
  condition NUMERIC(6,2) NOT NULL DEFAULT 100.00,
  degradation_factor NUMERIC(6,4) NOT NULL DEFAULT 1.0000,
  last_maintenance_game_hour BIGINT DEFAULT 0,
  next_maintenance_game_hour BIGINT DEFAULT 4380,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'maintenance', 'broken', 'retired')),
  salvage_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installed_assets_site ON public.installed_assets (company_site_id, status);
CREATE INDEX IF NOT EXISTS idx_installed_assets_company ON public.installed_assets (company_id);

CREATE TABLE IF NOT EXISTS public.grid_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_site_id UUID NOT NULL REFERENCES public.company_sites(id) ON DELETE CASCADE,
  capacity_mw NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  distance_km NUMERIC(8,2) NOT NULL DEFAULT 5.00,
  connection_fee_paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_grid_connection_site UNIQUE (company_site_id)
);

CREATE INDEX IF NOT EXISTS idx_grid_conn_company ON public.grid_connections (company_id);

--------------------------------------------------------------------------------
-- 5. BATTERY SETTINGS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.battery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_site_id UUID NOT NULL REFERENCES public.company_sites(id) ON DELETE CASCADE,
  stored_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  min_sell_price NUMERIC(10,4) NOT NULL DEFAULT 0.0800,
  reserve_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  charge_mode TEXT NOT NULL DEFAULT 'smart',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_battery_site UNIQUE (company_site_id)
);

CREATE INDEX IF NOT EXISTS idx_battery_settings_company ON public.battery_settings (company_id);

--------------------------------------------------------------------------------
-- 6. MARKET, PRODUCTION & SETTLEMENTS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.market_hourly_prices (
  game_hour BIGINT PRIMARY KEY,
  price_per_mwh NUMERIC(10,2) NOT NULL,
  price_per_kwh NUMERIC(10,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hourly_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_site_id UUID NOT NULL REFERENCES public.company_sites(id) ON DELETE CASCADE,
  game_hour BIGINT NOT NULL,
  wind_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  solar_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  stored_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  curtailed_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  sold_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_hourly_production UNIQUE (company_site_id, game_hour)
);

CREATE INDEX IF NOT EXISTS idx_hourly_prod_company_hour ON public.hourly_production (company_id, game_hour);

CREATE TABLE IF NOT EXISTS public.hourly_energy_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_site_id UUID NOT NULL REFERENCES public.company_sites(id) ON DELETE CASCADE,
  game_hour BIGINT NOT NULL,
  direct_sold_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  battery_sold_kwh NUMERIC(14,2) NOT NULL DEFAULT 0,
  price_per_kwh NUMERIC(10,4) NOT NULL,
  gross_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  market_fee NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_hourly_settlement UNIQUE (company_site_id, game_hour)
);

CREATE INDEX IF NOT EXISTS idx_settlements_company_hour ON public.hourly_energy_settlements (company_id, game_hour);

--------------------------------------------------------------------------------
-- 7. LOANS & FINANCIAL LEDGER
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  principal NUMERIC(18,2) NOT NULL,
  interest_rate_annual NUMERIC(6,4) NOT NULL,
  term_game_years INT NOT NULL,
  monthly_installment NUMERIC(18,2) NOT NULL,
  remaining_balance NUMERIC(18,2) NOT NULL,
  overdue_installments INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'defaulted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_company_status ON public.loans (company_id, status);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  idempotency_key TEXT UNIQUE NOT NULL,
  entry_type TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  balance_after NUMERIC(18,2) NOT NULL,
  game_hour BIGINT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_company_hour ON public.ledger_entries (company_id, game_hour);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON public.ledger_entries (entry_type);

--------------------------------------------------------------------------------
-- 8. PROJECTS & NOTIFICATIONS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_site_id UUID NOT NULL REFERENCES public.company_sites(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'permitting' CHECK (stage IN ('permitting', 'foundation', 'delivery', 'assembly', 'completed', 'cancelled')),
  progress_pct INT NOT NULL DEFAULT 0,
  start_game_hour BIGINT NOT NULL,
  target_game_hour BIGINT NOT NULL,
  cost_total NUMERIC(18,2) NOT NULL DEFAULT 0,
  cost_paid NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects (company_id, stage);

CREATE TABLE IF NOT EXISTS public.company_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  game_hour BIGINT NOT NULL DEFAULT 0,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifs_company ON public.company_notifications (company_id, is_read);

--------------------------------------------------------------------------------
-- 9. SIMULATION STATE & LEADERBOARDS
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.simulation_state (
  id INT PRIMARY KEY CHECK (id = 1),
  epoch_real_utc_ms BIGINT NOT NULL,
  epoch_game_hour BIGINT NOT NULL DEFAULT 0,
  last_processed_game_hour BIGINT NOT NULL DEFAULT 0,
  current_spot_price NUMERIC(10,4) NOT NULL DEFAULT 0.0850,
  world_seed INT NOT NULL DEFAULT 42,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  snapshot_game_hour BIGINT NOT NULL,
  net_worth NUMERIC(18,2) NOT NULL,
  total_profit NUMERIC(18,2) NOT NULL,
  total_production_kwh NUMERIC(18,2) NOT NULL,
  rank_net_worth INT,
  rank_profit INT,
  rank_production INT,
  season_month INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_hour ON public.leaderboard_snapshots (snapshot_game_hour, rank_net_worth);

--------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_hourly_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_energy_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Public reference tables (Readable by all authenticated and anon)
CREATE POLICY "world_sites_select_all" ON public.world_sites FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "equipment_catalog_select_all" ON public.equipment_catalog FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "market_hourly_prices_select_all" ON public.market_hourly_prices FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "simulation_state_select_all" ON public.simulation_state FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "leaderboard_snapshots_select_all" ON public.leaderboard_snapshots FOR SELECT TO authenticated, anon USING (true);

-- Profiles
CREATE POLICY "profiles_select_self" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);

-- Companies: Owner has full read/update; Public can view basic company info if visits_enabled = true
CREATE POLICY "companies_select" ON public.companies FOR SELECT TO authenticated, anon USING (
  owner_user_id = (SELECT auth.uid()) OR visits_enabled = true
);
CREATE POLICY "companies_update_owner" ON public.companies FOR UPDATE TO authenticated USING (
  owner_user_id = (SELECT auth.uid())
) WITH CHECK (
  owner_user_id = (SELECT auth.uid())
);
CREATE POLICY "companies_insert_owner" ON public.companies FOR INSERT TO authenticated WITH CHECK (
  owner_user_id = (SELECT auth.uid())
);

-- Helper policy for company-owned data
CREATE POLICY "company_sites_select" ON public.company_sites FOR SELECT TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);
CREATE POLICY "company_sites_all_owner" ON public.company_sites FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "inventory_items_all_owner" ON public.inventory_items FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "installed_assets_select" ON public.installed_assets FOR SELECT TO authenticated, anon USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()) OR visits_enabled = true)
);
CREATE POLICY "installed_assets_modify_owner" ON public.installed_assets FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "grid_connections_all_owner" ON public.grid_connections FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "battery_settings_all_owner" ON public.battery_settings FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "hourly_production_all_owner" ON public.hourly_production FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "hourly_settlements_all_owner" ON public.hourly_energy_settlements FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "loans_all_owner" ON public.loans FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "ledger_all_owner" ON public.ledger_entries FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "projects_all_owner" ON public.projects FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

CREATE POLICY "notifs_all_owner" ON public.company_notifications FOR ALL TO authenticated USING (
  company_id IN (SELECT id FROM public.companies WHERE owner_user_id = (SELECT auth.uid()))
);

--------------------------------------------------------------------------------
-- 11. AUTOMATIC PROFILE & STARTING COMPANY SETUP TRIGGER
--------------------------------------------------------------------------------

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
BEGIN
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

  -- 3. Initial Ledger Entry ($100,000 grant)
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
    0,
    'Initial Government Energy Entrepreneurship Grant',
    jsonb_build_object('grant_type', 'starter_fund', 'amount', 100000)
  );

  -- 4. Assign Starter Leased Site (Site #1)
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
    8760, -- 1 game year = 8760 game hours
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

  -- 7. Install 1 Operating Starter Wind Turbine
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
    0,
    100.00,
    1.0000,
    0,
    4380,
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
    0
  );

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

