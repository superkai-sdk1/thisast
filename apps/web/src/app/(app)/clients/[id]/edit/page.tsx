'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from '@/lib/api/demands';
import { useDemand, demandKeys } from '@/lib/hooks/queries/useDemands';
import { Button } from '@/components/atoms/Button';
import type { PaymentForm } from '@crm/shared-types';

const CLIENT_TYPES = [
  { value: 'buyer',    label: 'Покупатель'   },
  { value: 'seller',   label: 'Продавец'     },
  { value: 'renter',   label: 'Арендатор'    },
  { value: 'landlord', label: 'Арендодатель' },
] as const;

const TEMPERATURE_OPTIONS = [
  { value: 'hot',      label: 'Горячий'  },
  { value: 'warm',     label: 'Тёплый'   },
  { value: 'cold',     label: 'Холодный' },
  { value: 'thinking', label: 'Думает'   },
] as const;

const TYPE_OPTIONS = [
  { value: 'apartment',    label: 'Квартира'   },
  { value: 'new_building', label: 'Новострой'  },
  { value: 'house',        label: 'Дом'        },
  { value: 'land',         label: 'Участок'    },
  { value: 'commercial',   label: 'Коммерция'  },
];

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'cash',              label: 'Наличные'      },
  { value: 'mortgage',          label: 'Ипотека'       },
  { value: 'installment',       label: 'Рассрочка'     },
  { value: 'matcapital',        label: 'Маткапитал'    },
  { value: 'military_mortgage', label: 'Воен. ипотека' },
];

const DISTRICTS = [
  'Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет',
  'Хасанья', 'Белая Речка', 'Кожзавод', 'Затишье',
];

