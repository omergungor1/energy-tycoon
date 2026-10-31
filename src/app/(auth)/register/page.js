'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Building2, User, ArrowRight, Lock, Mail, Globe, CheckCircle2 } from 'lucide-react';
import AuthLeaderboard from '@/components/auth/AuthLeaderboard';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState('tr');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            company_name: companyName.trim() || `${displayName || 'CleanEnergy'} Corp`,
            display_name: displayName.trim() || email.split('@')[0],
            language
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // Log in immediately and redirect to game
        router.push('/game');
        router.refresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Kayıt işlemi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3.5 sm:p-6 lg:p-10 relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Grid Container */}
      <div className="w-full max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start my-auto">
        {/* Left Column (6 cols on lg): Register Form Card */}
        <div className="lg:col-span-6 w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-5 text-center">
            <Image
              src="/logo.png"
              alt="Energy Tycoon Logo"
              width={72}
              height={72}
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain mb-2 drop-shadow-xl"
              priority
            />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              ENERGY TYCOON
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Yeni Şirket Kuruluşu & Devlet Enerji Hibesi
            </p>
          </div>

          {/* Starter Pack Perks */}
          <div className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs space-y-1.5 text-emerald-300">
            <div className="font-semibold text-emerald-200 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Kayıt Anında Hesabınıza Tanımlanacak Başlangıç Paketi:</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 pl-5">
              <span>• <strong>$100.000 USD</strong> nakit hibe başlangıç sermayesi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 pl-5">
              <span>• 1 yıl ücretsiz kiralık <strong>Whispering Pines Ridge</strong> arazisi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 pl-5">
              <span>• Sahada üretime hazır <strong>1 Adet Vestas V90 Türbini (2.0 MW)</strong></span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Şirket Adı
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nova Energy Corp"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Yetkili / Oyuncu Adı
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Onur Bey"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ceo@novaenergy.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Şifre (En az 6 karakter)
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Dil Tercihi
                </label>
                <div className="relative">
                  <Globe className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="tr">Türkçe (TR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <span>Şirketi Kur ve Hibeyi Al ($100k)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              Zaten bir şirketiniz var mı?{' '}
              <Link
                href="/login"
                className="font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
              >
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column (6 cols on lg): AuthLeaderboard with Guest Mode */}
        <div className="lg:col-span-6 w-full">
          <AuthLeaderboard />
        </div>
      </div>
    </div>
  );
}
