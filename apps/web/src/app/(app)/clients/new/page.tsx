'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from '@/lib/api/demands';
import { Button } from '@/components/atoms/Button';
import type { PropertyType, PaymentForm } from '@crm/shared-types';

const CLIENT_TYPES = [
  { value: 'buyer',    label: 'Покупатель'   },
  { value: 'seller',  label: 'Продавец'     },
  { value: 'renter',  label: 'Арендатор'    },
  { value: 'landlord',label: 'Арендодатель' },
] as const;

const TEMPERATURE_OPTIONS = [
  { value: 'hot',      label: 'Горячий'  },
  { value: 'warm',     label: 'Тёплый'   },
  { value: 'cold',     label: 'Холодный' },
  { value: 'thinking', label: 'Думает'   },
] as const;

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'apartment',    label: 'Квартира'  },
  { value: 'new_building', label: 'Новострой' },
  { value: 'house',        label: 'Дом'       },
  { value: 'land',         label: 'Участок'   },
  { value: 'commercial',   label: 'Коммерция' },
];

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'cash',             label: 'Наличные'    },
  { value: 'mortgage',         label: 'Ипотека'     },
  { value: 'installment',      label: 'Рассрочка'   },
  { value: 'matcapital',       label: 'Маткапитал'  },
  { value: 'military_mortgage',label: 'Воен. ипотека'},
];

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

function toggleArr<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

function ChipGroup<T extends string>({
  options, active, onToggle, single,
}: { options: { value: T; label: string }[]; active: T | T[]; onToggle: (v: T) => void; single?: boolean }) {
  const activeArr = Array.isArray(active) ? active : [active];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onToggle(value)}
          className={`chip press-scale ${activeArr.includes(value) ? 'chip-active' : ''}`}
        >{label}</button>
      ))}
    </div>
  );
}

