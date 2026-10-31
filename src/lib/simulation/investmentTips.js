/**
 * Energy Tycoon Pro Investment & Strategy Guide
 * Actionable tips on fast cash accumulation, leverage, land lease vs buy, and capacity scaling.
 */

export const INVESTMENT_TIPS_CATEGORIES = [
  {
    id: 'cashflow',
    titleTr: 'Kasayı Hızla Büyütme Taktikleri',
    titleEn: 'Fast Cash Flow & Wealth Generation',
    icon: 'TrendingUp',
    badgeTr: 'Nakit Akışı',
    badgeEn: 'Cash Flow',
    tips: [
      {
        titleTr: 'Spot Piyasada Zirve Saatleri Yakalayın',
        titleEn: 'Capitalize on Peak Spot Market Hours',
        summaryTr: 'Elektrik fiyatı 18:00 - 22:00 saatleri arasında zirve yapar (peak hour). Gündüzleri ise güneş üretimi bol olduğu için fiyat daha düşüktür.',
        summaryEn: 'Power spot rates peak between 18:00 - 22:00. Midday rates are competitive due to solar abundance.',
        actionTr: 'Rüzgar santralleri ve batarya deşarjlarını akşam zirve saatlerine denk getirin; kWh başına %40 daha fazla ciro elde edin.',
        actionEn: 'Align battery discharge with evening peak hours to achieve ~40% higher revenue per kWh.'
      },
      {
        titleTr: 'Güneş Takip Sistemi (Tracker) Kurun',
        titleEn: 'Deploy Solar Single-Axis Trackers',
        summaryTr: 'Güneş santrallerine takılan tek eksenli takip sistemleri (Tracker), gün boyu güneşi takip ederek günlük üretimi net %25 artırır.',
        summaryEn: 'Single-axis solar trackers boost net energy generation by 25% across dawn and dusk hours.',
        actionTr: 'Santrallerim sekmesinden güneş sahanızı seçip Güneş Takip Sistemi yükseltmesini ($28,000) uygulayın. Yatırım 1-2 ayda kendini amorti eder.',
        actionEn: 'Upgrade your solar site with single-axis tracking ($28,000) from the Plants panel for rapid ROI.'
      },
      {
        titleTr: 'Periyodik Bakımı Asla Aksatmayın',
        titleEn: 'Never Neglect Preventive Maintenance',
        summaryTr: 'Aşınan ve yıpranan türbinler (%70 altı kondisyon), normalden %40 daha az enerji üretir ve beklenmedik arıza riski taşır.',
        summaryEn: 'Worn equipment with condition below 70% produces up to 40% less power and incurs outage risks.',
        actionTr: 'Yılda bir kez ($5,000) bakım yaparak ekipman kondisyonunu %100’de tutun. Bu harcama kayıp cironun yanında önemsizdir.',
        actionEn: 'Perform annual maintenance ($5,000) to keep asset condition at 100% and avoid silent revenue loss.'
      },
      {
        titleTr: 'Batarya ile Akıllı Arbitraj Yapın',
        titleEn: 'Smart Energy Arbitrage with Batteries',
        summaryTr: 'Bataryalar sadece yedek güç değildir; geceleri ucuz elektriği depolayıp akşam yüksek fiyattan satarak risksiz kar sağlar.',
        summaryEn: 'BESS units can store cheap night valley energy and discharge during expensive peak hours.',
        actionTr: 'Batarya kurallarında minimum satış fiyatını $0.0900/kWh olarak ayarlayın ve akıllı otomatik şarj modunu aktif edin.',
        actionEn: 'Set minimum sell threshold to $0.0900/kWh with smart auto-charge enabled in Battery Settings.'
      }
    ]
  },
  {
    id: 'loans',
    titleTr: 'Krediyi Doğru ve Akıllı Kullanma',
    titleEn: 'Smart Leverage & Loan Management',
    icon: 'Landmark',
    badgeTr: 'Kaldıraç & Finans',
    badgeEn: 'Leverage & Finance',
    tips: [
      {
        titleTr: 'Kaldıraç Etkisi: Nakit Biriktirmek Yerine Borçla Büyüyün',
        titleEn: 'Financial Leverage: Grow with Debt vs Waiting for Cash',
        summaryTr: 'Banka kredi faizleri yıllık %5.5 - %6.5 arasındadır. Ancak yeni kuracağınız bir rüzgar veya güneş santrali yıllık %30 - %45 yatırım getirisi (ROI) sağlar.',
        summaryEn: 'Bank borrowing costs 5.5% - 6.5% annually, whereas new generation assets yield 30% - 45% annual ROI.',
        actionTr: 'Getirisi faizden 5 kat yüksek olan tesislere yatırım yapmak için borçlanmaktan çekinmeyin; böylece rakiplerinizden 4 kat hızlı büyürsünüz.',
        actionEn: 'Leverage cheap bank capital to build profitable generation sites instead of waiting months for cash.'
      },
      {
        titleTr: '%50 Yasal Borçlanma Tavanını İzleyin',
        titleEn: 'Respect the 50% Statutory Loan Ceiling',
        summaryTr: 'Bankalar şirketinizin Net Değerinin (Net Worth) en fazla %50’si kadar kredi verir. Fazla borçlanmaya çalışmak başvurunun reddedilmesine yol açar.',
        summaryEn: 'Lending capacity is legally bounded at 50% of your company Net Worth.',
        actionTr: 'Kredi limitinizi artırmak için önce mevcut tesisleri büyütün veya tapu satın alarak şirket defter değerini yükseltin.',
        actionEn: 'Expand asset book value or purchase land deeds to raise your maximum borrowing ceiling.'
      },
      {
        titleTr: 'Likidite Güvenlik Tamponu Bırakın',
        titleEn: 'Maintain a Cash Liquidity Buffer',
        summaryTr: 'Kasanızda sıfır dolarla çalışmak en büyük iflas tuzağıdır. Taksit gününde kasada para yoksa temerrüt cezası uygulanır.',
        summaryEn: 'Operating at zero cash causes missed loan installments and default penalties.',
        actionTr: 'Kasanızda her zaman en az 2-3 aylık kredi taksit tutarı kadar acil durum nakit rezervi bulundurun.',
        actionEn: 'Always retain at least 2-3 months of loan installment cash as a defensive treasury buffer.'
      }
    ]
  },
  {
    id: 'land',
    titleTr: 'Arsa: Kiralamak mı, Satın Almak mı?',
    titleEn: 'Land Strategy: Lease vs Outright Purchase',
    icon: 'MapPin',
    badgeTr: 'Arsa & Mülkiyet',
    badgeEn: 'Real Estate Strategy',
    tips: [
      {
        titleTr: 'Erken Aşama: Kesinlikle KİRALAYIN!',
        titleEn: 'Early Game: Always LEASE First!',
        summaryTr: 'Oyunun başında $100,000 sermayeniz varken $80,000 verip tapu almak ölümcül bir hatadır; çünkü üzerini donatacak para kalmaz.',
        summaryEn: 'Spending $80k to buy land with $100k capital stalls your cash flow; no funds remain for turbines.',
        actionTr: '1 veya 3 yıllık kiralama yapın ($10,000 - $25,000); kalan nakdinizle hemen türbin ve panel alarak derhal gelir üretmeye başlayın.',
        actionEn: 'Choose 1 or 3-year leases to reserve 80% of your starting capital for high-yield power equipment.'
      },
      {
        titleTr: 'Orta & İleri Aşama: TAPU SATIN ALIN!',
        titleEn: 'Mid & Late Game: BUY the Title Deed!',
        summaryTr: 'Kasanız güçlendiğinde tapuyu satın almak ($60k - $180k), yıllık kira yükünü tamamen sıfırlar ve o arsayı şirketinizin mülkü yapar.',
        summaryEn: 'Acquiring deeds eliminates recurring annual rent and adds real property to your balance sheet.',
        actionTr: 'Tapusu alınan sahalar şirket Net Değerine (Net Worth) doğrudan eklenir ve bankalardaki kredi limitinizi anında katlar.',
        actionEn: 'Owned land increases net worth 1:1, drastically expanding your statutory bank borrowing limit.'
      }
    ]
  },
  {
    id: 'capacity',
    titleTr: 'Kurulu Gücü (MW) En Hızlı Artırma',
    titleEn: 'Rapid Capacity & MW Scaling',
    icon: 'Zap',
    badgeTr: 'Kapasite & MW',
    badgeEn: 'Capacity & Grid',
    tips: [
      {
        titleTr: 'Coğrafyaya Göre Doğru Teknolojiyi Eşleştirin',
        titleEn: 'Match Technology to Geographical Potential',
        summaryTr: 'Rüzgar sahalarında güneş paneli kurmak veya güneş sahalarında türbin dikmek kapasite faktörünü %30’a kadar düşürür.',
        summaryEn: 'Building solar in high-wind mountain ridges or wind turbines in calm valleys wastes potential.',
        actionTr: 'Whispering Pines & Stormcrest gibi tepe sahalara Rüzgar; Sun Valley & Golden Sands sahalarına Güneş kurun.',
        actionEn: 'Place wind turbines on ridges (Stormcrest) and solar arrays on high-irradiance plains (Sun Valley).'
      },
      {
        titleTr: 'Trafo ve Şebeke Dağıtım Limiti',
        titleEn: 'Substation & Grid Interconnection Cap',
        summaryTr: 'Adanın ana trafosu 100 MW toplam dağıtım kapasitesine sahiptir. İletim mesafesi uzadıkça hat kayıpları artar.',
        summaryEn: 'Central island substation provides 100 MW capacity with distance-dependent transmission losses.',
        actionTr: 'Merkeze yakın sahalardan başlayarak hat kayıplarını minimumda tutun.',
        actionEn: 'Prioritize sites closer to the central substation to minimize transmission loss coefficients.'
      }
    ]
  }
];

