'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, TrendingUp } from 'lucide-react';
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

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
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
    const validSplits = splits
      .filter(s => s.partner_name.trim() && Number(s.split_amount) > 0)
      .map(s => ({
        partner_name: s.partner_name.trim(),
        split_amount: Number(s.split_amount),
        split_percent: s.split_percent ? Number(s.split_percent) : null,
      }));
    await createDeal.mutateAsync({
      is_external_property: isExternal,
      external_address: isExternal ? externalAddress : undefined,
      deal_price: Number(dealPrice),
      my_commission: myCommission ? Number(myCommission) : undefined,
      payment_form: paymentForm || undefined,
      notes: notes || undefined,
      status: 'in_progress',
      commission_splits: validSplits.length > 0 ? validSplits : undefined,
    } as Parameters<typeof createDeal.mutateAsync>[0]);
    router.back();
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>Новая сделка</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-5">

        <FormSection label="Тип объекта">
          <div className="flex gap-2">
            {[{ val: false, label: 'Из базы' }, { val: true, label: 'Внешний' }].map(({ val, label }) => (
              <button
                key={String(val)}
                onClick={() => setIsExternal(val)}
                className={`chip flex-1 press-scale ${isExternal === val ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        {isExternal && (
          <FormSection label="Адрес объекта">
            <input
              className="input-field"
              placeholder="Улица, дом, квартира..."
              value={externalAddress}
              onChange={e => setExternalAddress(e.target.value)}
            />
          </FormSection>
        )}

        <FormSection label="Сумма сделки, ₽ *">
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={dealPrice}
            onChange={e => setDealPrice(e.target.value)}
          />
        </FormSection>

        <FormSection label="Моя комиссия, ₽">
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={myCommission}
            onChange={e => setMyCommission(e.target.value)}
          />
        </FormSection>

        <FormSection label="Форма оплаты">
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPaymentForm(paymentForm === value ? '' : value)}
                className={`chip press-scale ${paymentForm === value ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Commission splits */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="section-label" style={{ marginBottom: 0 }}>Раздел комиссии</span>
            <button
              onClick={addSplit}
              className="flex items-center gap-1 text-[13px] font-semibold press-scale"
              style={{ color: 'var(--ios-blue)' }}
            >
              <Plus size={14} /> Добавить
            </button>
          </div>

          {splits.length > 0 && (
            <div className="flex flex-col gap-3 mt-1">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="squircle-card p-3 flex flex-col gap-2"
                  style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="input-field"
                      placeholder="Имя партнёра"
                      value={split.partner_name}
                      onChange={e => updateSplit(split.id, 'partner_name', e.target.value)}
                    />
                    <button
                      onClick={() => removeSplit(split.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 press-scale"
                      style={{ background: 'rgba(255,59,48,0.10)', color: 'var(--ios-red)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Сумма ₽"
                      value={split.split_amount}
                      onChange={e => updateSplit(split.id, 'split_amount', e.target.value)}
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="% (опц.)"
                      value={split.split_percent}
                      onChange={e => updateSplit(split.id, 'split_percent', e.target.value)}
                    />
                  </div>
                </div>
              ))}

              {myCommission && netAfterSplits !== null && (
                <div
                  className="squircle-card p-3 flex items-center justify-between gap-3"
                  style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} style={{ color: netAfterSplits < 0 ? 'var(--ios-red)' : 'var(--ios-green)' }} />
                    <span className="text-[14px]" style={{ color: 'var(--label-secondary)' }}>Итого мне:</span>
                  </div>
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: netAfterSplits < 0 ? 'var(--ios-red)' : 'var(--ios-green)' }}
                  >
                    {formatPrice(netAfterSplits)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <FormSection label="Заметки">
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Комментарий к сделке..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </FormSection>

      </div>

      <div className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)' }}>
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