export default function NewClientPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [clientType, setClientType] = useState<string>('buyer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [demandNotes, setDemandNotes] = useState('');
  const [nextContactAt, setNextContactAt] = useState('');

  // Buyer/renter fields
  const [propertyType, setPropertyType] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [rooms, setRooms] = useState<number[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [paymentForms, setPaymentForms] = useState<PaymentForm[]>([]);
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');

  // Seller field
  const [netPrice, setNetPrice] = useState('');

  // Landlord fields
  const [rentPrice, setRentPrice] = useState('');
  const [deposit, setDeposit] = useState('');

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => demandsApi.create(data as never),
    onSuccess: (demand: { id: string }) => {
      qc.invalidateQueries({ queryKey: ['demands'] });
      router.push(`/clients/${demand.id}`);
    },
  });

  function handleSubmit() {
    if (!name.trim() || !phone.trim()) return;

    const payload: Record<string, unknown> = {
      buyer_name: name,
      buyer_phone: phone,
      client_type: clientType,
      temperature: temperature || null,
      notes: notes || null,
      demand_notes: demandNotes || null,
      next_contact_at: nextContactAt || null,
    };

    if (clientType === 'buyer' || clientType === 'renter') {
      Object.assign(payload, {
        property_type: propertyType || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        rooms: rooms.length ? rooms : [],
        districts: districts.length ? districts : [],
        payment_forms: paymentForms.length ? paymentForms : [],
        area_min: areaMin ? Number(areaMin) : null,
        area_max: areaMax ? Number(areaMax) : null,
      });
    }

    if (clientType === 'seller') {
      payload.net_price = netPrice ? Number(netPrice) : null;
    }

    if (clientType === 'landlord') {
      payload.rent_price = rentPrice ? Number(rentPrice) : null;
      payload.deposit = deposit ? Number(deposit) : null;
    }

    create.mutate(payload);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="glass-nav px-4 flex items-center gap-3"
        style={{ height: 'calc(44px + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)' }}>
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center press-scale -ml-1"
          style={{ color: 'var(--ios-blue)' }}>
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-[17px] font-semibold text-center" style={{ color: 'var(--label-primary)' }}>
          Новый клиент
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 pb-8">
        {/* Client type */}
        <Section label="Тип клиента">
          <ChipGroup
            options={CLIENT_TYPES as never}
            active={clientType}
            onToggle={(v) => setClientType(v)}
            single
          />
        </Section>

        {/* Basic info */}
        <Section label="Имя клиента">
          <input className="input-field" placeholder="Иванов Иван" value={name} onChange={e => setName(e.target.value)} />
        </Section>

        <Section label="Телефон">
          <input className="input-field" type="tel" placeholder="+7 (900) 000-00-00" value={phone} onChange={e => setPhone(e.target.value)} />
        </Section>

        <Section label="Температура">
          <ChipGroup options={TEMPERATURE_OPTIONS as never} active={temperature} onToggle={v => setTemperature(prev => prev === v ? '' : v)} single />
        </Section>

        {/* Buyer / Renter fields */}
        {(clientType === 'buyer' || clientType === 'renter') && (
          <>
            <Section label="Тип недвижимости">
              <ChipGroup options={TYPE_OPTIONS} active={propertyType} onToggle={v => setPropertyType(prev => prev === v ? '' : v)} single />
            </Section>

            <Section label="Бюджет, ₽">
              <div className="flex gap-2">
                <input className="input-field flex-1" type="number" placeholder="От" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
                <input className="input-field flex-1" type="number" placeholder="До" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
              </div>
            </Section>

            <Section label="Комнаты">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(r => (
                  <button key={r} onClick={() => setRooms(prev => toggleArr(prev, r))}
                    className={`chip press-scale ${rooms.includes(r) ? 'chip-active' : ''}`}>
                    {r === 0 ? 'Студия' : `${r}+`}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Районы">
              <div className="flex gap-2 flex-wrap">
                {DISTRICTS.map(d => (
                  <button key={d} onClick={() => setDistricts(prev => toggleArr(prev, d))}
                    className={`chip press-scale ${districts.includes(d) ? 'chip-active' : ''}`}>{d}</button>
                ))}
              </div>
            </Section>

            {clientType === 'buyer' && (
              <Section label="Форма оплаты">
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_OPTIONS.map(({ value, label }) => (
                    <button key={value} onClick={() => setPaymentForms(prev => toggleArr(prev, value))}
                      className={`chip press-scale ${paymentForms.includes(value) ? 'chip-active' : ''}`}>{label}</button>
                  ))}
                </div>
              </Section>
            )}

            <Section label="Площадь, м²">
              <div className="flex gap-2">
                <input className="input-field flex-1" type="number" placeholder="От" value={areaMin} onChange={e => setAreaMin(e.target.value)} />
                <input className="input-field flex-1" type="number" placeholder="До" value={areaMax} onChange={e => setAreaMax(e.target.value)} />
              </div>
            </Section>
          </>
        )}

        {/* Seller fields */}
        {clientType === 'seller' && (
          <Section label="Цена на руки, ₽">
            <input className="input-field" type="number" placeholder="Желаемая сумма" value={netPrice} onChange={e => setNetPrice(e.target.value)} />
          </Section>
        )}

        {/* Landlord fields */}
        {clientType === 'landlord' && (
          <>
            <Section label="Ставка аренды, ₽/мес">
              <input className="input-field" type="number" placeholder="Ежемесячный платёж" value={rentPrice} onChange={e => setRentPrice(e.target.value)} />
            </Section>
            <Section label="Залог, ₽">
              <input className="input-field" type="number" placeholder="Депозит" value={deposit} onChange={e => setDeposit(e.target.value)} />
            </Section>
          </>
        )}

        {/* Contact */}
        <Section label="Следующий контакт">
          <input className="input-field" type="datetime-local" value={nextContactAt} onChange={e => setNextContactAt(e.target.value)} />
        </Section>

        <Section label="Примечание">
          <textarea className="input-field resize-none" rows={3} placeholder="Заметки..." value={notes} onChange={e => setNotes(e.target.value)} />
        </Section>

        <Section label="Примечание к запросу">
          <textarea className="input-field resize-none" rows={2} placeholder="Детали по спросу..." value={demandNotes} onChange={e => setDemandNotes(e.target.value)} />
        </Section>

        <Button onClick={handleSubmit} disabled={!name.trim() || !phone.trim() || create.isPending} className="w-full mt-2">
          {create.isPending ? 'Сохранение...' : 'Сохранить клиента'}
        </Button>
      </div>
    </div>
  );
}
