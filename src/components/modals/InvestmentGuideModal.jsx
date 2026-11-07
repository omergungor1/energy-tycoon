'use client';

import React, { useState } from 'react';
import {
  X,
  Lightbulb,
  TrendingUp,
  Landmark,
  MapPin,
  Zap,
  Star,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Coins,
  Sparkles
} from 'lucide-react';
import { INVESTMENT_TIPS_CATEGORIES, GOLDEN_RULES_SUMMARY } from '@/lib/simulation/investmentTips';

export default function InvestmentGuideModal({
  isOpen = false,
  onClose = () => {},
  lang = 'tr'
}) {
  const [activeTab, setActiveTab] = useState('cashflow');

  if (!isOpen) return null;

  const currentCategory = INVESTMENT_TIPS_CATEGORIES.find((c) => c.id === activeTab);

  const tabIcons = {
    cashflow: TrendingUp,
    loans: Landmark,
    land: MapPin,
    capacity: Zap
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 modal-backdrop-safe"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => {
        e.stopPropagation();
        if (e.ctrlKey) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] modal-content-safe"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.stopPropagation();
          if (e.ctrlKey) e.preventDefault();
        }}
      >
        {/* Top Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 flex items-start justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {lang === 'tr' ? 'Tycoon Yatırım & Büyüme Rehberi' : 'Tycoon Investment & Scaling Guide'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-[10px] uppercase">
                  PRO STRATEGY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {lang === 'tr'
                  ? 'Kasanızı 10 kat büyütmek, krediyi doğru kullanmak ve adanın lider enerji devi olmak için altın taktikler.'
                  : 'Master tactics to scale cash flow, wield financial leverage, and dominate the island grid.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {INVESTMENT_TIPS_CATEGORIES.map((cat) => {
            const Icon = tabIcons[cat.id] || Lightbulb;
            const isActive = activeTab === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{lang === 'tr' ? cat.titleTr : cat.titleEn}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeTab === 'rules' ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>{lang === 'tr' ? '5 Altın Kural' : '5 Golden Rules'}</span>
          </button>
        </div>

        {/* Scrollable Tips Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {activeTab === 'rules' ? (
            /* Golden Rules Summary View */
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-bold leading-relaxed">
                  {lang === 'tr'
                    ? 'Deneyimli enerji patronlarının uyguladığı en kritik 5 büyüme kuralı:'
                    : 'The top 5 essential scaling rules applied by master energy tycoons:'}
                </span>
              </div>

              <div className="space-y-2.5">
                {GOLDEN_RULES_SUMMARY.map((rule) => (
                  <div
                    key={`rule_${rule.id}`}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                      #{rule.id}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white leading-relaxed pt-0.5">
                      {lang === 'tr' ? rule.ruleTr : rule.ruleEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentCategory ? (
            /* Selected Category Tips View */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{lang === 'tr' ? currentCategory.titleTr : currentCategory.titleEn}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono font-bold">
                  {currentCategory.tips.length} {lang === 'tr' ? 'Taktik' : 'Tactics'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {currentCategory.tips.map((tip, idx) => (
                  <div
                    key={`tip_${idx}`}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          {lang === 'tr' ? tip.titleTr : tip.titleEn}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {lang === 'tr' ? tip.summaryTr : tip.summaryEn}
                      </p>
                    </div>

                    {/* Actionable Tycoon Callout Box */}
                    <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-[11px] leading-relaxed flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-cyan-300 font-bold block">
                          {lang === 'tr' ? '💡 Tycoon Taktiği:' : '💡 Tycoon Action:'}
                        </strong>
                        <span>{lang === 'tr' ? tip.actionTr : tip.actionEn}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'tr'
                ? 'Düzenli gelir akışı için tesislerinizi her gün takip edin.'
                : 'Monitor your generation assets daily to sustain steady revenues.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {lang === 'tr' ? 'Anladım, Kapat' : 'Got it, Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

