# ENERGY TYCOON
## Oyun Tasarım Dokümanı (GDD) ve Teknik Geliştirme Planı — v2.0

**Durum:** 16 ana modülün ürün kararları onaylandı.  
**Hedef platform:** Masaüstü ve mobil tarayıcı.  
**Teknoloji:** Next.js App Router, **JavaScript (TypeScript yok)**, Tailwind CSS, Supabase Auth/PostgreSQL, Three.js, React Three Fiber.  
**Diller:** Türkçe ve İngilizce.  
**Para birimi:** USD ($).

> Bu belge ürün kararlarını ve önerilen uygulama mimarisini birleştirir. Sayısal ekonomi dengelemesi, model bazlı ekipman fiyatları ve bazı teknik eşikler geliştirme/test sırasında kesinleştirilecektir. Önerilen teknik detaylar, daha önce kesinleşmiş oyun kurallarının yerine geçmez.

 supabase mcp ekledim tüm yetkilere sahipsin. Gerekli tabloları oluştur rls ayarlarını yap. Supabase auth kullanacaksın. Signup formu da koyalım isteyen kaydolabilir.
---

# A. OYUN VİZYONU VE DEĞİŞMEZ KURALLAR

Energy Tycoon, oyuncunun özel 3D haritada bir enerji şirketi kurduğu, rüzgâr/güneş üretimi yaptığı, elektriği ortak spot piyasada sattığı, depolama ve finansman kararlarıyla büyüdüğü ekonomik yönetim oyunudur. Başarı sadece kapasite değil, kârlılık ve sermaye verimliliğidir.

- **Zaman:** 24×; 1 gerçek saat = 1 oyun günü; 1 oyun yılı yaklaşık 15,2 gerçek gün (365 oyun günü varsayımı). Sunucu tarafından yönetilen **ortak global oyun saati**. Zaman atlama yok; oyuncu çevrimdışıyken işlemler ilerler.
- **Dünya:** Tüm oyuncular aynı kurgusal coğrafyayı ve ortak spot fiyat eğrisini görür; araziler, tesisler ve varlıklar oyuncu başına özeldir.
- **Başlangıç:** 1 küçük kiralık arazi, çalışan 1 rüzgâr türbini, **$100.000** nakit.
- **Arazi:** 24 yatırım bölgesi; rüzgâr, güneş ve hibrit; satın alma veya 1/5/10 oyun yıllığına kiralama; kiralık araziyi daha sonra satın alma.
- **Ekonomi:** Elektrik varsayılan olarak otomatik satılır. Batarya varsa oyuncunun belirlediği kurallara göre üretim depolanabilir. Oyuncu şebekeden elektrik satın alamaz.
- **Piyasa:** Tüm oyunculara ortak, önceden tanımlı günlük fiyat döngüsü; saatlik fiyat; dengeli değişkenlik ve pozitif alt/üst sınırlar. Oyuncu üretimi fiyatı etkilemez.
- **Süreler:** Türbin/güneş ekipmanı yaklaşık 25 oyun yılı; batarya 15 oyun yılı. Bakım 6 oyun ayında bir.
- **Rekabet:** Net şirket değeri, toplam kâr ve toplam üretim; tek küresel sıralama, tüm zamanlar ve aylık sezon görünümleri.
- **Güvenlik:** Ekonomik sonuçlar ve zaman sunucuda hesaplanır; istemci sayısal bakiye, üretim veya sıralama puanı belirleyemez.

---

# B. 16 MODÜLÜN KESİNLEŞMİŞ OYUN TASARIMI

## 01 — Dünya ve Araziler

- 24 sabit yatırım sahası: rüzgâr ağırlıklı dağlar, güneş ovaları ve hibrit alanlar; dağılım için 8/8/8 başlangıç önerisi.
- Tüm oyuncular aynı topoğrafyayı görür, ancak arazi mülkiyeti ve tesis durumu oyuncuya özeldir.
- Arazi boyutu, kira/satış fiyatı ve trafo mesafesi satın alma öncesinde görünür; gerçek üretim potansiyeli ücretli saha keşfinden sonra **tahmin aralığı** olarak açılır.
- Arazi kiralama: 1, 5 veya 10 oyun yılı; sonradan satın alma.
- Oyuncu ekipmanları arazi sınırları içinde serbestçe konumlandırır; otomatik yol ve hat güzergâhları seçilen uç noktalar arasında oluşturulur.
- 3D kamera: orbit, zoom, pan.

## 02 — Ekipman Mağazası

- Gerçek marka/model isimleriyle dengelenmiş oyun ekonomisine sahip 6 rüzgâr türbini ve 6 güneş paketi; marka/model lisans ve veri doğruluğu yayın öncesi kontrol edilmeli.
- Güneş sistemleri hazır paket veya özelleştirilebilir dizi olarak alınabilir.
- Sistem uyumluluk denetimi yapar; uygunsuz bileşen eşleşmelerini engeller.
- Yalnızca yeni ekipman satın alınır. Depodaki kullanılmamış ürünler indirimli geri satışla elden çıkarılabilir.
- Satın alma anında sipariş depoda bekleyen olarak görünür; teslimat tamamlanınca kullanılabilir.
- Yükseltme ve genişletme, dönemsel mağaza indirimleri desteklenir.

## 03 — Proje, İzin ve İnşaat

