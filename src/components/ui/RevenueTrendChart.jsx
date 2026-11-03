'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Zap,
  BarChart2,
  RefreshCw,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

const RANGE_CONFIG = [
  { key: '1w', labelTr: '1 Hafta', labelEn: '1 Week', days: 7 },
  { key: '1m', labelTr: '1 Ay', labelEn: '1 Month', days: 30 },
  { key: '3m', labelTr: '3 Ay', labelEn: '3 Months', days: 90 },
  { key: '6m', labelTr: '6 Ay', labelEn: '6 Months', days: 180 },
  { key: '12m', labelTr: '12 Ay', labelEn: '12 Months', days: 365 }
];

function formatCurrency(val, compact = false) {
  const num = Number(val || 0);
  if (compact) {
    if (Math.abs(num) >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (Math.abs(num) >= 1_000) return `$${(num / 1_000).toFixed(1)}k`;
    return `$${Math.round(num)}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
}

function formatKwh(val) {
  const kwh = Number(val || 0);
  if (kwh >= 1_000_000) return `${(kwh / 1_000_000).toFixed(2)} GWh`;
  if (kwh >= 1_000) return `${(kwh / 1_000).toFixed(1)} MWh`;
  return `${Math.round(kwh).toLocaleString()} kWh`;
}

export default function RevenueTrendChart({ companyId, lang = 'tr', onOpenTreasury = null }) {
  const [activeRange, setActiveRange] = useState('1m');
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const svgRef = useRef(null);

  const fetchRevenueHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
      const res = await fetch(`/api/game/revenue-history${query}`);
      if (!res.ok) throw new Error('Gelir verisi yüklenemedi');
      const json = await res.json();
      if (json.success) {
        setApiData(json);
      } else {
        throw new Error(json.error || 'Bilinmeyen hata');
      }
    } catch (err) {
      console.error('RevenueTrendChart fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchRevenueHistory();
  }, [fetchRevenueHistory]);

  // Selected range data
  const currentRangeData = useMemo(() => {
    if (!apiData?.ranges) return null;
    return apiData.ranges[activeRange] || apiData.ranges['all'] || null;
  }, [apiData, activeRange]);

  const series = useMemo(() => {
    return currentRangeData?.series || [];
  }, [currentRangeData]);

  // SVG Coordinates calculation
  const chartLayout = useMemo(() => {
    const width = 360;
    const height = 120;
    const padding = { top: 14, right: 12, bottom: 22, left: 12 };

    if (!series || series.length === 0) {
      return { width, height, points: [], pathD: '', areaD: '', maxVal: 0, minVal: 0 };
    }

    const values = series.map((s) => Number(s.totalRevenue || 0));
    const rawMax = Math.max(...values, 10);
    const minVal = 0; // Anchor to 0 for realistic baseline
    const maxVal = rawMax * 1.08; // 8% headroom

    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const points = series.map((item, idx) => {
      const x =
        series.length === 1
          ? padding.left + innerW / 2
          : padding.left + (idx / (series.length - 1)) * innerW;
      const normY = (Number(item.totalRevenue || 0) - minVal) / (maxVal - minVal);
      const y = padding.top + innerH - normY * innerH;
      return { x, y, data: item, index: idx };
    });

    // Create line path
    let pathD = '';
    points.forEach((pt, i) => {
      if (i === 0) pathD += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      else pathD += ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    });

    // Create area path
    const baselineY = padding.top + innerH;
    let areaD = pathD;
    if (points.length > 0) {
      const firstX = points[0].x.toFixed(1);
      const lastX = points[points.length - 1].x.toFixed(1);
      areaD += ` L ${lastX} ${baselineY.toFixed(1)} L ${firstX} ${baselineY.toFixed(1)} Z`;
    }

    return { width, height, padding, innerW, innerH, points, pathD, areaD, maxVal, minVal };
  }, [series]);

  // Mouse move handler for interactive scrubber
  const handlePointerMove = (e) => {
    if (!svgRef.current || chartLayout.points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    if (clientX === undefined) return;

    const relX = ((clientX - rect.left) / rect.width) * chartLayout.width;

    // Find nearest point
    let closestIdx = 0;
    let minDist = Infinity;
    chartLayout.points.forEach((pt, i) => {
      const dist = Math.abs(pt.x - relX);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? chartLayout.points[hoverIndex] : null;

  // Comparison to previous day for hover tooltip
  const hoverDayDiff = useMemo(() => {
    if (hoverIndex === null || hoverIndex <= 0 || !series[hoverIndex]) return null;
    const curr = Number(series[hoverIndex].totalRevenue || 0);
    const prev = Number(series[hoverIndex - 1].totalRevenue || 0);
    if (prev <= 0) return null;
    const diffPct = ((curr - prev) / prev) * 100;
    return {
      diffVal: curr - prev,
      diffPct: Number(diffPct.toFixed(1)),
      isPositive: diffPct >= 0
    };
  }, [hoverIndex, series]);

  return (
    <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-2.5 transition-all shadow-lg hover:border-slate-700/80">
      {/* 1. Header with Period Filters */}
      <div className="flex items-center justify-between gap-1 border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BarChart2 className="w-3 h-3" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>{lang === 'tr' ? 'Günlük Toplam Gelir' : 'Daily Total Revenue'}</span>
              {currentRangeData?.growthRatePct !== undefined && currentRangeData.growthRatePct !== 0 && (
                <span
                  className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold inline-flex items-center gap-0.5 ${
                    currentRangeData.growthRatePct > 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                  title={lang === 'tr' ? 'Dönem İçi Büyüme Trendi' : 'Period Growth Trend'}
                >
                  {currentRangeData.growthRatePct > 0 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {currentRangeData.growthRatePct > 0 ? '+' : ''}
                  {currentRangeData.growthRatePct}%
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg">
          {RANGE_CONFIG.map((cfg) => {
            const isActive = activeRange === cfg.key;
            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => {
                  setActiveRange(cfg.key);
                  setHoverIndex(null);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cfg.key.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top KPI Cards Row */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {/* Toplam Ciro */}
        <div className="bg-slate-900/80 border border-slate-800/70 p-1.5 rounded-lg">
          <span className="text-[9px] text-slate-400 block font-medium truncate">
            {lang === 'tr' ? 'Dönem Gelir' : 'Period Rev'}
          </span>
          <span className="text-xs font-black text-emerald-400 font-mono tracking-tight">
            {formatCurrency(currentRangeData?.totalRevenue, true)}
          </span>
        </div>

        {/* Günlük Ortalama */}
        <div className="bg-slate-900/80 border border-slate-800/70 p-1.5 rounded-lg">
          <span className="text-[9px] text-slate-400 block font-medium truncate">
            {lang === 'tr' ? 'Günlük Ort.' : 'Daily Avg'}
          </span>
          <span className="text-xs font-bold text-slate-200 font-mono tracking-tight">
            {formatCurrency(currentRangeData?.avgDailyRevenue, true)}
          </span>
        </div>

        {/* Zirve Gün */}
        <div className="bg-slate-900/80 border border-slate-800/70 p-1.5 rounded-lg">
          <span className="text-[9px] text-slate-400 block font-medium truncate">
            {lang === 'tr' ? 'Zirve Gün' : 'Peak Day'}
          </span>
          <span className="text-xs font-bold text-amber-300 font-mono tracking-tight">
            {formatCurrency(currentRangeData?.peakRevenue, true)}
          </span>
        </div>

        {/* Kayıtlı Gün */}
        <div className="bg-slate-900/80 border border-slate-800/70 p-1.5 rounded-lg">
          <span className="text-[9px] text-slate-400 block font-medium truncate">
            {lang === 'tr' ? 'Süre' : 'Span'}
          </span>
          <span className="text-xs font-bold text-cyan-300 font-mono tracking-tight">
            {series.length} {lang === 'tr' ? 'gün' : 'days'}
          </span>
        </div>
      </div>

      {/* 3. Interactive SVG Area Chart */}
      <div className="relative select-none">
        {loading && !apiData ? (
          <div className="h-28 flex flex-col items-center justify-center gap-1.5 text-slate-400 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span className="text-[11px]">{lang === 'tr' ? 'Gelir geçmişi yükleniyor...' : 'Loading revenue data...'}</span>
          </div>
        ) : error ? (
          <div className="h-28 flex flex-col items-center justify-center gap-1 text-rose-400 text-xs text-center p-2">
            <span>{error}</span>
            <button
              onClick={fetchRevenueHistory}
              type="button"
              className="mt-1 px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px]"
            >
              {lang === 'tr' ? 'Tekrar Dene' : 'Retry'}
            </button>
          </div>
        ) : series.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-slate-500 text-xs italic">
            {lang === 'tr' ? 'Bu zaman aralığında henüz üretim kaydı yok.' : 'No energy production records in this range.'}
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${chartLayout.width} ${chartLayout.height}`}
              className="w-full h-28 overflow-visible cursor-crosshair touch-none"
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#059669" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#10b981" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* Grid Lines */}
              <line
                x1={chartLayout.padding.left}
                y1={chartLayout.padding.top}
                x2={chartLayout.width - chartLayout.padding.right}
                y2={chartLayout.padding.top}
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="2 3"
                opacity="0.4"
              />
              <line
                x1={chartLayout.padding.left}
                y1={chartLayout.padding.top + chartLayout.innerH / 2}
                x2={chartLayout.width - chartLayout.padding.right}
                y2={chartLayout.padding.top + chartLayout.innerH / 2}
                stroke="#334155"
                strokeWidth="0.8"
                strokeDasharray="2 3"
                opacity="0.4"
              />
              <line
                x1={chartLayout.padding.left}
                y1={chartLayout.padding.top + chartLayout.innerH}
                x2={chartLayout.width - chartLayout.padding.right}
                y2={chartLayout.padding.top + chartLayout.innerH}
                stroke="#334155"
                strokeWidth="1.0"
                opacity="0.6"
              />

              {/* Y-Axis Value Labels */}
              <text
                x={chartLayout.width - chartLayout.padding.right}
                y={chartLayout.padding.top + 3}
                textAnchor="end"
                className="text-[8px] fill-slate-400 font-mono font-semibold"
              >
                {formatCurrency(chartLayout.maxVal, true)}
              </text>
              <text
                x={chartLayout.width - chartLayout.padding.right}
                y={chartLayout.padding.top + chartLayout.innerH - 2}
                textAnchor="end"
                className="text-[8px] fill-slate-500 font-mono"
              >
                $0
              </text>

              {/* Area & Stroke */}
              <path d={chartLayout.areaD} fill="url(#revGrad)" />
              <path
                d={chartLayout.pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowLine)"
              />

              {/* Individual Dots (if series <= 30 points) */}
              {series.length <= 30 &&
                chartLayout.points.map((pt, i) => (
                  <circle
                    key={`dot_${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoverIndex === i ? 4 : 2}
                    className={`transition-all ${
                      hoverIndex === i
                        ? 'fill-white stroke-emerald-400 stroke-2'
                        : 'fill-emerald-400/80 stroke-slate-900 stroke-1'
                    }`}
                  />
                ))}

              {/* Interactive Scrubber Cursor Line */}
              {activePoint && (
                <g>
                  <line
                    x1={activePoint.x}
                    y1={chartLayout.padding.top}
                    x2={activePoint.x}
                    y2={chartLayout.padding.top + chartLayout.innerH}
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.85"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    className="fill-cyan-400 stroke-white stroke-2 shadow-lg"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="9"
                    className="fill-cyan-400/20 animate-ping"
                  />
                </g>
              )}
            </svg>

            {/* X-Axis Dates Labels */}
            <div className="flex justify-between items-center px-1 text-[9px] text-slate-400 font-mono mt-0.5">
              <span>{series[0]?.shortDate || 'Başlangıç'}</span>
              {series.length > 2 && (
                <span className="text-slate-500">
                  {series[Math.floor(series.length / 2)]?.shortDate}
                </span>
              )}
              <span>{series[series.length - 1]?.shortDate || 'Bugün'}</span>
            </div>

            {/* Floating Scrubber Tooltip */}
            {activePoint && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-2 shadow-2xl text-[10px] space-y-0.5 transition-all -translate-x-1/2 -top-1"
                style={{
                  left: `${(activePoint.x / chartLayout.width) * 100}%`,
                  minWidth: '130px'
                }}
              >
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1 mb-1">
                  <span className="font-semibold text-white">{activePoint.data.formattedDate}</span>
                  <span className="text-[9px] text-cyan-400 font-mono">#{activePoint.data.gameDay}. Gün</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">{lang === 'tr' ? 'Günlük Gelir:' : 'Revenue:'}</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(activePoint.data.totalRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">{lang === 'tr' ? 'Satılan Enerji:' : 'Sold:'}</span>
                  <span className="text-slate-300">{formatKwh(activePoint.data.totalKwh)}</span>
                </div>
                {hoverDayDiff && (
                  <div className="flex items-center justify-between font-mono pt-0.5 border-t border-slate-800/60 text-[9px]">
                    <span className="text-slate-400">{lang === 'tr' ? 'Önceki Güne Göre:' : 'vs Prev Day:'}</span>
                    <span
                      className={`font-semibold ${
                        hoverDayDiff.isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {hoverDayDiff.isPositive ? '+' : ''}
                      {hoverDayDiff.diffPct}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. Footer Note & Test Action */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="truncate">
            {lang === 'tr'
              ? `${series.length} günlük simülasyon geçmişi`
              : `${series.length} days of sim records`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRevenueHistory}
            title={lang === 'tr' ? 'Verileri Yenile' : 'Refresh Data'}
            className="text-slate-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenTreasury && (
            <button
              type="button"
              onClick={onOpenTreasury}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>{lang === 'tr' ? 'Hazine Detayı' : 'Treasury'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
