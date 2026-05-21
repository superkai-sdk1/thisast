'use client';

import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/utils/format';

interface Props {
  price: number;
  rate?: number;
  initialPct?: number;
}

const TERMS = [5, 10, 15, 20, 25, 30];

export function MortgageCalculator({ price, rate = 12, initialPct = 20 }: Props) {
  const [downPct, setDownPct] = useState(initialPct);
  const [termYears, setTermYears] = useState(20);
  const [annualRate, setAnnualRate] = useState(rate);

  const { monthly, total, overpay, downAmount, loanAmount } = useMemo(() => {
    const downAmount = Math.round(price * downPct / 100);
    const loanAmount = price - downAmount;
    if (loanAmount <= 0 || annualRate <= 0) {
      return { monthly: 0, total: 0, overpay: 0, downAmount, loanAmount: Math.max(0, loanAmount) };
    }
    const r = annualRate / 100 / 12;
    const n = termYears * 12;
    const monthly = Math.round(loanAmount * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    const total = monthly * n;
    const overpay = total - loanAmount;
    return { monthly, total, overpay, downAmount, loanAmount };
  }, [price, downPct, termYears, annualRate]);

  return (
    <div className="squircle-card p-4 flex flex-col gap-4"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
      <p className="section-label">Ипотечный калькулятор</p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
            Первоначальный взнос: {downPct}% — {formatPrice(downAmount)}
          </span>
          <input type="range" min={5} max={80} step={5} value={downPct}
            onChange={e => setDownPct(Number(e.target.value))} className="w-full" />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>Ставка, %</span>
          <input type="number" className="input-field" step="0.1" min={1} max={30}
            value={annualRate} onChange={e => setAnnualRate(Number(e.target.value))} />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>Срок</span>
          <div className="flex gap-2 flex-wrap">
            {TERMS.map(t => (
              <button key={t} onClick={() => setTermYears(t)}
                className={`chip press-scale text-[12px] ${termYears === t ? 'chip-active' : ''}`}>
                {t} лет
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-2"
        style={{ borderTop: '0.5px solid var(--separator)' }}>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Ежемес. платёж</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--label-primary)' }}>
            {formatPrice(monthly)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Переплата</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--ios-orange)' }}>
            {formatPrice(overpay)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Сумма кредита</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--label-primary)' }}>
            {formatPrice(loanAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