- Oyuncu 3D dünyaya taslak yerleştirme yapar; sistem proje ve maliyet teklifi üretir.
- İzin süreci sabit ücret ve bekleme içerir, **daima onaylanır**. Teslimat izinle paralel ilerleyebilir.
- İnşaat için sistemin önerdiği vinç, ekip ve hizmet paketi alınır. Ek ekiplerle hızlandırma mümkündür.
- Temel hazırlığı teslimattan önce başlayabilir; montaj için ekipmanın gelmesi gerekir.
- Bütçe ve ayrılmış ekipler izin verdiği sürece eşzamanlı birden fazla proje yürür.
- İptalde aşamaya göre kısmi iade ve kaynak serbest bırakma; 3D vinç, işçi, kamyon ve ilerleme animasyonları.

## 04 — Lojistik ve Depo

- **Tek merkezi ve sınırsız kapasiteli depo. Depo genişletme/kapasite sınırı yok.**
- Mağaza → depo ve depo → saha sevkiyatlarında ekipman büyüklüğü ve mesafe bazlı ücret/süre; standart ve ekspres teslimat.
- Oyuncu depodaki ürünü projeye açıkça tahsis eder; aynı seri/kalem iki projeye ayrılamaz.
- Sipariş, yolda, depoda, tahsis edildi, sevk ediliyor, kuruldu durumları.
- Tam maliyet: satın alma + teslimat + proje hizmetleri ayrı gösterilir.
- Araçlar sahada görünür, ancak gerçekçi yol boyunca araç sürüş simülasyonu zorunlu değildir.

## 05 — Elektrik Altyapısı

- Haritada 4–6 sabit trafo/şebeke bağlantı noktası.
- Oyuncu bağlantı uçlarını seçer; hat güzergâhı otomatik çizilir.
- Hat ve transformatör kapasitesi sınırlı ve yükseltilebilir; belli kapasite eşiğinin üzerinde özel transformatör zorunlu.
- **Tek standart kablo tipi, iletim kaybı yok, maliyet sadece mesafeye bağlı, arazi türüne bağlı değil.**
- Mevcut hattın kapasitesi uygunsa birden fazla tesis aynı hattı paylaşabilir.
- Kapasiteye göre tek seferlik bağlantı ücreti; altyapı inşaat animasyonu.
- Şebeke kapasitesini aşan elektrik satılamaz; uygunsa önce bataryaya aktarılabilir.

## 06 — Enerji Üretimi

- Arazi ve mevsime bağlı rüzgâr/güneş potansiyeli; kontrollü rastlantısallık; dört mevsim, gündüz/gece.
- Türbin üretim modeli: **basit doğrusal rüzgâr hızı formülü**, fiziksel güç eğrisi değil.
- Güneş üretimi: **yalnızca güneş ışığı ve panel kurulu gücü**; panel yönü, sıcaklık ve kirlenme simülasyonu yok.
- Her oyun saatinde üretim; offline süreyi aynı deterministik mantıkla hesapla.
- Yıllık kalıcı yaşlanma kaynaklı verim kaybı; 25 oyun yılında ekipman durur.
- Türbinlerde minimum yerleşim mesafesi vardır; **wake/türbülans kaynaklı üretim kaybı yok**.
- Keşif sonrası belirsizlik içeren günlük/aylık tahminler; rüzgâra bağlı türbin dönmesi ve güneş ışığına bağlı görsellik.

## 07 — Spot Elektrik Piyasası

- Her oyun saatinde ortak spot fiyat; önceden belirlenmiş günlük döngü ve sınırlandırılmış oynaklık.
- Negatif fiyat yok; fiyatlar tüm oyuncular için aynıdır.
- Üretilen ve şebekeye verilebilen enerji, bataryaya ayrılmadıkça otomatik satılır.
- Satış başına küçük sabit oranlı komisyon.
- MVP'de uzun vadeli satış sözleşmesi yok.
- Son 24 oyun saati ve tarihsel fiyat grafikleri; gelecek 24 oyun saati için tahmin aralığı.
- Gelir her oyun saatinin sonunda şirket nakdine işlenir.

## 08 — Batarya ve Akıllı Satış

- Küçük, orta, büyük olmak üzere üç batarya boyutu.
- Şarj/deşarjda küçük verim kaybı.
- **Bataryanın tüm kapasitesi tek oyun saatinde doldurulabilir veya boşaltılabilir; güç limiti yoktur.** Satışta şebeke bağlantı limiti geçerlidir.
- Sadece kendi üretiminden şarj; **şebekeden elektrik satın alma yok**.
- Akıllı satış: gelecek 24 oyun saatinin fiyat döngüsüne göre, kullanıcı tanımlı **asgari satış fiyatı** ve **rezerv yüzdesi** dikkate alınır.
- Aynı arazideki tesis ekipmanları bataryayı paylaşır; farklı araziler arası batarya paylaşımı yok.
- Ömür 15 oyun yılı; eşik oluşmazsa enerji bekler; batarya doluysa yeni fazla üretim doğrudan satılır.
- Offline çalışır; enerji çift sayılmaz.

## 09 — Bakım, Arıza ve Yaşlanma

- Her 6 oyun ayında bakım gerekliliği; hizmet pazarından tek seferlik bakım.
- Yeterli bakiye varsa isteğe bağlı otomatik bakım satın alma.
- Geciken bakım verimi düşürür, arıza ihtimalini artırır.
- Yaş ve bakım durumuna bağlı düşük olasılıklı arızalar; arızalı ekipman onarım bitene dek üretmez.
- Onarım/bakım süresi ekipman ve hizmete göre oyun saatleri/günleriyle değişir.
- 25 oyun yılında türbin/güneş; 15 oyun yılında batarya kullanım dışı kalır; erken değiştirme ve hurda değeri mümkündür.
- Geri döndürülebilir bakım kondisyonu ile kalıcı yaşlanma verim kaybı ayrı tutulur.
- Doğal afet/fırtına hasarı mekaniği yok; ekipman yenilenince arazi ve mevcut şebeke bağlantısı korunur.
- Panel ve bildirim merkezinde bakım/arıza uyarıları.

