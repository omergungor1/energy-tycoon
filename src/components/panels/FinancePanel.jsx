'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  TrendingUp,
  DollarSign,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Lock,
  X,
  CreditCard,
  Wallet
} from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { useCurrency } from '@/context/CurrencyContext';

export default function FinancePanel({
  company,
  finance,
  activeLoans = [],
  lang,
  onActionSuccess
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const { formatMoney, symbol } = useCurrency();
  const [loanPrincipal, setLoanPrincipal] = useState(50000);
  const [termYears, setTermYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [toast, setToast] = useState(null);
  const [repayLoadingId, setRepayLoadingId] = useState(null);

  const maxBorrow = Number(finance?.maxBorrowingPower || 0);
  const totalDebt = Number(finance?.totalDebt || 0);
  const netWorth = Number(finance?.netWorth || 0);
  const companyCash = Number(company?.cash || 0);

  // Auto-dismiss toast notification after 7 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Determine loan eligibility & blocking reason
  const getLoanBlockingReason = () => {
    if (maxBorrow <= 0) {
      if (totalDebt > 0) {
        return {
          title: 'Kredi Borçlanma Sınırı Dolu',
          badge: 'Limit Dolu',
          shortDesc: `Şirketinizin aktif $${totalDebt.toLocaleString()} tutarında kredi borcu bulunmaktadır. Bankacılık kuralı gereği azami borç tavanı, şirket Net Değerinizin %50'si ile sınırlandırılmıştır ($${(Math.max(0, netWorth * 0.5)).toLocaleString()}).`,
          details: [
            { label: 'Aktif Kredi Borcu', val: `$${totalDebt.toLocaleString()}`, highlight: true },
            { label: 'Şirket Net Değeri', val: `$${netWorth.toLocaleString()}` },
            { label: 'Yasal Borç Tavanı (%50)', val: `$${(Math.max(0, netWorth * 0.5)).toLocaleString()}` },
            { label: 'Kullanılabilir Ek Kredi', val: '$0', highlight: true }
          ],
          suggestion: 'Aşağıdaki tablodan mevcut borcunuzu ödeyerek veya yeni santral yatırımlarıyla şirket net değerinizi büyüterek kredi limitinizi hemen yeniden açabilirsiniz.'
        };
      } else if (netWorth <= 0) {
        return {
          title: 'Yetersiz Şirket Net Değeri',
          badge: 'Teminatsız',
          shortDesc: 'Şirketinizin toplam net değeri sıfır veya negatif olduğu için banka teminatsız kredi tahsis edemiyor.',
          details: [
            { label: 'Mevcut Net Değer', val: `$${netWorth.toLocaleString()}`, highlight: true },
            { label: 'Gereksinim', val: 'Pozitif net varlık ve teminat' }
          ],
          suggestion: 'Yeni araziler kiralayıp santraller kurarak şirket net değerinizi pozitif seviyeye çıkarmalısınız.'
        };
      }
    }

    if (loanPrincipal > maxBorrow) {
      return {
        title: 'Talep Tutarı Limiti Aşıyor',
        badge: 'Tutar Fazla',
        shortDesc: `Talep ettiğiniz $${loanPrincipal.toLocaleString()} tutarı, kullanılabilir yasal limitiniz olan $${maxBorrow.toLocaleString()}'nin üzerindedir.`,
        details: [
          { label: 'Talep Edilen', val: `$${loanPrincipal.toLocaleString()}`, highlight: true },
          { label: 'Maksimum İzin Verilen', val: `$${maxBorrow.toLocaleString()}` }
        ],
        suggestion: `Kredi tutarını en fazla $${maxBorrow.toLocaleString()} olarak ayarlamalısınız.`
      };
    }

    if (loanPrincipal < 5000) {
      return {
        title: 'Asgari Kredi Tutarı Altında',
        badge: 'Min $5.000',
        shortDesc: 'Ticari yatırım kredisi en az $5.000 olabilir.',
        details: [
          { label: 'Girilen Tutar', val: `$${loanPrincipal.toLocaleString()}`, highlight: true },
          { label: 'Asgari Limit', val: '$5.000' }
        ],
        suggestion: 'Lütfen en az $5.000 tutarında bir kredi miktarı girin.'
      };
    }

    return null;
  };

  const blockingReason = getLoanBlockingReason();
  const isBlocked = Boolean(blockingReason);

  // Triggered when user attempts to submit or click the button
  const handleBlockedClick = (e) => {
    e.preventDefault();
    if (!blockingReason) return;

    setToast({
      type: 'warning',
      title: blockingReason.title,
      message: blockingReason.shortDesc,
      details: blockingReason.details,
      suggestion: blockingReason.suggestion
    });

    setFeedback({
      type: 'error',
      text: `${blockingReason.title}: ${blockingReason.shortDesc}`
    });
  };

  const handleRequestLoan = async (e) => {
    e.preventDefault();
    if (isBlocked) {
      handleBlockedClick(e);
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_LOAN',
          payload: { principal: loanPrincipal, termYears }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kredi talebi reddedildi.');

      setFeedback({ type: 'success', text: data.message });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Repay active loan (installment or full payoff)
  const handleRepayLoan = async (loanId, amount) => {
    setRepayLoadingId(loanId);
    setFeedback(null);

    try {
      const res = await fetch('/api/game/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPAY_LOAN',
          payload: { loanId, amount }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ödeme gerçekleştirilemedi.');

      setFeedback({ type: 'success', text: data.message });
      setToast({
        type: 'success',
        title: 'Ödeme Başarılı',
        message: data.message,
        suggestion: 'Borcunuz azaldığı için kredi limitiniz yeniden hesaplandı!'
      });

      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setRepayLoadingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto text-slate-100 relative">
      {/* Floating Warning Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl shadow-amber-950/50 text-slate-100">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-300">{toast.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Bankacılık & Finans Kuralı</span>
                </div>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed mb-3">
              {toast.message}
            </p>

            {toast.details && (
              <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 space-y-1 mb-3 font-mono text-[11px]">
                {toast.details.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">{item.label}:</span>
                    <strong className={item.highlight ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                      {item.val}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            {toast.suggestion && (
              <div className="text-[11px] text-amber-200 bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{toast.suggestion}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Landmark className="w-6 h-6 text-emerald-400" />
          {dict.finance.title}
        </h2>
        <p className="text-sm text-slate-400 mt-1">{dict.finance.subtitle}</p>
      </div>

      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Net Worth Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          {dict.finance.netWorthBreakdown}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.cash}</span>
            <strong className="text-emerald-400 font-mono text-sm">{formatMoney(finance?.cashVal || 0, { decimals: 0 })}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.assetsVal}</span>
            <strong className="text-white font-mono text-sm">{formatMoney(finance?.assetsBookValue || 0, { decimals: 0 })}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.landVal}</span>
            <strong className="text-white font-mono text-sm">{formatMoney(finance?.ownedLandValue || 0, { decimals: 0 })}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.gridVal}</span>
            <strong className="text-cyan-400 font-mono text-sm">{formatMoney(finance?.infrastructureValue || 0, { decimals: 0 })}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.totalDebt}</span>
            <strong className="text-red-400 font-mono text-sm">-{formatMoney(finance?.totalDebt || 0, { decimals: 0 })}</strong>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] text-emerald-300 block uppercase font-bold">Toplam Net Değer</span>
            <strong className="text-emerald-300 font-mono text-base">{formatMoney(finance?.netWorth || 0, { decimals: 0 })}</strong>
          </div>
        </div>

        {/* Borrowing Power Notification */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <span>{dict.finance.borrowingLimit}:</span>
            {maxBorrow <= 0 && (
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold">
                LİMİT DOLU
              </span>
            )}
          </div>
          <strong className={`font-mono text-sm ${maxBorrow > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {formatMoney(maxBorrow, { decimals: 0 })}
          </strong>
        </div>
      </div>

      {/* Commercial Loan Request Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Ticari Yatırım Kredisi Talebi
          </h3>
          {isBlocked && (
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {blockingReason?.badge}
            </span>
          )}
        </div>

        <form onSubmit={handleRequestLoan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {dict.finance.loanAmount} (Maks: {formatMoney(maxBorrow, { decimals: 0 })})
              </label>
              <input
                type="number"
                min="5000"
                max={maxBorrow > 0 ? maxBorrow : 0}
                step="5000"
                value={loanPrincipal}
                disabled={maxBorrow <= 0}
                onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {dict.finance.loanTerm}
              </label>
              <select
                value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={1}>1 Oyun Yılı (%8 Yıllık Faiz - 12 Taksit)</option>
                <option value={3}>3 Oyun Yılı (%10 Yıllık Faiz - 36 Taksit)</option>
                <option value={5}>5 Oyun Yılı (%12 Yıllık Faiz - 60 Taksit)</option>
              </select>
            </div>
          </div>

          {/* Detailed Reason Box: Explains why loan is blocked right in the card */}
          {blockingReason && (
            <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-4 text-xs text-amber-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Neden Kredi Çekemiyorum? ({blockingReason.title})</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {blockingReason.shortDesc}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                {blockingReason.details.map((d, idx) => (
                  <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">{d.label}</span>
                    <strong className={d.highlight ? 'text-amber-400 font-bold text-xs' : 'text-white text-xs'}>
                      {d.val}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-amber-300 bg-amber-950/60 p-2.5 rounded-lg border border-amber-800/60 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{blockingReason.suggestion}</span>
              </div>
            </div>
          )}

          {/* Action Button: Clickable even when blocked so user gets the detailed toast notice */}
          <button
            type="button"
            onClick={isBlocked ? handleBlockedClick : handleRequestLoan}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isBlocked
                ? 'bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 hover:border-amber-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {loading ? (
              'Kredi Değerlendiriliyor...'
            ) : isBlocked ? (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Kredi Çek (Limit Dolu — Bilgi İçin Tıklayın)</span>
              </>
            ) : (
              dict.finance.requestLoanBtn
            )}
          </button>
        </form>
      </div>

      {/* Active Loans Table with Early Payoff Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          {dict.finance.activeLoans} ({activeLoans.length})
        </h3>

        {activeLoans.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Aktif kredi borcunuz bulunmuyor. Şirketiniz borçsuz ve sermaye yapısı tam güvende.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5">Kredi ID</th>
                  <th>Anapara</th>
                  <th>Kalan Borç</th>
                  <th>Aylık Taksit</th>
                  <th>Yıllık Faiz</th>
                  <th>Durum</th>
                  <th className="text-right">Erken Borç Ödeme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activeLoans.map((l) => {
                  const remBal = Number(l.remaining_balance || 0);
                  const installment = Number(l.monthly_installment || 0);
                  const isPaying = repayLoadingId === l.id;

                  return (
                    <tr key={l.id} className="text-slate-200">
                      <td className="py-3 font-mono text-slate-400">#{l.id.slice(0, 8)}</td>
                      <td>{formatMoney(l.principal, { decimals: 0 })}</td>
                      <td className="text-red-400 font-bold">{formatMoney(remBal, { decimals: 0 })}</td>
                      <td className="text-amber-300">{formatMoney(installment, { decimals: 0 })}</td>
                      <td>%{(Number(l.interest_rate_annual) * 100).toFixed(0)}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {l.status}
                        </span>
                      </td>
                      <td className="text-right py-2">
                        <div className="flex items-center justify-end gap-2">
                          {/* Pay single installment */}
                          <button
                            type="button"
                            disabled={isPaying || companyCash < installment}
                            onClick={() => handleRepayLoan(l.id, installment)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-sans font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={`Aylık taksit tutarı kadar (${formatMoney(installment, { decimals: 0 })}) borç öde`}
                          >
                            Taksit Öde
                          </button>

                          {/* Full or Partial Early Payoff */}
                          <button
                            type="button"
                            disabled={isPaying || companyCash <= 0}
                            onClick={() => {
                              const payAmount = Math.min(companyCash, remBal);
                              handleRepayLoan(l.id, payAmount);
                            }}
                            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-lg text-[11px] font-sans font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              companyCash >= remBal
                                ? `Krediyi tamamen kapat (${formatMoney(remBal, { decimals: 0 })})`
                                : `Mevcut nakitinizle (${formatMoney(companyCash, { decimals: 0 })}) kısmi erken ödeme yap`
                            }
                          >
                            {companyCash >= remBal ? 'Krediyi Kapat' : 'Kısmi Öde'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
