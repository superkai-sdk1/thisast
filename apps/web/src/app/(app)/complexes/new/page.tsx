'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useCreateComplex } from '@/lib/hooks/queries/useComplexes';
import { Button } from '@/components/atoms/Button';
import type { ComplexClass } from '@crm/shared-types';

const CLASS_OPTIONS: { value: ComplexClass; label: string }[] = [
  { value: 'economy',  label: 'Эконом'  },
  { value: 'comfort',  label: 'Комфорт' },
  { value: 'business', label: 'Бизнес'  },
  { value: 'premium',  label: 'Премиум' },
];

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

export default function NewComplexPage() {
  const router = useRouter();
  const createComplex = useCreateComplex();

  const [name, setName] = useState('');
  const [developer, setDeveloper] = useState('');
  const [complexClass, setComplexClass] = useState<ComplexClass | ''>('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [yearDelivery, setYearDelivery] = useState('');
  const [totalFloors, setTotalFloors] = useState('');

  async function handleSubmit() {
    if (!name.trim()) return;
    const complex = await createComplex.mutateAsync({
      name: name.trim(),
      developer: developer || undefined,
      class: (complexClass || undefined) as ComplexClass | undefined,
      district: district || undefined,
      address: address || undefined,
      description: description || undefined,
      year_delivery: yearDelivery ? Number(yearDelivery) : undefined,
      total_floors: totalFloors ? Number(totalFloors) : undefined,
    } as never);
    router.replace(`/complexes/${complex.id}`);
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
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            Новый ЖК
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
      </div>

      <div className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)' }}>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!name.trim()}
          loading={createComplex.isPending}
        >
          Создать ЖК
        </Button>
      </div>
    </div>
  );
}