## 10 — Finans, Nakit Akışı, Banka

- Tüm oyun ekonomisi **USD**.
- Net şirket değeri = nakit + amortismana tabi ekipmanın kalan değeri + sahip olunan arazi + altyapı değeri − toplam borçlar.
- Toplam kredi üst limiti: net şirket değerinin %50'si. Krediyle alınan nakit net değeri yapay biçimde yükseltmez; kredi limiti işlem öncesi doğrulanır.
- Tüm kredilerde sabit faiz; vadeler 1, 3, 5 oyun yılı; her oyun ayında eşit taksit.
- Cezasız erken kapatma.
- Taksit ödenmezse gecikme faizi, uyarı, tanımlı mühlet ve gerektiğinde varlık satışı.
- İflasta yeniden yapılandırma veya sıfırdan başlama.
- İşletme giderleri: kira, bakım, kredi maliyetleri ve piyasa komisyonu. **Anapara ödemesi kâr/zarar gideri değildir**; nakit akışı ve borç bakiyesini etkiler. Sermaye yatırımları doğrudan faaliyet gideri yazılmaz.
- Günlük/aylık/yıllık gelir-gider, nakit akışı ve kâr/zarar raporları.
- Net şirket değeri, toplam kâr, toplam üretim için ayrı sıralama kategorileri.

## 11 — Hizmet Pazarı

- Hizmetler tek seferlik satın alınır; her hizmette tek standart sağlayıcı.
- Fiyatlar ekipman kapasitesi ve iş büyüklüğüne göre hesaplanır.
- Standart ve ekspres hız seçeneği.
- Satın alınan inşaat ekibi yalnızca atandığı projede çalışır.
- Hizmet satın alınınca işlem başlar; ayrıca tedarikçi bekleme kuyruğu yok.
- Tek saha keşfi hizmeti; verim potansiyeli tahmin aralığı açılır.
- Tek seferlik bakım + isteğe bağlı otomatik bakım satın alımı.
- Arıza türüne göre otomatik onarım fiyatı ve süresi.
- Başlamadan tam iade, başladıktan sonra kısmi iade; proje iptali kurallarıyla uyumlu.
- Vinç, kamyon, teknisyen, inşaat ilerlemesi görselleri.
- Tesis ve şirket genelinde hizmet geçmişi.
- **Çifte ücretlendirme yok:** Projeden alınan hizmet hizmet pazarında ikinci kez satın alınmış sayılmaz.

## 12 — Santral ve Tesis Yönetimi

- **Her arazi bir tesis**; içindeki türbinler, paneller, bataryalar, bağlantılar birlikte yönetilir.
- Oyuncu tesis adını istediği zaman değiştirebilir.
- Santrallerim ekranında kart ve tablo görünümü; tür, durum, gelir, üretim, kârlılık filtre/sıralama.
- Tesis detayları: üretim, finans, ekipman, bakım, projeler.
- Tesis bazında gelir, gider, net faaliyet kârı ve yatırım geri dönüşü.
- **Santralleri yan yana karşılaştırma özelliği yok.**
- Toplu otomatik bakım aç/kapat ve bildirim ayarları.
- Genişleme yeni proje ile yapılır; anında yükseltme yok.
- Tesis kapatılabilir; ekipman hurda/geri satış değeriyle elden çıkarılır.
- Tesis seçilince 3D kamera konuma odaklanır.
- Sağlık durumu, kritik uyarı, yaklaşan bakım.

## 13 — Analitik ve Raporlama

- Dönemler: günlük, haftalık, aylık, yıllık, tüm zamanlar.
- Finans: gelir, gider, net kâr, nakit akışı, şirket değeri, borç.
- Üretim: toplam enerji, rüzgâr/güneş kırılımı, kapasite kullanımı.
- Piyasa: satılan kWh, ortalama satış fiyatı, satış geliri.
- Batarya: depolanan/satılan enerji, kayıp, doğrudan satışa göre ek kazanç.
- Yatırım: gerçekleşen ROI ve tahmini geri dönüş süresi.
- Gelecek 30 oyun günü için tahmini üretim, gelir ve gider.
- Etkileşimli grafikler: hover, dönem seçimi, yakınlaştırma.
- **CSV + PDF** dışa aktarma.
- Grafiklerde tesis kurulumu, büyük yatırım ve arıza işaretleri.
- Her oyun ayı sonunda otomatik şirket özeti.
- Basit kural tabanlı performans önerileri; harici AI danışmanı zorunlu değil.
- Veriler gerçek üretim ve finans kayıtlarından türetilir.

## 14 — Hesap, Seviye ve İlerleme

- Supabase Auth ile e-posta/şifre ve Google girişi.
- Oyuncu başına tek şirket.
- Başlangıç: küçük kiralık arazi, çalışan bir türbin, **$100.000**.
- 3D harita üzerinde kısa adım adım rehber.
- XP tabanlı seviye; ilk tesis, üretim kilometre taşları, yatırım ve görevlerden XP.
- Temel sistemler ilk günden açık; gelişmiş ekipmanlar seviyeye göre açılır.
- Başlangıç/ilerleme görevleri ve tek seferlik ödüller; küçük nakit ödülleri.
- Rozet, özel profil çerçevesi ve unvanlar.
- **Gerçek takvim gününe göre** arka arkaya giriş serisi ve artan ödüller; sunucuda tekil ödül kontrolü.
- Oyuncu açık onayla şirketi sıfırlayabilir; ekonomik sıralama sıfırlanır, eski başarı rozetleri ayrı tutulur.