export const GOLDEN_RULES_SUMMARY = [
  {
    id: 1,
    ruleTr: 'Kira ile başla, nakdi ekipmana yatır, tapuyu sonra al.',
    ruleEn: 'Start with leases, invest cash in equipment, buy deeds later.'
  },
  {
    id: 2,
    ruleTr: 'Güneş santrallerine derhal Güneş Takip Sistemi ekle (+%25 üretim).',
    ruleEn: 'Add single-axis trackers to solar plants immediately (+25% yield).'
  },
  {
    id: 3,
    ruleTr: 'Düşük faizli kredileri kullan; tesis getirisi faizden 5 kat yüksektir.',
    ruleEn: 'Use low-rate bank loans; project ROI is 5x higher than borrowing interest.'
  },
  {
    id: 4,
    ruleTr: 'Yıllık $5,000 bakımı kaçırma; aşınmış türbin servet kaybettirir.',
    ruleEn: 'Never miss annual $5k maintenance; degraded assets bleed massive revenue.'
  },
  {
    id: 5,
    ruleTr: 'Her gün giriş yapıp streak bonusunu al; 7. günde $50,000 mega hibe seni bekliyor!',
    ruleEn: 'Log in daily for streak rewards; claim the $50k mega grant on day 7!'
  }
];

