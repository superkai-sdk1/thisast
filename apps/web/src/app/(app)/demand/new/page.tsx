'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from '@/lib/api/demands';
import { demandKeys } from '@/lib/hooks/queries/useDemands';
import { useDraftForm } from '@/lib/hooks/useDraftForm';
import { Button } from '@/components/atoms/Button';
import { KANBAN_STAGES } from '@crm/shared-types';
import type { PropertyType, PaymentForm, RepairType } from '@crm/shared-types';

const DRAFT_ID = 'new-demand';

interface DemandFormValues {
  buyer_name: string;
  buyer_phone: string;
  property_type: PropertyType | '';
  budget_min: string;
  budget_max: string;
  rooms: number[];
  districts: string[];
  repair_types: RepairType[];
  payment_forms: PaymentForm[];
  area_min: string;
  area_max: string;
  floor_min: string;
  floor_max: string;
  notes: string;
}

const INITIAL: DemandFormValues = {
  buyer_name: '', buyer_phone: '', property_type: '',
  budget_min: '', budget_max: '', rooms: [], districts: [],
  repair_types: [], payment_forms: [], area_min: '', area_max: '',
  floor_min: '', floor_max: '', notes: '',
};

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Квартира' }, { value: 'resale', label: 'Вторичка' },
  { value: 'new_building', label: 'Новострой' }, { value: 'house', label: 'Дом' },
  { value: 'land', label: 'Участок' }, { value: 'commercial', label: 'Коммерция' },
];

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'cash', label: 'Наличные' }, { value: 'mortgage', label: 'Ипотека' },
  { value: 'installment', label: 'Рассрочка' }, { value: 'matcapital', label: 'Маткапитал' },
  { value: 'military_mortgage', label: 'Воен. ипотека' },
];

const REPAIR_OPTIONS: { value: RepairType; label: string }[] = [
  { value: 'no_repair', label: 'Без ремонта' }, { value: 'cosmetic', label: 'Косметич.' },
  { value: 'euro', label: 'Евро' }, { value: 'designer', label: 'Дизайнерский' },
  { value: 'new_building_finish', label: 'Чистовая' },
];

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

function toggleArr<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