## 15 — Liderlik ve Sosyal

- Kategoriler: net şirket değeri, toplam kâr, toplam enerji üretimi.
- Her **1 gerçek saatte** güncelleme.
- **Tek küresel sıralama**; tüm zamanlar ve aylık sezon görünümü. Seviye ligleri yok.
- Ödüller yalnızca rozet, unvan, profil çerçevesi.
- Diğer oyuncunun 3D dünyası serbest kamerayla **salt okunur** ziyaret edilebilir.
- Herkese açık profil: şirket adı, seviye, net değer, kurulu güç, rozetler.
- Oyuncu 3D ziyaretleri kapatabilir; sıralama herkese açıktır.
- Favori şirketler; şirket adı araması ve sıralamadan profile geçiş.
- Sosyal etkileşim: profil görüntüleme, favori, ziyaret. Sohbet, yorum, takipçi akışı yok.
- Sıfırlamada güncel sıralama sıfırlanır; geçmiş rozetler korunur.

## 16 — Arayüz, Mobil ve 3D

- Yarı gerçekçi, modern 3D; koyu oyun arayüzü.
- Masaüstünde tam ekran 3D harita ve açılır yan paneller.
- Mobil tarayıcıda tam oynanabilir responsive 3D; alt navigasyon, tam ekran açılan paneller.
- Orbit/zoom/pan ve mobil dokunmatik kamera hareketleri.
- Ekipman seçilince vurgulama, bilgi kartı, işlem paneli.
- Yerleştirmede şeffaf ghost önizleme ve geçerli/geçersiz konum işaretleri.
- Otomatik grafik kalitesi, ayrıca düşük/orta/yüksek seçimleri.
- Türbin, güneş, vinç, kamyon, teknisyen ve inşaat ilerlemesi animasyonları.
- Gün/gece ve mevsimsel ışık/çevre değişimi; ağır hava simülasyonu zorunlu değil.
- Bildirim merkezi ve küçük toast mesajları.
- Orta seviye bilgisayar ve modern telefonlarda akıcılık hedefi.
- Türkçe ve İngilizce yerelleştirme.

---

# C. TEKNİK MİMARİ

## C1. Teknoloji ve sorumluluklar

| Katman | Teknoloji | Sorumluluk |
|---|---|---|
| Web | Next.js App Router, JavaScript | Sayfalar, sunucu API uçları, SSR/CSR sınırı |
| UI | React, Tailwind CSS | Yönetim panelleri, mobil gezinme, modallar |
| 3D | Three.js, @react-three/fiber, @react-three/drei | Harita, kamera, seçim, sahne, animasyon |
| State | Zustand veya küçük React store | İstemci arayüz durumu; sunucu ekonomik otorite |
| Veri/Auth | Supabase PostgreSQL + Auth | Kullanıcı, şirket, envanter, işlemler, geçmiş |
| Güvenlik | PostgreSQL RLS + sunucu doğrulama | Oyuncu izolasyonu, ziyaret salt okunur |
| Arka plan | Güvenilir zamanlanmış worker + PostgreSQL işlemleri | Saatlik oyun tick'i, rapor, bakım, kredi, sıralama |
| Dosyalar | Supabase Storage | Profil görselleri ve gerekirse dışa aktarımlar |
| Grafik | Recharts vb. | Finans/üretim analitiği |
| PDF | Sunucu PDF üretimi | Rapor dışa aktarma |
| Lokalizasyon | TR/EN sözlükleri | Menü, uyarı, tarih ve para formatları |

**Önemli:** Supabase tek başına uzun süren, yüksek hacimli simülasyon worker'ı anlamına gelmez. Zamanlanmış işler için güvenilir ayrı bir Node.js worker veya uygun yönetilen scheduler kullanın. Next.js sunucusuz istekleri uzun süreli oyun döngüsü olarak kullanmayın.

## C2. Önerilen depo yapısı

```text
energy-tycoon/
  app/
    (auth)/login/page.js
    (auth)/register/page.js
    (game)/game/page.js
    (game)/plants/page.js
    (game)/shop/page.js
    (game)/projects/page.js
    (game)/services/page.js
    (game)/finance/page.js
    (game)/analytics/page.js
    (game)/leaderboard/page.js
    (game)/profile/page.js
    api/game/state/route.js
    api/game/actions/route.js
    api/reports/export/route.js
  components/
    game3d/WorldCanvas.jsx
    game3d/Terrain.jsx
    game3d/PlantModels.jsx
    game3d/PlacementGhost.jsx
    game3d/CameraController.jsx
    ui/
    panels/
  lib/
    auth/
    db/
    economy/
    simulation/
      clock.js
      production.js
      market.js
      batteries.js
      maintenance.js
      construction.js
      finance.js
      settlement.js
    validation/
    i18n/
  worker/
    index.js
    tick-runner.js
    leaderboard.js
  supabase/
    migrations/
    seed.sql
  public/models/
  public/textures/
  tests/
  package.json
```

**Kural:** `.js` ve `.jsx` kullanın; `.ts`/`.tsx` ve TypeScript konfigürasyonu oluşturmayın.

## C3. Veritabanı tasarımı — ana tablolar

