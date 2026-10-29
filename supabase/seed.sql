-- SEED DATA FOR ENERGY TYCOON
-- 24 World Sites, Equipment Catalog, Initial Simulation State

--------------------------------------------------------------------------------
-- 1. SIMULATION STATE (Singleton ID=1)
--------------------------------------------------------------------------------
INSERT INTO public.simulation_state (id, epoch_real_utc_ms, epoch_game_hour, last_processed_game_hour, current_spot_price, world_seed)
VALUES (1, 1793280000000, 0, 0, 0.0850, 42)
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 2. EQUIPMENT CATALOG (6 Turbines, 6 Solar, 3 Batteries)
--------------------------------------------------------------------------------

-- WIND TURBINES
INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('turb_vestas_v90', 'Vestas V90-2.0MW', 'wind_turbine', 'Vestas', 180000.00, 2000.00, 0.985, 25, 1, 
 '{"rotor_diameter_m": 90, "hub_height_m": 80, "cut_in_speed_ms": 3.5, "rated_speed_ms": 12.0, "cut_out_speed_ms": 25.0}'::jsonb,
 'Giriş seviyesi güvenilir rüzgâr türbini. Düşük ve orta rüzgâr sahaları için dengeli seçim.',
 'Reliable entry-level wind turbine. Great balanced choice for low-to-medium wind sites.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('turb_siemens_sg21', 'Siemens Gamesa SG 2.1-114', 'wind_turbine', 'Siemens Gamesa', 220000.00, 2100.00, 0.988, 25, 2, 
 '{"rotor_diameter_m": 114, "hub_height_m": 93, "cut_in_speed_ms": 3.0, "rated_speed_ms": 11.5, "cut_out_speed_ms": 25.0}'::jsonb,
 'Geniş süpürme alanı ile düşük rüzgâr hızlarında dahi yüksek kapasite faktörü sunar.',
 'Large rotor area provides strong capacity factors even during moderate wind conditions.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('turb_ge_haliade', 'GE Vernova 3.2-130', 'wind_turbine', 'GE Vernova', 350000.00, 3200.00, 0.990, 25, 4, 
 '{"rotor_diameter_m": 130, "hub_height_m": 110, "cut_in_speed_ms": 3.0, "rated_speed_ms": 12.0, "cut_out_speed_ms": 26.0}'::jsonb,
 'Orta-yüksek rüzgâr rejimleri için optimize edilmiş endüstri standardı performans.',
 'Optimized for medium-high wind regimes with industry-standard performance.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('turb_nordex_n149', 'Nordex N149/4.5', 'wind_turbine', 'Nordex Group', 540000.00, 4500.00, 0.992, 25, 7, 
 '{"rotor_diameter_m": 149, "hub_height_m": 125, "cut_in_speed_ms": 3.0, "rated_speed_ms": 11.8, "cut_out_speed_ms": 25.0}'::jsonb,
 'Yüksek kule ve ultra geniş kanat tasarımıyla dağlık bölgelerde maksimum enerji hasadı.',
 'High tower and ultra-wide blade design deliver maximum energy yield in mountain zones.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('turb_goldwind_gw155', 'Goldwind GW155-4.8', 'wind_turbine', 'Goldwind', 620000.00, 4800.00, 0.993, 25, 10, 
 '{"rotor_diameter_m": 155, "hub_height_m": 130, "cut_in_speed_ms": 2.5, "rated_speed_ms": 11.2, "cut_out_speed_ms": 25.0}'::jsonb,
 'Kalıcı mıknatıslı doğrudan tahrik teknolojisi sayesinde minimum mekanik arıza riski.',
 'Permanent magnet direct-drive technology reduces gearbox maintenance and mechanical failure.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('turb_enercon_e160', 'Enercon E-160 EP5 5.5MW', 'wind_turbine', 'Enercon', 790000.00, 5500.00, 0.995, 25, 15, 
 '{"rotor_diameter_m": 160, "hub_height_m": 140, "cut_in_speed_ms": 2.5, "rated_speed_ms": 11.0, "cut_out_speed_ms": 28.0}'::jsonb,
 'Sınıfının en güçlü karasal türbini. Üstün fırtına kontrolü ve devasa elektrik çıkışı.',
 'The most powerful onshore turbine in its class. Unmatched power output and storm survivability.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

-- SOLAR PACKAGES
INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('solar_trina_500k', 'Trina Solar Agri-Pack 500kW', 'solar_pack', 'Trina Solar', 65000.00, 500.00, 0.960, 25, 1, 
 '{"module_type": "Monocrystalline PERC", "efficiency_pct": 21.2, "inverter_ratio": 1.15}'::jsonb,
 'Kompakt ve ekonomik güneş paketi. Küçük arazilere hızlı başlangıç için ideal.',
 'Compact and affordable utility solar package. Ideal for quick starters on smaller sites.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('solar_longi_1m', 'LONGi Hi-MO 6 Solar Field 1.0MW', 'solar_pack', 'LONGi', 125000.00, 1000.00, 0.970, 25, 2, 
 '{"module_type": "HPBC Cell Technology", "efficiency_pct": 22.8, "inverter_ratio": 1.20}'::jsonb,
 'Yüksek verimli HPBC hücreleri ile güneşli günlerde istikrarlı kilovat saat üretimi.',
 'High-efficiency HPBC cells delivering consistent kilowatt-hours during peak sun.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('solar_jinko_2m', 'Jinko Tiger Neo Array 2.0MW', 'solar_pack', 'JinkoSolar', 235000.00, 2000.00, 0.975, 25, 4, 
 '{"module_type": "N-Type TOPCon", "efficiency_pct": 23.5, "inverter_ratio": 1.22}'::jsonb,
 'N-Tipi TOPCon teknolojisi sayesinde düşük ışıkta bile erken sabah ve geç ikindi verimi.',
 'N-Type TOPCon technology guarantees early morning and late afternoon performance.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('solar_canadian_3m', 'Canadian Solar BiHiKu 3.0MW', 'solar_pack', 'Canadian Solar', 340000.00, 3000.00, 0.980, 25, 7, 
 '{"module_type": "Bifacial TOPBiHiKu7", "efficiency_pct": 24.1, "albedo_gain_pct": 8.5}'::jsonb,
 'Çift taraflı (bifacial) panel yapısıyla yerden yansıyan ışığı da yakalayan endüstriyel çözüm.',
 'Bifacial structure harvests reflected ground light for added energy gain.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('solar_firstsolar_5m', 'First Solar Series 7 5.0MW', 'solar_pack', 'First Solar', 530000.00, 5000.00, 0.985, 25, 11, 
 '{"module_type": "Thin Film CdTe", "efficiency_pct": 24.5, "temp_coefficient": -0.32}'::jsonb,
 'İnce film teknolojisi ile sıcak yaz aylarında güç kaybı yaşamayan devasa santral paketi.',
 'Thin-film technology resilient to high operating temperatures on blisteringly hot days.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('solar_hanwha_8m', 'Qcells Q.PEAK Mega-Farm 8.0MW', 'solar_pack', 'Qcells', 810000.00, 8000.00, 0.990, 25, 16, 
 '{"module_type": "Q.ANTUM DUO Z", "efficiency_pct": 25.0, "tracker_compatible": true}'::jsonb,
 'Geniş ovalar için amiral gemisi güneş tarlası. Muazzam kurulu güç ve rekor üretim kapasitesi.',
 'Flagship utility solar array for vast open plains with record power yield.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

-- BATTERY STORAGE UNITS
INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('bat_tesla_megapack_s', 'Megapack Compact 1.0MWh', 'battery', 'Tesla Energy', 95000.00, 1000.00, 0.920, 15, 3, 
 '{"capacity_kwh": 1000, "round_trip_efficiency": 0.92, "c_rate": 1.0}'::jsonb,
 '1 MWh kapasiteli başlangıç bataryası. Öğle güneşini depolayıp akşam zirve fiyatta satmak için ideal.',
 '1 MWh starter battery. Store cheap midday solar and discharge during peak evening prices.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('bat_tesla_megapack_m', 'Megapack Standard 3.0MWh', 'battery', 'Tesla Energy', 260000.00, 3000.00, 0.940, 15, 6, 
 '{"capacity_kwh": 3000, "round_trip_efficiency": 0.94, "c_rate": 1.0}'::jsonb,
 '3 MWh ticari ölçekli depolama ünitesi. Gelişmiş akıllı arbitraj algoritmaları ile kârı katlar.',
 '3 MWh commercial-scale storage unit. Multiplies arbitrage profits with smart sell thresholds.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

INSERT INTO public.equipment_catalog (id, model_name, equipment_type, manufacturer, cost_usd, capacity_kw, efficiency, lifespan_game_years, min_level_required, specs, description_tr, description_en)
VALUES
('bat_tesla_megapack_l', 'Megapack Utility XL 10.0MWh', 'battery', 'Tesla Energy', 780000.00, 10000.00, 0.955, 15, 12, 
 '{"capacity_kwh": 10000, "round_trip_efficiency": 0.955, "c_rate": 1.0}'::jsonb,
 '10 MWh devasa şebeke bataryası. Tüm santral üretimini piyasa en tepe noktadayken deşarj eder.',
 '10 MWh massive utility battery. Arbitrages gigawatt-scale generation at the daily market peak.')
ON CONFLICT (id) DO UPDATE SET cost_usd = EXCLUDED.cost_usd;

--------------------------------------------------------------------------------
-- 3. 24 WORLD INVESTMENT SITES (8 Wind, 8 Solar, 8 Hybrid)
--------------------------------------------------------------------------------

INSERT INTO public.world_sites (id, name, region_type, area_hectares, purchase_price, lease_price_annual, grid_distance_km, base_wind_potential, base_solar_potential, center_x, center_z, description_tr, description_en)
VALUES
-- WIND SITES (Mountain & Coastal Ridges: Sites 1-8)
(1, 'Whispering Pines Ridge', 'wind', 45.0, 120000.00, 15000.00, 3.5, 0.85, 0.35, -450.0, -320.0, 'Başlangıç için ayrılmış korunaklı dağ sırtı. Sürekli esen serin rüzgâr akımlarına sahiptir.', 'Protected mountain ridge for beginners. Features steady, cooling wind currents.'),
(2, 'Stormcrest Peak', 'wind', 75.0, 240000.00, 28000.00, 5.2, 0.95, 0.30, -580.0, -420.0, 'Haritanın en yüksek tepesi. Şiddetli ve yüksek enerjili rüzgârlarla rekor üretim vadeder.', 'Highest elevation on the map. Severe, high-energy winds promise top generation stats.'),
(3, 'Eagle Eye Bluff', 'wind', 60.0, 190000.00, 22000.00, 4.0, 0.88, 0.38, -320.0, -510.0, 'Geniş bir vadiye bakan dik yamaçlar. Rüzgâr koridoru oluşturarak türbin verimini artırır.', 'Steep bluff overlooking a wide canyon. Creates a natural wind tunnel.'),
(4, 'Gale Valley Pass', 'wind', 85.0, 280000.00, 32000.00, 6.8, 0.92, 0.32, -690.0, -180.0, 'İki dağ sırası arasında daralan rüzgâr boğazı. Çok yüksek kapasite faktörü sunar.', 'Mountain pass squeezing gusts into high velocity. Exceptional capacity factor.'),
(5, 'Mistveil Highlands', 'wind', 55.0, 175000.00, 20000.00, 4.5, 0.82, 0.30, -260.0, -390.0, 'Sisli yaylalar; nemli hava kütleleri düzenli rüzgâr türbini çalışmasını destekler.', 'Misty highlands with consistent atmospheric pressure and steady breeze.'),
(6, 'Boreas Plateau', 'wind', 90.0, 320000.00, 38000.00, 7.5, 0.94, 0.34, -750.0, -350.0, 'Kuzey rüzgârlarına açık geniş plato. Çok sayıda büyük türbin yerleşimi için elverişlidir.', 'Vast northern plateau exposed to prevailing winds. Excellent for multi-turbine parks.'),
(7, 'Zephyr Canyon Edge', 'wind', 65.0, 210000.00, 24000.00, 5.0, 0.86, 0.36, -400.0, -150.0, 'Kanyon kenarında termal hava akımları. Gece ve gündüz kesintisiz esintiler taşır.', 'Canyon rim with thermal convection currents. Generates breeze day and night.'),
(8, 'Thunderhead Cliffs', 'wind', 110.0, 410000.00, 48000.00, 8.2, 0.96, 0.28, -820.0, -520.0, 'Uzak falezler. Şebeke mesafesi yüksek olsa da en yüksek rüzgâr hızlarına sahiptir.', 'Distant sheer cliffs. Higher grid connection distance offset by fierce winds.'),

-- SOLAR SITES (Plains & Deserts: Sites 9-16)
(9, 'Sunfire Basin', 'solar', 50.0, 130000.00, 16000.00, 2.8, 0.30, 0.92, 380.0, 280.0, 'Geniş ve düz tabanlı havza. Yıl boyu bulutsuz gökyüzü ve yüksek güneş radyasyonu.', 'Wide flat basin with cloudless skies and exceptional global horizontal irradiance.'),
(10, 'Golden Plains', 'solar', 80.0, 220000.00, 26000.00, 4.2, 0.35, 0.89, 490.0, 350.0, 'Hafif eğimli sarı bozkırlar. Kolay hafriyat ve ucuz montaj imkanı sağlar.', 'Gently rolling steppe. Flat terrain makes foundation civil works cheap and fast.'),
(11, 'Helios Flats', 'solar', 100.0, 290000.00, 34000.00, 5.5, 0.28, 0.95, 620.0, 190.0, 'Kuru tuz gölü kalıntısı ova. Güneş ışınlarının doğrudan düştüğü rekor güneş potansiyeli.', 'Dried salt flat offering maximum direct normal irradiance with zero shade.'),
(12, 'Mirage Dunes', 'solar', 70.0, 185000.00, 21000.00, 3.9, 0.32, 0.90, 310.0, 420.0, 'Güneye bakan kumlu arazi. Güneş panellerinin optimal açıyla konumlanması için mükemmel.', 'South-facing sandy terrain. Perfect natural slope for optimal tilt angles.'),
(13, 'Solaria Prairie', 'solar', 95.0, 275000.00, 32000.00, 6.0, 0.36, 0.88, 540.0, 480.0, 'Büyük çaplı endüstriyel güneş tarlaları için ideal geniş tarımsal niteliksiz otlak.', 'Immense open prairie ready for utility-scale solar mega-projects.'),
(14, 'Amber Valley', 'solar', 60.0, 165000.00, 19000.00, 3.2, 0.34, 0.87, 240.0, 220.0, 'Trafo merkezine çok yakın konumlanmış sıcak vadi. Düşük şebeke bağlantı masrafı.', 'Warm valley very close to the main substation. Low interconnection expenditure.'),
(15, 'Radiant Saltbeds', 'solar', 120.0, 380000.00, 44000.00, 7.8, 0.25, 0.96, 730.0, 310.0, 'Güneş paneli çift taraflı (bifacial) kazancı için beyaz yansıtıcı zemine sahip dev arazi.', 'High albedo salt beds amplifying bifacial solar panel backside generation.'),
(16, 'Sahara Oasis Fringe', 'solar', 140.0, 460000.00, 52000.00, 8.5, 0.30, 0.94, 820.0, 420.0, 'Haritanın en güneyindeki geniş çöl sahası. Büyük sermaye yatırımıyla dev enerji üretir.', 'Expansive southern desert frontier for gigawatt-class capital investments.'),

-- HYBRID SITES (Hills & Valleys with balanced wind & sun: Sites 17-24)
(17, 'Crosswind Meadows', 'hybrid', 65.0, 195000.00, 23000.00, 3.0, 0.72, 0.74, 50.0, -180.0, 'Gündüz güneş, akşam rüzgâr alan dengeli vadi. 24 saat kesintisiz nakit akışı sağlar.', 'Balanced meadow catching sunshine by day and canyon breeze at dusk.'),
(18, 'Falcon Crest', 'hybrid', 80.0, 255000.00, 30000.00, 4.8, 0.78, 0.71, -120.0, 80.0, 'Tepede türbinler, eteklerinde güneş panelleri için uygun katmanlı topoğrafya.', 'Tiered topography ideal for ridge-top turbines and foothill solar arrays.'),
(19, 'Emerald Foothills', 'hybrid', 75.0, 230000.00, 27000.00, 3.8, 0.69, 0.77, 180.0, -90.0, 'Şebekeye yakın yeşil yamaçlar. Rüzgâr ve güneş karmasıyla bataryasız bile stabil üretim.', 'Verdant foothills near grid connections. Delivers smooth combined output.'),
(20, 'Twin Peaks Saddle', 'hybrid', 90.0, 310000.00, 36000.00, 5.5, 0.81, 0.68, -50.0, -320.0, 'İki tepe arasındaki eyer arazisi. Sabah güneşi ve daimi boğaz rüzgârı.', 'Saddle between twin peaks enjoying intense morning sun and wind funneling.'),
(21, 'Harmony Valley', 'hybrid', 85.0, 280000.00, 33000.00, 4.0, 0.73, 0.75, 120.0, 150.0, 'Merkezi konum. Hem rüzgâr türbini hem güneş panelleri için kusursuz uyum.', 'Centrally located valley providing textbook synergy between wind and solar.'),
(22, 'Osprey Shoreline', 'hybrid', 105.0, 365000.00, 42000.00, 6.2, 0.84, 0.70, -220.0, 240.0, 'Göl kıyısı termal döngüsü. Sabah açık güneşli gökyüzü, öğleden sonra göl fırtınası.', 'Lakeside microclimate. Blazing morning sunshine followed by afternoon lake gales.'),
(23, 'Sundance Ridge', 'hybrid', 115.0, 420000.00, 49000.00, 7.0, 0.76, 0.79, 290.0, -220.0, 'Büyük hibrit enerji santrali için tasarlanmış yüksek yayla. Batarya ile dev kâr merkezi.', 'Elevated plateau tailored for flagship hybrid power plants and storage arbitrage.'),
(24, 'Equinox Wilds', 'hybrid', 150.0, 550000.00, 64000.00, 8.0, 0.80, 0.80, 50.0, 380.0, 'Haritanın en prestijli ve en geniş arazisi. Tam ölçekli temiz enerji imparatorluklarının kalbi.', 'The most prestigious and largest territory on the map. The ultimate tycoon estate.')
ON CONFLICT (id) DO UPDATE SET
  purchase_price = EXCLUDED.purchase_price,
  lease_price_annual = EXCLUDED.lease_price_annual,
  base_wind_potential = EXCLUDED.base_wind_potential,
  base_solar_potential = EXCLUDED.base_solar_potential;

