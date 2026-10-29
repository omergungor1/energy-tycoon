'use client';

import React, { useState } from 'react';
import { Landmark, TrendingUp, DollarSign, ShieldAlert, Check, AlertCircle } from 'lucide-react';
import { dictionaries } from '@/lib/i18n/dictionaries';

export default function FinancePanel({
  company,
  finance,
  activeLoans = [],
  lang,
  onActionSuccess
}) {
  const dict = dictionaries[lang] || dictionaries.tr;
  const [loanPrincipal, setLoanPrincipal] = useState(50000);
  const [termYears, setTermYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const maxBorrow = Number(finance?.maxBorrowingPower || 0);

  const handleRequestLoan = async (e) => {
    e.preventDefault();
    if (loanPrincipal <= 0 || loanPrincipal > maxBorrow) {
      setFeedback({ type: 'error', text: dict.finance.loanExceedsLimit });
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

  return (
    <div className="p-6 max-w-5xl mx-auto text-slate-100">
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
            <strong className="text-emerald-400 font-mono text-sm">${finance?.cashVal?.toLocaleString()}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.assetsVal}</span>
            <strong className="text-white font-mono text-sm">${finance?.assetsBookValue?.toLocaleString()}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.landVal}</span>
            <strong className="text-white font-mono text-sm">${finance?.ownedLandValue?.toLocaleString()}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.gridVal}</span>
            <strong className="text-cyan-400 font-mono text-sm">${finance?.infrastructureValue?.toLocaleString()}</strong>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">{dict.finance.totalDebt}</span>
            <strong className="text-red-400 font-mono text-sm">-${finance?.totalDebt?.toLocaleString()}</strong>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] text-emerald-300 block uppercase font-bold">Toplam Net Değer</span>
            <strong className="text-emerald-300 font-mono text-base">${finance?.netWorth?.toLocaleString()}</strong>
          </div>
        </div>

        {/* Borrowing Power Notification */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300">
          <span>{dict.finance.borrowingLimit}:</span>
          <strong className="text-emerald-400 font-mono text-sm">${maxBorrow.toLocaleString()}</strong>
        </div>
      </div>

      {/* Commercial Loan Request Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Ticari Yatırım Kredisi Talebi
        </h3>

        <form onSubmit={handleRequestLoan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                {dict.finance.loanAmount} (Maks: ${maxBorrow.toLocaleString()})
              </label>
              <input
                type="number"
                min="5000"
                max={maxBorrow}
                step="5000"
                value={loanPrincipal}
                onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

          <button
            type="submit"
            disabled={loading || maxBorrow <= 0 || loanPrincipal > maxBorrow}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20 text-xs transition-all disabled:opacity-50"
          >
            {loading ? 'Kredi Değerlendiriliyor...' : dict.finance.requestLoanBtn}
          </button>
        </form>
      </div>

      {/* Active Loans Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {activeLoans.map((l) => (
                  <tr key={l.id} className="text-slate-200">
                    <td className="py-3 font-mono text-slate-400">#{l.id.slice(0, 8)}</td>
                    <td>${Number(l.principal).toLocaleString()}</td>
                    <td className="text-red-400 font-bold">${Number(l.remaining_balance).toLocaleString()}</td>
                    <td className="text-amber-300">${Number(l.monthly_installment).toLocaleString()}</td>
                    <td>%{(Number(l.interest_rate_annual) * 100).toFixed(0)}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