- `profiles`: `user_id`, görünür oyuncu adı, dil, oluşturulma tarihi.
- `companies`: `id`, `owner_user_id UNIQUE`, şirket adı, bakiye, XP, seviye, durum, ziyaret izni, başlangıç zamanı.
- `world_sites`: 24 sabit arazi, sınır poligonu/koordinatları, tür, büyüklük, fiyat, kira, trafo mesafesi, gizli potansiyel parametreleri.
- `company_sites`: şirket-arazi ilişkisi, kiralık/sahip, kira başlangıç-bitiş, keşif durumu, tesis adı.
- `equipment_catalog`: türbin/panel/batarya/inverter modelleri, fiyat, kapasite, boyut, ömür, seviye gerekliliği.
- `inventory_items`: şirket, katalog modeli, adet/seri, sipariş ve tahsis durumları, maliyet.
- `installed_assets`: tesis, model, 3D konum/rotasyon, kurulum saati, kondisyon, yaşlanma, bakım zamanı, durum, kalan değer.
- `site_explorations`: keşif hizmeti, tamamlanma zamanı, açılan tahmin aralıkları.
- `projects`, `project_assets`, `project_services`: proje aşaması, maliyet, izin, ekipman ve hizmet rezervasyonu.
- `shipments`: kaynak/hedef, yöntem, ücret, varış saati, durum.
- `grid_nodes`, `grid_connections`: trafo, hat, bağlantı kapasitesi, uzunluk, altyapı değeri.
- `service_catalog`, `service_orders`: hizmet türü, fiyat, hız, başlama/bitiş, iptal/iade, tesis/proje ilişkisi.
- `battery_settings`, `battery_hourly_flows`: eşik fiyatı, rezerv, şarj/deşarj, kayıp.
- `market_hourly_prices`: global oyun saati, gerçekleşen fiyat, tahmin sürümü.
- `hourly_production`: şirket, tesis, varlık, oyun saati, üretilen kWh.
- `hourly_energy_settlements`: oyun saati, tesis, doğrudan satış, batarya satışları, komisyon, net gelir.
- `loans`, `loan_installments`: anapara, sabit faiz, vade, taksit, gecikme, ödeme durumu.
- `ledger_entries`: çift taraflı veya dengelenmiş işlem kaydı; benzersiz işlem kimliği, olay ve oyun saati.
- `asset_valuation_snapshots`: amortisman ve şirket net değeri.
- `maintenance_events`, `failures`: bakım, arıza, onarım ve kondisyon geçmişi.
- `missions`, `company_mission_progress`, `achievements`, `company_achievements`, `login_rewards`.
- `company_notifications`, `company_favorites`.
- `leaderboard_snapshots`, `season_definitions`, `season_results`.
- `simulation_state`, `simulation_ticks`, `simulation_job_claims`: global saat, işlenen son saat, kilit/idempotency.

İndeksler: `(company_id, game_hour)`, `(site_id, game_hour)`, `(status, completes_at_game_hour)`, `(user_id)` ve tekillik gerektiren olay kimlikleri. Şirket özel tablolarında RLS zorunlu. Ziyaret API'si yalnızca izin verilen özet alanları döndürür; özel finans hareketleri ve kullanıcı bilgileri açılmaz.

---

# D. SUNUCU OTORİTELİ OYUN SAATİ VE SİMÜLASYON

## D1. Zaman eşlemesi

Global başlangıç `epoch_real_utc` ve `epoch_game_hour` sabitlenir. Gerçek zaman farkından:

```js
const gameHoursElapsed = Math.floor((nowUtcMs - epochRealUtcMs) / (60 * 60 * 1000 / 24));
const currentGameHour = epochGameHour + gameHoursElapsed;
```

Bu hesap yalnızca hedef oyun saatini verir. Asıl **son işlenen oyun saati** PostgreSQL'de tutulur. Saatlik işleyici kaçırdığı tüm saatleri sıra ile işler. **Bir gerçek saat = 24 oyun saati** olduğundan, ortalama her 2,5 gerçek dakikada bir oyun saati tamamlanır. İşleyici daha sık tetiklenebilir, ancak tamamlanmamış oyun saatini iki kez işleyemez.

Oyun takviminde 365 günlük yıl ve ay sınırları tek bir yardımcı modülden hesaplanmalı; kira, bakım ve kredi vadeleri aynı takvim kurallarını kullanmalı.

## D2. Saatlik işleme sırası

1. Global saat ve fiyatı sabitle; hava/rüzgâr/güneş deterministik parametrelerini üret.
2. Biten teslimat, izin, proje, montaj, keşif ve servis olaylarını tamamla; ilgili ekipmanı aktif hale getir.
3. Bakım gecikmesi, yaşlanma, ömür sonu ve deterministik arıza olaylarını uygula.
4. Her aktif varlığın üretimini hesapla.
5. Üretimi tesisteki bataryalara kurallarına göre yönlendir; kalanını şebeke kapasitesine göre sat.
6. Uygun batarya satışını eşik/rezerv ve 24 saatlik fiyat görünümüyle hesapla; aynı enerjiyi iki kez satma.
7. Üretim, batarya akışı ve elektrik satış kayıtlarını yaz; komisyonu düş; nakdi güncelle.
8. Oyun ayı/yılı sınırında kira, kredi taksiti, bakım otomasyonu, amortisman ve ilgili muhasebe olaylarını işle.
9. Görev/XP kilometre taşları, bildirimler, dönem sonu raporları ve gerektiğinde sıralama özetleri oluştur.
10. `simulation_ticks` benzersiz anahtarıyla işlemi tamamla; son işlenen saati güncelle.

**İşlem güvenliği:** Her saat/şirket kombinasyonu benzersiz olmalı; yeniden denemede ikinci kez gelir yazılmamalı. Çok oyunculu işleyicide `FOR UPDATE SKIP LOCKED` veya eşdeğer iş kiralama/kilitleme mekanizması kullanılmalı. Uzun işlemler küçük partilere bölünmeli.

## D3. Deterministik örnek üretim formülleri

