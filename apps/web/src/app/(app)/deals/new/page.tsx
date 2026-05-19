'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { useCreateDeal } from '@/lib/hooks/queries/useDeals';
import { Button } from '@/components/atoms/Button';
import { formatPrice } from '@/lib/utils/format';
import type { PaymentForm } from '@crm/shared-types';

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'cash',              label: 'Наличные'       },
  { value: 'mortgage',          label: 'Ипотека'        },
  { value: 'installment',       label: 'Рассрочка'      },
  { value: 'trade_in',          label: 'Trade-in'       },
  { value: 'matcapital',        label: 'Маткапитал'     },
  { value: 'military_mortgage', label: 'Воен. ипотека'  },
];

interface SplitRow {
  id: string;
  partner_name: string;
  split_amount: string;
  split_percent: string;
}

export default function NewDealPage() {
  const router = useRouter();
  const createDeal = useCreateDeal();

  const [isExternal, setIsExternal] = useState(false);
  const [externalAddress, setExternalAddress] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [myCommission, setMyCommission] = useState('');
  const [paymentForm, setPaymentForm] = useState<PaymentForm | ''>('');
  const [notes, setNotes] = useState('');
  const [splits, setSplits] = useState<SplitRow[]>([]);

  const totalSplits = splits.reduce((sum, s) => sum + (Number(s.split_amount) || 0), 0);
  const netAfterSplits = myCommission ? Number(myCommission) - totalSplits : null;

  function addSplit() {
    setSplits(prev => [...prev, { id: crypto.randomUUID(), partner_name: '', split_amount: '', split_percent: '' }]);
  }

  function updateSplit(id: string, field: keyof Omit<SplitRow, 'id'>, val: string) {
    setSplits(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  }

  function removeSplit(id: string) {
    setSplits(prev => prev.filter(s => s.id !== id));
  }

  async function handleSubmit() {
    if (!dealPrice) return;

    await createDeal.mutateAsync({
      is_external_property: isExternal,
      external_address: isExternal ? externalAddress : undefined,
      deal_price: Number(dealPrice),
      my_commission: myCommission ? Number(myCommission) : undefined,
      payment_form: paymentForm || undefined,
      notes: notes || undefined,
      status: 'in_progress',
    } as Parameters<typeof createDeal.mutateAsync>[0]);

    router.back();
  }

  const cls = {
    input: 'w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none',
    label: 'text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide',
    section: 'flex flex-col gap-1.5',
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="glass-nav sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()} className="text-[var(--ios-blue)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[var(--label-primary)]">Новая сделка</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5 pb-20">
        {/* Property type toggle */}
        <div className={cls.section}>
          <label className={cls.label}>Тип объекта</label>
          <div className="flex gap-2">
            {[{ val: false, label: 'Из базы' }, { val: true, label: 'Внешний' }].map(({ val, label }) => (
              <button
                key={String(val)}
                onClick={() => setIsExternal(val)}
                className={`flex-1 py-2 rounded-[14px] text-sm font-medium transition-colors ${
                  isExternal === val
                    ? 'bg-[var(--ios-blue)] text-white'
                    : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* External address */}
        {isExternal && (
          <div className={cls.section}>
            <label className={cls.label}>Адрес объекта</label>
            <input
              className={cls.input}
              placeholder="Улица, дом, квартира..."
              value={externalAddress}
              onChange={e => setExternalAddress(e.target.value)}
            />
          </div>
        )}

        {/* Deal price */}
        <div className={cls.section}>
          <label className={cls.label}>Сумма сделки, ₽ *</label>
          <input
            type="number"
            className={cls.input}
            placeholder="0"
            value={dealPrice}
            onChange={e => setDealPrice(e.target.value)}
          />
        </div>

        {/* Commission */}
        <div className={cls.section}>
          <label className={cls.label}>Моя комиссия, ₽</label>
          <input
            type="number"
            className={cls.input}
            placeholder="0"
            value={myCommission}
            onChange={e => setMyCommission(e.target.value)}
          />
        </div>

        {/* Payment form */}
        <div className={cls.section}>
          <label className={cls.label}>Форма оплаты</label>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPaymentForm(paymentForm === value ? '' : value)}
                className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                  paymentForm === value
                    ? 'bg-[var(--ios-blue)] text-white'
                    : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Commission splits */}
        <div className={cls.section}>
          <div className="flex items-center justify-between">
            <label className={cls.label}>Раздел комиссии</label>
            <button
              onClick={addSplit}
              className="text-xs text-[var(--ios-blue)] flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" /> Добавить
            </button>
          </div>

          {splits.length > 0 && (
            <div className="flex flex-col gap-3 mt-1">
              {splits.map((split) => (
                <div key={split.id} className="glass-card squircle-card p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 px-3 py-2 rounded-[12px] bg-[var(--fill-tertiary)] text-sm outline-none"
                      placeholder="Имя партнёра"
                      value={split.partner_name}
                      onChange={e => updateSplit(split.id, 'partner_name', e.target.value)}
                    />
                    <button onClick={() => removeSplit(split.id)} className="text-[var(--ios-red)]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 rounded-[12px] bg-[var(--fill-tertiary)] text-sm outline-none"
                      placeholder="Сумма ₽"
                      value={split.split_amount}
                      onChange={e => updateSplit(split.id, 'split_amount', e.target.value)}
                    />
                    <input
                      type="number"
                      className="flex-1 px-3 py-2 rounded-[12px] bg-[var(--fill-tertiary)] text-sm outline-none"
                      placeholder="% (опц.)"
                      value={split.split_percent}
                      onChange={e => updateSplit(split.id, 'split_percent', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {/* Net summary */}
              {myCommission && (
                <div className="glass-card squircle-card p-3 flex justify-between items-center">
                  <span className="text-sm text-[var(--label-secondary)]">Итого мне:</span>
                  <span className={`text-sm font-bold ${netAfterSplits && netAfterSplits < 0 ? 'text-[var(--ios-red)]' : 'text-[var(--ios-green)]'}`}>
                    {netAfterSplits !== null ? formatPrice(netAfterSplits) : '—'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className={cls.section}>
          <label className={cls.label}>Заметки</label>
          <textarea
            className={`${cls.input} resize-none`}
            rows={3}
            placeholder="Комментарий к сделке..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 pt-4 bg-gradient-to-t from-[var(--bg-primary)] to-transparent">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!dealPrice}
          loading={createDeal.isPending}
        >
          Создать сделку
        </Button>
      </div>
    </div>
  );
}