export default function NewDemandPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { values, setValues, restored, clearDraft } = useDraftForm<DemandFormValues>(
    'demand', DRAFT_ID, INITIAL,
  );

  const createMutation = useMutation({
    mutationFn: demandsApi.create,
    onSuccess: () => {
      clearDraft();
      qc.invalidateQueries({ queryKey: demandKeys.all() });
      router.back();
    },
  });

  function set<K extends keyof DemandFormValues>(key: K, val: DemandFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit() {
    if (!values.buyer_name || !values.budget_max) return;
    await createMutation.mutateAsync({
      buyer_name: values.buyer_name,
      buyer_phone: values.buyer_phone,
      property_type: (values.property_type || 'apartment') as PropertyType,
      budget_min: values.budget_min ? Number(values.budget_min) : null,
      budget_max: Number(values.budget_max),
      rooms: values.rooms,
      districts: values.districts,
      repair_types: values.repair_types,
      payment_forms: values.payment_forms,
      area_min: values.area_min ? Number(values.area_min) : null,
      area_max: values.area_max ? Number(values.area_max) : null,
      floor_min: values.floor_min ? Number(values.floor_min) : null,
      floor_max: values.floor_max ? Number(values.floor_max) : null,
      notes: values.notes || null,
      kanban_status: 'new',
      internal_tags: [],
    } as Parameters<typeof demandsApi.create>[0]);
  }

  const cls = {
    input: 'w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none',
    label: 'text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide',
    section: 'flex flex-col gap-1.5',
  };

  function ChipGroup<T extends string | number>({
    options, active, onToggle, labelFn,
  }: { options: { value: T; label: string }[]; active: T[]; onToggle: (v: T) => void; labelFn?: (v: T) => string }) {
    return (
      <div className="flex gap-2 flex-wrap">
        {options.map(({ value, label }) => (
          <button
            key={String(value)}
            onClick={() => onToggle(value)}
            className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
              active.includes(value) ? 'bg-[var(--ios-blue)] text-white' : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
            }`}
          >
            {labelFn ? labelFn(value) : label}
          </button>
        ))}
      </div>
    );
  }

  if (!restored) return null;

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <div className="glass-nav sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()} className="text-[var(--ios-blue)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[var(--label-primary)]">Новый клиент</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5 pb-24">
        {/* Contacts */}
        <div className={cls.section}>
          <label className={cls.label}>Клиент *</label>
          <input
            className={cls.input}
            placeholder="Имя клиента"
            value={values.buyer_name}
            onChange={e => set('buyer_name', e.target.value)}
          />
          <input
            className={cls.input}
            placeholder="+7 (999) 000-00-00"
            type="tel"
            value={values.buyer_phone}
            onChange={e => set('buyer_phone', e.target.value)}
          />
        </div>

        {/* Property type */}
        <div className={cls.section}>
          <label className={cls.label}>Тип недвижимости</label>
          <ChipGroup
            options={TYPE_OPTIONS}
            active={values.property_type ? [values.property_type] : []}
            onToggle={(t) => set('property_type', values.property_type === t ? '' : t as PropertyType)}
          />
        </div>

        {/* Budget */}
        <div className={cls.section}>
          <label className={cls.label}>Бюджет, ₽ *</label>
          <div className="flex gap-2">
            <input
              type="number"
              className={cls.input}
              placeholder="от"
              value={values.budget_min}
              onChange={e => set('budget_min', e.target.value)}
            />
            <input
              type="number"
              className={cls.input}
              placeholder="до"
              value={values.budget_max}
              onChange={e => set('budget_max', e.target.value)}
            />
          </div>
        </div>

        {/* Rooms */}
        {(values.property_type === 'apartment' || values.property_type === 'resale' ||
          values.property_type === 'new_building' || values.property_type === '') && (
          <div className={cls.section}>
            <label className={cls.label}>Комнат</label>
            <ChipGroup
              options={[1, 2, 3, 4, 5].map(r => ({ value: r, label: r === 5 ? '5+' : String(r) }))}
              active={values.rooms}
              onToggle={(r) => set('rooms', toggleArr(values.rooms, r as number))}
            />
          </div>
        )}

        {/* Districts */}
        <div className={cls.section}>
          <label className={cls.label}>Районы</label>
          <ChipGroup
            options={DISTRICTS.map(d => ({ value: d, label: d }))}
            active={values.districts}
            onToggle={(d) => set('districts', toggleArr(values.districts, d as string))}
          />
        </div>

        {/* Area */}
        <div className={cls.section}>
          <label className={cls.label}>Площадь, м²</label>
          <div className="flex gap-2">
            <input type="number" className={cls.input} placeholder="от" value={values.area_min} onChange={e => set('area_min', e.target.value)} />
            <input type="number" className={cls.input} placeholder="до" value={values.area_max} onChange={e => set('area_max', e.target.value)} />
          </div>
        </div>

        {/* Payment forms */}
        <div className={cls.section}>
          <label className={cls.label}>Форма оплаты</label>
          <ChipGroup
            options={PAYMENT_OPTIONS}
            active={values.payment_forms}
            onToggle={(p) => set('payment_forms', toggleArr(values.payment_forms, p as PaymentForm))}
          />
        </div>

        {/* Repair types */}
        <div className={cls.section}>
          <label className={cls.label}>Тип ремонта</label>
          <ChipGroup
            options={REPAIR_OPTIONS}
            active={values.repair_types}
            onToggle={(r) => set('repair_types', toggleArr(values.repair_types, r as RepairType))}
          />
        </div>

        {/* Notes */}
        <div className={cls.section}>
          <label className={cls.label}>Заметки</label>
          <textarea
            className={`${cls.input} resize-none`}
            rows={3}
            placeholder="Пожелания клиента..."
            value={values.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 pt-4 bg-gradient-to-t from-[var(--bg-primary)] to-transparent">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!values.buyer_name || !values.budget_max}
          loading={createMutation.isPending}
        >
          Добавить клиента
        </Button>
      </div>
    </div>
  );
}