```text
wind_factor = clamp((wind_speed - cut_in) / (rated_speed - cut_in), 0, 1)
wind_kWh = turbine_kW * wind_factor * condition_factor * age_factor * 1_hour

solar_kWh = panel_kW * daylight_factor * site_solar_factor * age_factor * 1_hour
```

- Bunlar oyunlaştırılmış basit formüllerdir, gerçek enerji mühendisliği hesabı değildir.
- Arızalı, bakımda veya ömrü bitmiş varlık için üretim 0.
- Güneş gece 0; türbin minimum yerleşim mesafesi doğrulanır; wake kaybı hesaplanmaz.
- Rastlantısallık, `hash(world_seed, site_id, game_hour, weather_type)` gibi deterministik kaynakla türetilmeli; yeniden çalıştırma aynı sonucu üretmeli.

## D4. Enerji mutabakatı

Her tesis ve saat için zorunlu denge:

```text
üretilen_kWh = doğrudan_satılan_kWh
              + bataryaya_giren_kWh
              + şebeke_kısıtı_nedeniyle_kullanılamayan_kWh

batarya_enerji_değişimi = verimli_şarj_kWh - bataryadan_çekilen_kWh
bataryadan_satılan_kWh = bataryadan_çekilen_kWh * deşarj_verimi
```

Tüm değerler sıfır veya pozitif; batarya doluluğu `[0, kapasite]`; rezerv ayarı korunur. Aynı tesiste birden fazla batarya için tahsis sırası deterministik olmalı. Satış toplamı şebeke kapasitesini geçmemeli. Üretim ve finans kayıtları arasında mutabakat testi olmalı.

## D5. Finans ve kredi doğruluğu

- Para birimi için PostgreSQL `numeric`, uygulamada kuruş/cent temelli güvenli hesap; JavaScript float ile doğrudan muhasebe tutma.
- Her ekonomik olay için benzersiz `idempotency_key`.
- Net şirket değeri hesaplaması varlıkların kalan değerini kullanır; satın alınan ekipmanı hem nakitten düşüp hem aynı anda gider yazma.
- Kredi alımı nakit ve borcu aynı miktarda artırır; tek başına net değeri artırmaz.
- Kredi taksiti anapara ve faiz bileşenlerine ayrılır; faiz gider, anapara borç azalmasıdır.
- Tesis faaliyet kârı ile şirketin kredi sonrası net kârı ayrı gösterilir.
- İflas, zorunlu satış ve yeniden yapılandırma atomik işlem zincirleriyle yönetilir.

---

# E. API VE İŞ AKIŞLARI

## E1. Temel uçlar

| Uç | Metot | Amaç |
|---|---|---|
| `/api/game/state` | GET | Şirket, saat, tesisler, olaylar, özet |
| `/api/game/actions` | POST | Doğrulanan komut dağıtıcısı |
| `/api/sites` | GET | 24 sabit saha + oyuncunun erişim durumu |
| `/api/projects` | GET/POST | Proje listesi, taslak, onay |
| `/api/shop/catalog` | GET | Ekipman katalog ve fiyatları |
| `/api/services/catalog` | GET | Hizmet fiyat ve süreleri |
| `/api/finance` | GET | Kasa, borç, finansal özet |
| `/api/analytics` | GET | Dönemsel rapor ve grafik verileri |
| `/api/reports/export` | POST | CSV/PDF rapor üretimi |
| `/api/leaderboard` | GET | Global ve aylık sezon sıralamaları |
| `/api/companies/[id]/public` | GET | Herkese açık profil ve ziyaret verisi |

`/api/game/actions` örnek eylemler: `BUY_EQUIPMENT`, `LEASE_SITE`, `BUY_SITE`, `ORDER_EXPLORATION`, `CREATE_PROJECT`, `ASSIGN_INVENTORY`, `BUY_SERVICE`, `SET_BATTERY_RULES`, `ENABLE_AUTO_MAINTENANCE`, `REQUEST_LOAN`, `PAY_LOAN_EARLY`, `RENAME_SITE`, `CLOSE_SITE`, `RESET_COMPANY`.

Her komutta: oturum doğrula → şirket sahipliğini kontrol et → şema doğrula → iş kuralı/kaynak kontrolü → veritabanı işlemi → ledger/olay kaydı → güncel durum döndür. İstemciden gönderilen fiyat, bakiye, bitiş zamanı, üretim miktarı kabul edilmez.

## E2. Kritik akış örnekleri

**Türbin ekleme:** Sahaya odaklan → mağazadan model seç → ghost yerleştirme → sunucu yerleşim sınırı ve minimum mesafeyi doğrula → proje maliyeti → ekipman siparişi ve hizmet → depo teslimi → tahsis → saha sevkiyatı → izin/temel → montaj → bağlantı kapasitesi kontrolü → üretime başla.

**Bakım:** Son bakım + 6 oyun ayı yaklaşır → bildirim → manuel hizmet satın al veya otomatik satın alma → bakım süresince ilgili ekipman durumu → kondisyon iyileşmesi → kayıt/masraf.

**Batarya:** Üretim → asgari fiyat/rezerv kuralı → batarya kapasitesi → şebeke limiti → satış saatine göre enerji hareketleri → net gelir ve ek kazanç analizi.

**Şirket ziyareti:** Profil görünürlüğünü kontrol et → yalnızca kamusal 3D sahne verilerini getir → ziyaret modunu salt okunur aç → mutasyon API'leri sahibin oturumuna ve sahipliğine bağlı kalır.

---

# F. 3D SAHNE VE ARAYÜZ TASARIMI

## F1. 3D mimari

