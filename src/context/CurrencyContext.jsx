'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CurrencyContext = createContext(null);

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_RATE = 49.92; // Fallback rate if network fails

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);
  const [exchangeRate, setExchangeRateState] = useState(DEFAULT_RATE);
  const [isManualRate, setIsManualRate] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch live exchange rate from open, free, unauthenticated API
  const fetchLiveRate = useCallback(async () => {
    setLoadingRate(true);
    try {
      // Primary: open.er-api.com (free, reliable, CORS-enabled)
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (res.ok) {
        const data = await res.json();
        const tryRate = data?.rates?.TRY;
        if (tryRate && typeof tryRate === 'number') {
          setExchangeRateState(tryRate);
          setIsManualRate(false);
          setLastUpdated(new Date().toLocaleTimeString());
          try {
            localStorage.setItem('energy_tycoon_exchange_rate', String(tryRate));
            localStorage.setItem('energy_tycoon_is_manual_rate', 'false');
          } catch {}
          setLoadingRate(false);
          return tryRate;
        }
      }

      // Fallback: api.exchangerate-api.com v4
      const fallbackRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        const fbRate = fbData?.rates?.TRY;
        if (fbRate && typeof fbRate === 'number') {
          setExchangeRateState(fbRate);
          setIsManualRate(false);
          setLastUpdated(new Date().toLocaleTimeString());
          try {
            localStorage.setItem('energy_tycoon_exchange_rate', String(fbRate));
            localStorage.setItem('energy_tycoon_is_manual_rate', 'false');
          } catch {}
          setLoadingRate(false);
          return fbRate;
        }
      }
    } catch (err) {
      console.warn('Live exchange rate fetch failed, using stored/default rate:', err);
    } finally {
      setLoadingRate(false);
    }
  }, []);

  // Load persisted preferences on mount
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('energy_tycoon_currency');
      if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'TRY')) {
        setCurrencyState(savedCurrency);
      }

      const savedRate = localStorage.getItem('energy_tycoon_exchange_rate');
      const savedManual = localStorage.getItem('energy_tycoon_is_manual_rate') === 'true';
      if (savedRate && !isNaN(Number(savedRate))) {
        setExchangeRateState(Number(savedRate));
        setIsManualRate(savedManual);
      } else {
        // Fetch fresh rate if not saved
        fetchLiveRate();
      }
    } catch (e) {
      console.error('Failed to load currency preferences:', e);
    }
  }, [fetchLiveRate]);

  // Set currency and persist
  const setCurrency = (c) => {
    if (c !== 'USD' && c !== 'TRY') return;
    setCurrencyState(c);
    try {
      localStorage.setItem('energy_tycoon_currency', c);
    } catch {}
    // If user switches to TRY and no rate was fetched yet, refresh rate
    if (c === 'TRY' && !isManualRate) {
      fetchLiveRate();
    }
  };

  // Set manual rate and persist
  const setManualRate = (rate) => {
    const num = Number(rate);
    if (isNaN(num) || num <= 0) return;
    setExchangeRateState(num);
    setIsManualRate(true);
    setLastUpdated(new Date().toLocaleTimeString());
    try {
      localStorage.setItem('energy_tycoon_exchange_rate', String(num));
      localStorage.setItem('energy_tycoon_is_manual_rate', 'true');
    } catch {}
  };

  // Reset to live rate from API
  const resetToLiveRate = async () => {
    await fetchLiveRate();
  };

  // Format compact currency amount for mobile / narrow spaces (e.g., $101k, $2M, $1B - no decimals)
  const formatCompactMoney = useCallback(
    (amountInUsd, options = {}) => {
      const num = Number(amountInUsd || 0);
      const showSymbol = options.showSymbol !== undefined ? options.showSymbol : true;
      const targetVal = currency === 'TRY' ? num * exchangeRate : num;
      const sym = currency === 'TRY' ? '₺' : '$';

      const abs = Math.abs(targetVal);
      const sign = targetVal < 0 ? '-' : '';

      let formattedNumber = '';
      if (abs >= 1e9) {
        formattedNumber = `${Math.floor(abs / 1e9)}B`;
      } else if (abs >= 1e6) {
        formattedNumber = `${Math.floor(abs / 1e6)}M`;
      } else if (abs >= 1e3) {
        formattedNumber = `${Math.floor(abs / 1e3)}k`;
      } else {
        formattedNumber = `${Math.floor(abs)}`;
      }

      return showSymbol ? `${sign}${sym}${formattedNumber}` : `${sign}${formattedNumber}`;
    },
    [currency, exchangeRate]
  );

  // Format currency amount (converts USD base amount to current currency)
  const formatMoney = useCallback(
    (amountInUsd, options = {}) => {
      if (options.compact) {
        return formatCompactMoney(amountInUsd, options);
      }

      const num = Number(amountInUsd || 0);
      const decimals = options.decimals !== undefined ? options.decimals : 2;
      const showSymbol = options.showSymbol !== undefined ? options.showSymbol : true;

      if (currency === 'TRY') {
        const tryAmount = num * exchangeRate;
        const formatted = tryAmount.toLocaleString('tr-TR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
        return showSymbol ? `₺${formatted}` : formatted;
      }

      // Default: USD
      const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      return showSymbol ? `$${formatted}` : formatted;
    },
    [currency, exchangeRate, formatCompactMoney]
  );

  // Format per-kWh electricity rates (4 decimal precision)
  const formatPricePerKwh = useCallback(
    (rateInUsd) => {
      const num = Number(rateInUsd || 0);
      if (currency === 'TRY') {
        const tryPrice = (num * exchangeRate).toFixed(4);
        return `₺${tryPrice}/kWh`;
      }
      return `$${num.toFixed(4)}/kWh`;
    },
    [currency, exchangeRate]
  );

  const symbol = currency === 'TRY' ? '₺' : '$';

  const value = {
    currency,
    setCurrency,
    exchangeRate,
    setManualRate,
    resetToLiveRate,
    fetchLiveRate,
    isManualRate,
    loadingRate,
    lastUpdated,
    formatMoney,
    formatCompactMoney,
    formatPricePerKwh,
    symbol
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      currency: 'USD',
      setCurrency: () => {},
      exchangeRate: DEFAULT_RATE,
      setManualRate: () => {},
      resetToLiveRate: () => {},
      fetchLiveRate: () => {},
      isManualRate: false,
      loadingRate: false,
      lastUpdated: null,
      formatMoney: (val, opts = {}) => {
        if (opts.compact) {
          const num = Number(val || 0);
          const abs = Math.abs(num);
          const sign = num < 0 ? '-' : '';
          let str = '';
          if (abs >= 1e9) str = `${Math.floor(abs / 1e9)}B`;
          else if (abs >= 1e6) str = `${Math.floor(abs / 1e6)}M`;
          else if (abs >= 1e3) str = `${Math.floor(abs / 1e3)}k`;
          else str = `${Math.floor(abs)}`;
          return `${sign}$${str}`;
        }
        return `$${Number(val || 0).toLocaleString('en-US', {
          minimumFractionDigits: opts.decimals ?? 2,
          maximumFractionDigits: opts.decimals ?? 2
        })}`;
      },
      formatCompactMoney: (val, opts = {}) => {
        const num = Number(val || 0);
        const abs = Math.abs(num);
        const sign = num < 0 ? '-' : '';
        let str = '';
        if (abs >= 1e9) str = `${Math.floor(abs / 1e9)}B`;
        else if (abs >= 1e6) str = `${Math.floor(abs / 1e6)}M`;
        else if (abs >= 1e3) str = `${Math.floor(abs / 1e3)}k`;
        else str = `${Math.floor(abs)}`;
        return `${sign}$${str}`;
      },
      formatPricePerKwh: (val) => `$${Number(val || 0).toFixed(4)}/kWh`,
      symbol: '$'
    };
  }
  return context;
}

