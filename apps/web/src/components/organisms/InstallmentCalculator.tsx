'use client';

import { useState, useMemo } from 'react';
import { formatPrice } from '@/lib/utils/format';

interface Plan {
  months: number;
  price_sqm: number;
  initial_pct: number;
}

interface Props {
  plans?: Plan[];
  area?: number;
  price: number;
}

export function InstallmentCalculator({ plans = [], area = 0, price }: Props) {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [customMonths, setCustomMonths] = useState(12);
  const [customInitialPct, setCustomInitialPct] = useState(20);

  const hasPlans = plans.length > 0;

  const result = useMemo(() => {
    if (hasPlans) {
      const plan = plans[selectedPlan];
      const totalPrice = plan.price_sqm * area || price;
      const down = Math.round(totalPrice * plan.initial_pct / 100);
      const monthly = Math.round((totalPrice - down) / plan.months);
      return { totalPrice, down, monthly, months: plan.months, initialPct: plan.initial_pct };
    } else {
      const down = Math.round(price * customInitialPct / 100);
      const monthly = Math.round((price - down) / customMonths);
      return { totalPrice: price, down, monthly, months: customMonths, initialPct: customInitialPct };
    }
  }, [hasPlans, plans, selectedPlan, area, price, customMonths, customInitialPct]);

  return (
    <div className="squircle-card p-4 flex flex-col gap-4"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
      <p className="section-label">Рассрочка</p>

      {hasPlans ? (
        <div className="flex flex-col gap-2">
          <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>Выберите план</span>
          <div className="flex flex-col gap-2">
            {plans.map((plan, i) => (
              <button
                key={i}
                onClick={() => setSelectedPlan(i)}
                className={`flex items-center justify-between p-3 rounded-[12px] press-scale ${
                  selectedPlan === i ? 'chip-active' : ''
                }`}
                style={{
                  background: selectedPlan === i ? 'rgba(99,102,241,0.12)' : 'var(--fill-tertiary)',
                }}
              >
                <span className="text-[13px] font-medium" style={{ color: 'var(--label-primary)' }}>
                  {plan.months} мес. · {plan.initial_pct}% первый взнос
                </span>
                <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
                  {formatPrice(plan.price_sqm)}/м²
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
              Первоначальный взнос: {customInitialPct}%
            </span>
            <input type="range" min={10} max={80} step={5} value={customInitialPct}
              onChange={e => setCustomInitialPct(Number(e.target.value))} className="w-full" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>Срок (мес.)</span>
            <input type="number" className="input-field" min={1} max={120}
              value={customMonths} onChange={e => setCustomMonths(Number(e.target.value))} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 pt-2"
        style={{ borderTop: '0.5px solid var(--separator)' }}>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Ежемес. платёж</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--label-primary)' }}>
            {formatPrice(result.monthly)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Первый взнос</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--ios-blue)' }}>
            {formatPrice(result.down)}
          </p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Срок</p>
          <p className="text-[15px] font-bold" style={{ color: 'var(--label-primary)' }}>
            {result.months} мес.
          </p>
        </div>
      </div>
    </div>
  );
}