- Harita tek kaynaklı statik coğrafya verisinden oluşturulur. 24 arazi poligonu ayrı seçilebilir nesnelerdir.
- Kamera uzakken düşük detay, yakında yüksek detay; instancing ve frustum culling kullanılır.
- GLB/glTF modelleri sıkıştırılmış; paylaşılan materyal ve geometri; cihaz kalitesine göre gölge, çözünürlük ve efekt azaltma.
- Dünya ile UI ayrımı: 3D sahne oyun verisini okur; finansal kararları kendisi hesaplamaz.
- Ekipman seçiminde raycasting; seçilen nesne vurgulanır ve yan panel açılır.
- Ghost yerleştirme, sunucu doğrulamasından önce yerel hızlı ön kontrol sağlar; sunucu son kararı verir.
- Vinç, kamyon ve teknisyen animasyonları proje durumuna bağlı; simülasyon sürelerini animasyonun oynatılması belirlemez.
- Mevsim/gün-gece görsel parametreleri ortak oyun saatinden türetilir.

## F2. Masaüstü bilgi mimarisi

- Üst HUD: bakiye, kurulu güç, son gelir, spot fiyat, oyun tarihi, bildirim.
- Ana alan: tam ekran 3D dünya.
- Açılır paneller: Araziler/Harita, Ekipman Mağazası, Projeler, Depo/Lojistik, Şebeke, Santrallerim, Hizmet Pazarı, Finans, Analitik, Liderlik, Profil.
- Sağ bağlamsal panel: seçilen arazi/ekipman/proje ayrıntısı ve eylemleri.
- Tesis listesi kart/tablo; **ayrı tesis karşılaştırma ekranı oluşturulmaz**.

## F3. Mobil bilgi mimarisi

- Tam ekran 3D canvas; üstte kompakt HUD.
- Alt navigasyon: Harita, Santraller, Mağaza, Finans, Menü. Diğer modüller Menü altında.
- Açılır ekranlar tam ekran sheet/panel; dokunmatik hedefler yeterince büyük.
- Tek parmak orbit/pan davranışı tutarlı belirlenmeli; iki parmak zoom ve pan; yerleştirme sırasında kamera hareketi ile sürükleme ayrıştırılmalı.
- Düşük/orta/yüksek kalite seçimi; otomatik varsayılan.
- Erişilebilirlik: klavye odakları, kontrast, ikon yanında metin, hareket azaltma tercihi mümkünse desteklenir.

## F4. İki dil

- Metinler `tr` ve `en` sözlüklerinde anahtarlarla tutulur; sabit Türkçe dizeler JSX içine gömülmez.
- Para USD olarak kalır; sayı/tarih gösterimi seçilen dile göre formatlanır.
- Oyun takvimi gerçek takvimden ayrıdır; raporlarda “oyun günü/ayı/yılı” açık yazılır.

---

# G. GELİŞTİRME AŞAMALARI VE KABUL KRİTERLERİ

## Faz 0 — Temel proje ve veri modeli

- Next.js JavaScript App Router, Tailwind, Supabase kurulumu; Auth ve RLS.
- 24 saha seed verisi, katalog seed verisi, oyun takvimi ve şirket başlangıç verisi.
- Finans ledger ve idempotency altyapısı.
- **Kabul:** Bir kullanıcı tek şirket oluşturur; diğer oyuncunun özel verilerini okuyamaz; $100.000 + başlangıç varlıkları tek kez verilir.

## Faz 1 — Oynanabilir ekonomik çekirdek

- Global saat, worker, deterministik hava ve spot fiyat, rüzgâr/güneş üretimi, otomatik satış, offline catch-up.
- Basit 2D/debug ekranıyla doğrulama; 3D'den bağımsız ekonomi testleri.
- **Kabul:** Aynı saat tekrar işlendiğinde gelir iki kez yazılmaz; offline 7 oyun günü ile online işleme aynı sonuçları verir.

## Faz 2 — 3D dünya ve ilk yatırım döngüsü

- Harita, kamera, saha seçimi, yerleştirme ghost'u, türbin/panel modelleri.
- Ekipman mağazası, sınırsız depo, sevkiyat, proje/izin/montaj, hizmet satın alma.
- **Kabul:** Oyuncu yeni türbin satın alır, projeye tahsis eder, inşa eder ve üretime alır; mobilde aynı işlem yapılabilir.

## Faz 3 — Altyapı, batarya ve operasyon

- Şebeke/trafo kapasitesi, batarya kuralları, bakım/arıza, ekipman ömrü ve değişim.
- **Kabul:** Şebeke limiti ve batarya enerji dengesi korunur; bakım gecikmesi/arıza üretimi etkiler; hiçbir enerji iki kez satılmaz.

## Faz 4 — Finans ve tesis yönetimi

- Kredi, eşit aylık taksit, faiz, gecikme, yeniden yapılandırma/iflas.
- Santrallerim kart/tablo, filtre, bakım otomasyonu, kârlılık.
- **Kabul:** Kredi anapara/faiz ayrımı doğru; şirket değeri krediyle yapay büyümez; tesis kapanışı borç ve mülkiyet kurallarıyla uyumlu.

## Faz 5 — Analitik, hesap ilerlemesi ve sosyal

- Gün/hafta/ay/yıl raporları, CSV/PDF, 30 oyun günü tahmini, aylık rapor, öneriler.
- XP/görev/rozet, giriş serisi, şirket sıfırlama.
- Saatlik liderlik tablosu, aylık sezon, kamusal profil, favoriler, salt okunur 3D ziyaret.
- **Kabul:** Rapor toplamları ledger/üretim kayıtlarıyla uyuşur; reset sonrası güncel sıralama sıfırlanır ve geçmiş rozetler korunur.