const KANBAN_STAGES = [
  { value: 'new',         label: 'Новый'        },
  { value: 'qualifying',  label: 'Квалификация' },
  { value: 'selection',   label: 'Подбор'       },
  { value: 'viewings',    label: 'Показы'       },
  { value: 'thinking',    label: 'Думает'       },
  { value: 'negotiation', label: 'Переговоры'   },
  { value: 'deal',        label: 'Сделка'       },
];

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
}: {
  options: { value: T; label: string }[];
  active: T | T[];
  onToggle: (v: T) => void;
  single?: boolean;
}) {
  const activeArr = Array.isArray(active) ? active : [active];
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onToggle(value)}
          className={`chip press-scale ${activeArr.includes(value) ? 'chip-active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditClientPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: demand, isLoading } = useDemand(id);

  const [clientType, setClientType] = useState('buyer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [temperature, setTemperature] = useState('');
  const [kanbanStatus, setKanbanStatus] = useState('new');
  const [notes, setNotes] = useState('');
  const [demandNotes, setDemandNotes] = useState('');
  const [nextContactAt, setNextContactAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Buyer/renter
  const [propertyType, setPropertyType] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [rooms, setRooms] = useState<number[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [paymentForms, setPaymentForms] = useState<PaymentForm[]>([]);
  const [areaMin, setAreaMin] = useState('');
  const [areaMax, setAreaMax] = useState('');

  // Seller
  const [netPrice, setNetPrice] = useState('');

  // Landlord
  const [rentPrice, setRentPrice] = useState('');
  const [deposit, setDeposit] = useState('');

  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!demand) return;
    const d = demand as unknown as Record<string, unknown>;
    setClientType((d.client_type as string) ?? 'buyer');
    setName((d.buyer_name as string) ?? '');
    setPhone((d.buyer_phone as string) ?? '');
    setTemperature((d.temperature as string) ?? '');
    setKanbanStatus((d.kanban_status as string) ?? 'new');
    setNotes((d.notes as string) ?? '');
    setDemandNotes((d.demand_notes as string) ?? '');
    setIsActive((d.is_active as boolean) !== false);
    setPropertyType((d.property_type as string) ?? '');
    setBudgetMin(d.budget_min ? String(d.budget_min) : '');
    setBudgetMax(d.budget_max ? String(d.budget_max) : '');
    setRooms(Array.isArray(d.rooms) ? (d.rooms as number[]) : []);
    setDistricts(Array.isArray(d.districts) ? (d.districts as string[]) : []);
    setPaymentForms(Array.isArray(d.payment_forms) ? (d.payment_forms as PaymentForm[]) : []);
    setAreaMin(d.area_min ? String(d.area_min) : '');
    setAreaMax(d.area_max ? String(d.area_max) : '');
    setNetPrice(d.net_price ? String(d.net_price) : '');
    setRentPrice(d.rent_price ? String(d.rent_price) : '');
    setDeposit(d.deposit ? String(d.deposit) : '');
    if (d.next_contact_at) {
      const dt = new Date(d.next_contact_at as string);
      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
      setNextContactAt(local);
    }
  }, [demand]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => demandsApi.update(id, data as never),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: demandKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ['demands'] });
      router.back();
    },
    onError: (e: unknown) => setSaveError((e as Error)?.message ?? 'Ошибка сохранения'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => demandsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: demandKeys.detail(id) }),
  });

  function handleSubmit() {
    setSaveError(null);
    const currentStatus = (demand as Record<string, unknown>)?.kanban_status as string;
    if (kanbanStatus !== currentStatus) {
      updateStatusMutation.mutate(kanbanStatus);
    }

    const payload: Record<string, unknown> = {
      buyer_name: name || undefined,
      buyer_phone: phone || undefined,
      client_type: clientType,
      temperature: temperature || null,
      notes: notes || null,
      demand_notes: demandNotes || null,
      next_contact_at: nextContactAt || null,
      is_active: isActive,
    };

    const isBuyer = clientType === 'buyer' || clientType === 'renter';
    if (isBuyer) {
      Object.assign(payload, {
        property_type: propertyType || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        rooms: rooms,
        districts: districts,
        payment_forms: paymentForms,
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

    updateMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  const isBuyer = clientType === 'buyer' || clientType === 'renter';

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            Редактировать клиента
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-5">

        {/* Active toggle */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[14px] font-medium" style={{ color: 'var(--label-primary)' }}>Активный клиент</span>
          <button
            onClick={() => setIsActive(v => !v)}
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{ background: isActive ? 'var(--ios-green)' : 'var(--fill-tertiary)' }}
          >
            <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
              style={{ left: isActive ? 'calc(100% - 26px)' : 2 }} />
          </button>
        </div>

        {/* Client type */}
        <Section label="Тип клиента">
          <ChipGroup
            options={CLIENT_TYPES as never}
            active={clientType}
            onToggle={(v) => setClientType(v)}
            single
          />
        </Section>

        {/* Stage */}
        <Section label="Этап сделки">
          <ChipGroup
            options={KANBAN_STAGES as never}
            active={kanbanStatus}
            onToggle={(v) => setKanbanStatus(prev => prev === v ? prev : v)}
            single
          />
        </Section>

        {/* Basic info */}
        <Section label="Имя клиента">
          <input className="input-field" placeholder="Иванов Иван"
            value={name} onChange={e => setName(e.target.value)} />
        </Section>

        <Section label="Телефон">
          <input className="input-field" type="tel" placeholder="+7 (900) 000-00-00"
            value={phone} onChange={e => setPhone(e.target.value)} />
        </Section>

        <Section label="Температура">
          <ChipGroup
            options={TEMPERATURE_OPTIONS as never}
            active={temperature}
            onToggle={v => setTemperature(prev => prev === v ? '' : v)}
            single
          />
        </Section>

        {/* Buyer / Renter fields */}
        {isBuyer && (
          <>
            <Section label="Тип недвижимости">
              <ChipGroup
                options={TYPE_OPTIONS as never}
                active={propertyType}
                onToggle={v => setPropertyType(prev => prev === v ? '' : v)}
                single
              />
            </Section>

            <Section label="Бюджет, ₽">
              <div className="flex gap-2">
                <input className="input-field flex-1" type="number" placeholder="От"
                  value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
                <input className="input-field flex-1" type="number" placeholder="До"
                  value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
              </div>
            </Section>

            <Section label="Комнаты">
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5].map(r => (
                  <button key={r} onClick={() => setRooms(prev => toggleArr(prev, r))}
                    className={`chip press-scale ${rooms.includes(r) ? 'chip-active' : ''}`}>
                    {r === 0 ? 'Студия' : r === 5 ? '5+' : `${r}`}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Районы">
              <div className="flex gap-2 flex-wrap">
                {DISTRICTS.map(d => (
                  <button key={d} onClick={() => setDistricts(prev => toggleArr(prev, d))}
                    className={`chip press-scale ${districts.includes(d) ? 'chip-active' : ''}`}>
                    {d}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Форма оплаты">
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_OPTIONS.map(({ value, label }) => (
                  <button key={value} onClick={() => setPaymentForms(prev => toggleArr(prev, value))}
                    className={`chip press-scale ${paymentForms.includes(value) ? 'chip-active' : ''}`}>
                    {label}
                  </button>
                ))}
              </div>
            </Section>

            <Section label="Площадь, м²">
              <div className="flex gap-2">
                <input className="input-field flex-1" type="number" placeholder="От"
                  value={areaMin} onChange={e => setAreaMin(e.target.value)} />
                <input className="input-field flex-1" type="number" placeholder="До"
                  value={areaMax} onChange={e => setAreaMax(e.target.value)} />
              </div>
            </Section>
          </>
        )}

        {/* Seller */}
        {clientType === 'seller' && (
          <Section label="Цена на руки, ₽">
            <input className="input-field" type="number" placeholder="Желаемая сумма"
              value={netPrice} onChange={e => setNetPrice(e.target.value)} />
          </Section>
        )}

        {/* Landlord */}
        {clientType === 'landlord' && (
          <>
            <Section label="Ставка аренды, ₽/мес">
              <input className="input-field" type="number" placeholder="Ежемесячный платёж"
                value={rentPrice} onChange={e => setRentPrice(e.target.value)} />
            </Section>
            <Section label="Залог, ₽">
              <input className="input-field" type="number" placeholder="Депозит"
                value={deposit} onChange={e => setDeposit(e.target.value)} />
            </Section>
          </>
        )}

        {/* Contact date */}
        <Section label="Следующий контакт">
          <input className="input-field" type="datetime-local"
            value={nextContactAt} onChange={e => setNextContactAt(e.target.value)} />
        </Section>

        <Section label="Примечание">
          <textarea className="input-field resize-none" rows={3} placeholder="Заметки..."
            value={notes} onChange={e => setNotes(e.target.value)} />
        </Section>

        <Section label="Детали запроса">
          <textarea className="input-field resize-none" rows={2} placeholder="Детали по спросу..."
            value={demandNotes} onChange={e => setDemandNotes(e.target.value)} />
        </Section>

      </div>

      <div className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)' }}>
        {saveError && (
          <p className="text-[13px] mb-2" style={{ color: 'var(--ios-red)' }}>{saveError}</p>
        )}
        <Button className="w-full" onClick={handleSubmit}
          loading={updateMutation.isPending || updateStatusMutation.isPending}>
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}
