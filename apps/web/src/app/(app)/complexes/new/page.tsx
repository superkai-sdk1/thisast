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

  const [ceilingHeight, setCeilingHeight] = useState('');
  const [entrancesCount, setEntrancesCount] = useState('');
  const [apartmentsCount, setApartmentsCount] = useState('');
  const [parkingSpots, setParkingSpots] = useState('');
  const [buildingType, setBuildingType] = useState('');
  const [finishType, setFinishType] = useState('');
  const [parkingTypes, setParkingTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState({
    hasClosedTerritory: false,
    hasPlayground: false,
    hasSportsGround: false,
    hasPanoramicWindows: false,
    hasGas: false,
  });
  const [paymentCashSqm, setPaymentCashSqm] = useState('');
  const [paymentMortSqm, setPaymentMortSqm] = useState('');
  const [paymentInstSqm, setPaymentInstSqm] = useState('');
  const [paymentInstMonths, setPaymentInstMonths] = useState('');

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
      ceiling_height: Number(ceilingHeight) || undefined,
      entrances_count: Number(entrancesCount) || undefined,
      apartments_count: Number(apartmentsCount) || undefined,
      parking_spots: Number(parkingSpots) || undefined,
      building_type: buildingType || undefined,
      finish_type: finishType || undefined,
      parking_types: parkingTypes.length ? parkingTypes : undefined,
      has_closed_territory: amenities.hasClosedTerritory,
      has_playground: amenities.hasPlayground,
      has_sports_ground: amenities.hasSportsGround,
      has_panoramic_windows: amenities.hasPanoramicWindows,
      has_gas: amenities.hasGas,
      payment_cash_sqm: Number(paymentCashSqm) || undefined,
      payment_mort_sqm: Number(paymentMortSqm) || undefined,
      payment_inst_sqm: Number(paymentInstSqm) || undefined,
      payment_inst_months: Number(paymentInstMonths) || undefined,
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

        <Section label="Характеристики здания">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Высота потолков, м</p>
              <input type="number" step="0.1" className="input-field" placeholder="2.7"
                value={ceilingHeight} onChange={e => setCeilingHeight(e.target.value)} />
            </div>
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Секций</p>
              <input type="number" className="input-field" placeholder="4"
                value={entrancesCount} onChange={e => setEntrancesCount(e.target.value)} />
            </div>
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Квартир</p>
              <input type="number" className="input-field" placeholder="120"
                value={apartmentsCount} onChange={e => setApartmentsCount(e.target.value)} />
            </div>
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Парковочных мест</p>
              <input type="number" className="input-field" placeholder="0"
                value={parkingSpots} onChange={e => setParkingSpots(e.target.value)} />
            </div>
          </div>
        </Section>

        <Section label="Тип конструкции">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'monolith_brick', l: 'Монолит-кирпич' },
              { v: 'monolith_block', l: 'Монолит-блок' },
              { v: 'panel', l: 'Панель' },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setBuildingType(buildingType === v ? '' : v)}
                className={`chip press-scale ${buildingType === v ? 'chip-active' : ''}`}>{l}</button>
            ))}
          </div>
        </Section>

        <Section label="Отделка">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'none', l: 'Без отделки' },
              { v: 'rough', l: 'Черновая' },
              { v: 'clean', l: 'Чистовая' },
              { v: 'turnkey', l: 'Под ключ' },
            ].map(({ v, l }) => (
              <button key={v} onClick={() => setFinishType(finishType === v ? '' : v)}
                className={`chip press-scale ${finishType === v ? 'chip-active' : ''}`}>{l}</button>
            ))}
          </div>
        </Section>

        <Section label="Парковка">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: 'open', l: 'Открытая' },
              { v: 'underground_1', l: 'Подземная 1 ур.' },
              { v: 'underground_2', l: 'Подземная 2 ур.' },
              { v: 'barrier', l: 'Шлагбаум' },
            ].map(({ v, l }) => (
              <button key={v}
                onClick={() => setParkingTypes(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v])}
                className={`chip press-scale ${parkingTypes.includes(v) ? 'chip-active' : ''}`}>{l}</button>
            ))}
          </div>
        </Section>

        <Section label="Инфраструктура">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'hasClosedTerritory', label: 'Закрытая территория' },
              { key: 'hasPlayground',      label: 'Детская площадка' },
              { key: 'hasSportsGround',    label: 'Спортплощадка' },
              { key: 'hasPanoramicWindows',label: 'Панорамные окна' },
              { key: 'hasGas',             label: 'Газ' },
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => setAmenities(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                className={`chip press-scale ${amenities[key as keyof typeof amenities] ? 'chip-active' : ''}`}
              >{label}</button>
            ))}
          </div>
        </Section>

        <Section label="Цены (за м²)">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Наличные, ₽/м²</p>
              <input type="number" className="input-field" placeholder="0"
                value={paymentCashSqm} onChange={e => setPaymentCashSqm(e.target.value)} />
            </div>
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Ипотека, ₽/м²</p>
              <input type="number" className="input-field" placeholder="0"
                value={paymentMortSqm} onChange={e => setPaymentMortSqm(e.target.value)} />
            </div>
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Рассрочка, ₽/м²</p>
              <input type="number" className="input-field" placeholder="0"
                value={paymentInstSqm} onChange={e => setPaymentInstSqm(e.target.value)} />
            </div>
            <div>
              <p className="text-[12px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Рассрочка, мес.</p>
              <input type="number" className="input-field" placeholder="24"
                value={paymentInstMonths} onChange={e => setPaymentInstMonths(e.target.value)} />
            </div>
          </div>
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
