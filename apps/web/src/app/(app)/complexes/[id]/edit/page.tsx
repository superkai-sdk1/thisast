'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useComplex } from '@/lib/hooks/queries/useComplexes';
import { complexKeys } from '@/lib/hooks/queries/useComplexes';
import { complexesApi } from '@/lib/api/complexes';
import { Button } from '@/components/atoms/Button';
import type { ComplexClass } from '@crm/shared-types';

interface Props {
  params: Promise<{ id: string }>;
}

const CLASS_OPTIONS: { value: ComplexClass; label: string }[] = [
  { value: 'economy',  label: 'Эконом'  },
  { value: 'comfort',  label: 'Комфорт' },
  { value: 'business', label: 'Бизнес'  },
  { value: 'premium',  label: 'Премиум' },
];

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

const PAYMENT_CONDITIONS: { key: string; label: string }[] = [
  { key: 'cash',             label: 'Наличные'       },
  { key: 'mortgage',         label: 'Ипотека'        },
  { key: 'installment',      label: 'Рассрочка'      },
  { key: 'trade_in',         label: 'Trade-in'       },
  { key: 'matcapital',       label: 'Маткапитал'     },
  { key: 'military_mortgage',label: 'Воен. ипотека'  },
];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

export default function EditComplexPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: complex, isLoading } = useComplex(id);

  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [complexClass, setComplexClass] = useState<ComplexClass | ''>('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [yearDelivery, setYearDelivery] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!complex) return;
    setName(complex.name ?? '');
    setDeveloper(complex.developer ?? '');
    setComplexClass(complex.class ?? '');
    setDistrict(complex.district ?? '');
    setAddress(complex.address ?? '');
    setDescription(complex.description ?? '');
    setYearDelivery(complex.year_delivery ? String(complex.year_delivery) : '');
    setTotalFloors(complex.total_floors ? String(complex.total_floors) : '');

    // Derive active conditions from existing payment fields / flags
    const active: string[] = [];
    if (complex.payment_cash_sqm)  active.push('cash');
    if (complex.payment_mort_sqm)  active.push('mortgage');
    if (complex.payment_inst_sqm)  active.push('installment');
    if (complex.has_barter)        active.push('trade_in');
    // matcapital / military_mortgage stored in conditions_notes if present
    if ((complex.conditions_notes ?? []).includes('matcapital'))        active.push('matcapital');
    if ((complex.conditions_notes ?? []).includes('military_mortgage')) active.push('military_mortgage');
    setConditions(active);
  }, [complex]);

  function toggleCondition(key: string) {
    setConditions(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key],
    );
  }

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof complexesApi.update>[1]) =>
      complexesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: complexKeys.list() });
      qc.invalidateQueries({ queryKey: complexKeys.detail(id) });
      router.back();
    },
    onError: (e: unknown) => setSaveError((e as Error)?.message ?? 'Ошибка сохранения'),
  });

  function handleSubmit() {
    if (!name.trim()) return;
    setSaveError(null);

    // Build conditions_notes for matcapital / military_mortgage
    const conditionsNotes: string[] = [];
    if (conditions.includes('matcapital'))        conditionsNotes.push('matcapital');
    if (conditions.includes('military_mortgage')) conditionsNotes.push('military_mortgage');

    updateMutation.mutate({
      name: name.trim(),
      developer: developer || undefined,
      class: (complexClass || undefined) as ComplexClass | undefined,
      district: district || undefined,
      address: address || undefined,
      description: description || undefined,
      year_delivery: yearDelivery ? Number(yearDelivery) : undefined,
      total_floors: totalFloors ? Number(totalFloors) : undefined,
      // payment condition toggles
      payment_cash_sqm: conditions.includes('cash')
        ? (complex?.payment_cash_sqm ?? 1) || 1
        : null as unknown as undefined,
      payment_mort_sqm: conditions.includes('mortgage')
        ? (complex?.payment_mort_sqm ?? 1) || 1
        : null as unknown as undefined,
      payment_inst_sqm: conditions.includes('installment')
        ? (complex?.payment_inst_sqm ?? 1) || 1
        : null as unknown as undefined,
      has_barter: conditions.includes('trade_in'),
      conditions_notes: conditionsNotes,
    } as never);
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  if (!complex) return null;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* GlassNavBar */}
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            Редактировать ЖК
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-5">
        <Section label="Название ЖК *">
          <input
            className="input-field"
            placeholder="Например: ЖК Горизонт"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </Section>

        <Section label="Застройщик">
          <input
            className="input-field"
            placeholder="ООО «Строй Групп»"
            value={developer}
            onChange={e => setDeveloper(e.target.value)}
          />
        </Section>

        <Section label="Класс ЖК">
          <div className="flex gap-2 flex-wrap">
            {CLASS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setComplexClass(complexClass === value ? '' : value)}
                className={`chip press-scale ${complexClass === value ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Район">
          <div className="flex gap-2 flex-wrap">
            {DISTRICTS.map(d => (
              <button
                key={d}
                onClick={() => setDistrict(district === d ? '' : d)}
                className={`chip press-scale ${district === d ? 'chip-active' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Адрес">
          <input
            className="input-field"
            placeholder="Улица, номер дома"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </Section>

        <div className="flex gap-3">
          <Section label="Год сдачи">
            <input
              type="number"
              className="input-field"
              placeholder="2025"
              value={yearDelivery}
              onChange={e => setYearDelivery(e.target.value)}
            />
          </Section>
          <Section label="Этажей">
            <input
              type="number"
              className="input-field"
              placeholder="25"
              value={totalFloors}
              onChange={e => setTotalFloors(e.target.value)}
            />
          </Section>
        </div>

        <Section label="Описание">
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Описание ЖК, инфраструктура, особенности..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </Section>

        <Section label="Условия оплаты">
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_CONDITIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleCondition(key)}
                className={`chip press-scale ${conditions.includes(key) ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div
        className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)',
        }}
      >
        {saveError && (
          <p className="text-[13px] mb-2" style={{ color: 'var(--ios-red)' }}>{saveError}</p>
        )}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!name.trim()}
          loading={updateMutation.isPending}
        >
          Сохранить
        </Button>
      </div>
    </div>
  );
}