## Faz 6 — Yayın kalitesi

- TR/EN, mobil UX, otomatik kalite, performans profili, güvenlik denetimi, veri bütünlüğü, gözlemlenebilirlik, hata yakalama, yük testleri.
- **Kabul:** Orta seviye PC ve modern telefonda oynanabilirlik; offline senaryo, eşzamanlı işlem, kesintiden kurtarma, idempotency ve RLS testleri geçer.

**MVP önerisi:** Önce Faz 0–3 ile çalışan tek oyunculu ekonomi döngüsünü yayın öncesi kapalı testte doğrulayın. Finansın temel ledger ve kredi limiti altyapısını Faz 0'dan itibaren hazırlayın; kapsamlı sosyal özellikleri Faz 5'e bırakın. Bu sıralama kapsamı azaltır ama kesinleşmiş ürün kurallarını değiştirmez.

---

# H. TEST SENARYOLARI

1. Aynı kullanıcı iki kez kayıt isteği gönderir: tek şirket ve tek başlangıç hibesi.
2. Oyuncu sekmeyi kapatır; 72 oyun saati sonra açar: tüm üretim, satış ve masraflar tek kez işlenmiş.
3. Aynı saat için iki worker çalışır: yalnızca biri finansal mutabakatı kaydeder.
4. Depodaki tek türbin iki projeye tahsis edilmeye çalışılır: ikinci işlem reddedilir.
5. Arazi dışına veya türbin minimum mesafesine aykırı yerleştirme: sunucu reddeder.
6. İzin ve sevkiyat paralel sürer; ekipman gelmeden montaj tamamlanamaz.
7. Şebeke limiti 1 MW; üretim 1,5 MWh/saat: satış ve batarya akışı limiti aşmaz.
8. Batarya dolu ve fiyat eşik altında: fazla üretim doğrudan satılır; doluluk taşmaz.
9. Şebekeden şarj API çağrısı: reddedilir.
10. Bakım gecikir: kondisyon ve arıza riski etkilenir; doğal afet hasarı üretilmez.
11. 25 yıllık türbin ve 15 yıllık batarya ömrü biter: üretim/satış durur.
12. Kredi alınır: nakit artar, borç artar, net şirket değeri aynı kalır (masraflar hariç).
13. Taksit ödemesi: anapara borcu azaltır, faiz giderdir; çift tahsilat olmaz.
14. Aynı günlük giriş ödülü ikinci kez istenir: reddedilir.
15. Ziyaretçi başka şirketin ekipmanını taşımaya çalışır: yetkisiz işlem reddedilir.
16. Şirket sıfırlanır: güncel varlık/sıralama temizlenir, eski kozmetik rozetler korunur.
17. CSV/PDF raporu: aynı filtre ve dönem için sayısal toplamlar eşleşir.
18. Mobil yerleştirme: tek/çift parmak jestleri karışmadan kullanılabilir.

---

# I. GELİŞTİRME AJANI İÇİN ANA TALİMAT

> Mevcut boş Next.js projesi içinde Energy Tycoon'u geliştir. **Kesinlikle TypeScript kullanma; yalnızca JavaScript/JSX kullan.** Next.js App Router, Tailwind CSS, Supabase PostgreSQL/Auth, Three.js ve React Three Fiber kullan. Bu GDD'deki 16 modülün bağlayıcı kararlarını koru. Önce şema/migration, RLS, deterministik oyun saati ve ledger tasarla; sonra sunucu simülasyonunu ve otomatik testleri oluştur; 3D harita ve arayüzü bunun üzerine kur. Oyun hızı 24×, ortak oyun saati, ortak spot fiyat ve oyuncu başına özel dünya. Para birimi USD. Oyuncu tek şirketle, kiralık arazi, çalışan türbin ve $100.000 ile başlar. Ekonomik mutasyonlar sunucu otoritelidir; istemci bakiyesi veya fiyatı belirleyemez. Çevrimdışı ilerleme, idempotency, şebeke kapasitesi, enerji korunumu, kredi muhasebesi, ekipman ömrü, bakım ve arıza kurallarını test et. Her fazın sonunda çalışan ve test edilmiş bir dikey dilim üret; yalnızca görsel mockup yapıp tamamlandı deme. Mobil tarayıcıda tam oynanabilir 3D ve Türkçe/İngilizce arayüz sağla.

---

# J. UYGULAMA ÖNCESİ SAYISAL DENGELEME PARAMETRELERİ

Aşağıdakiler **karara bağlanmış değerler değildir**; yapılandırılabilir seed/config olarak tutulmalı ve oyun testlerinde ayarlanmalıdır:

- Türbin/güneş katalog modelleri ve USD satın alma fiyatları.
- Arazi satın alma/kiralama bedelleri ve sahaların gerçek gizli potansiyelleri.
- Rüzgâr doğrusal modelinin cut-in/rated eşikleri, mevsimsel aralıkları.
- Spot fiyatın minimum/maksimum sınırları, günlük eğri ve komisyon oranı.
- Bakım/onarım maliyetleri, kondisyon düşüşü, arıza ihtimalleri.
- Sabit kredi faiz oranı, gecikme faizi, mühlet ve zorunlu satış öncelikleri.
- Amortisman oranı, hurda/geri satış katsayısı.
- Proje süreleri, ekspres ücret çarpanı, bağlantı/trafo kapasite eşikleri.
- XP, seviye gereksinimleri, görev ödülleri, günlük giriş serisi artışları.
- Raporlama ve sıralama için performans/ölçek hedefleri.

**Belge sonu — Energy Tycoon GDD v2.0**
