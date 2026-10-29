import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Zap, ArrowRight, ShieldCheck, Sun, Wind, BatteryCharging, Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/game');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Energy Tycoon Logo"
            width={44}
            height={44}
            className="w-11 h-11 object-contain drop-shadow-md"
            priority
          />
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            ENERGY TYCOON
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Şirketini Kur</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center flex flex-col items-center justify-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>v2.0 — Çok Oyunculu Küresel Enerji & Arbitraj Simülasyonu</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
          Kendi Temiz Enerji{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            İmparatorluğunu Kur
          </span>
        </h1>

        <p className="max-w-2xl text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
          3D haritada 24 yatırım sahasını keşfet, rüzgâr türbinleri ve dev güneş tarlaları inşa et,
          elektriğini ortak spot piyasada sat ve batarya arbitrajıyla sektörün en zengin enerji kralı ol.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>$100.000 Hibe ile Hemen Başla</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-sm rounded-2xl transition-all"
          >
            Mevcut Şirkete Giriş
          </Link>
        </div>

        {/* Feature Grid Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">Rüzgâr & Güneş Üretimi</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              24× hızlandırılmış ortak saat, 4 mevsim ve gece-gündüz ışık döngüsü ile gerçekçi üretim modeli.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">Batarya Arbitrajı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spot fiyatın dip yaptığı saatlerde elektriği depola, akşam zirve saatlerinde devasa kârla şebekeye sat.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white mb-1">Küresel Rekabet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Şirket net değeri, toplam üretim ve kârlılık liderlik tablosunda tüm oyuncularla yarış.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/60 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Energy Tycoon"
            width={20}
            height={20}
            className="w-5 h-5 object-contain opacity-70"
          />
          <span>© 2026 Energy Tycoon — Next.js, Supabase & Three.js</span>
        </div>
        <div className="flex gap-4">
          <span>Türkçe & English</span>
          <span>USD ($)</span>
          <span>Sunucu Otoriteli Ekonomi</span>
        </div>
      </footer>
    </div>
  );
}
