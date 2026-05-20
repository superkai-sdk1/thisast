'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, SlidersHorizontal, Building, BedDouble, TrendingUp, Calendar } from 'lucide-react';
import { useComplexes } from '@/lib/hooks/queries/useComplexes';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { formatPrice } from '@/lib/utils/format';
import type { ComplexClass, ResidentialComplex } from '@crm/shared-types';
import type { ComplexFilter } from '@/lib/api/complexes';

const CLASS_LABELS: Record<ComplexClass, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'purple' }> = {
  economy: { label: 'Эконом',  variant: 'default'  },
  comfort: { label: 'Комфорт', variant: 'info'     },
  business:{ label: 'Бизнес',  variant: 'purple'   },
  premium: { label: 'Премиум', variant: 'warning'  },
};

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

export default function ComplexesPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<ComplexFilter>({});
  const { data: complexes = [], isLoading } = useComplexes(filter);
  const hasFilter = Object.values(filter).some(v => v !== undefined && v !== '');

  return (
    <>
      <GlassNavBar
        title="Жилые комплексы"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center press-scale relative"
              style={{ color: hasFilter ? 'var(--ios-blue)' : 'var(--label-tertiary)' }}
            >
              <SlidersHorizontal size={18} />
              {hasFilter && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ background: 'var(--ios-blue)' }} />
              )}
            </button>
          </div>
        }
      />

      <div className="gradient-mesh min-h-full">
        <div className="px-4 pt-3 pb-6">

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
            </div>
          ) : complexes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
                style={{ background: 'var(--fill-tertiary)' }}>
                <Building size={28} style={{ color: 'var(--label-tertiary)' }} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                  Нет жилых комплексов
                </p>
                <p className="text-[13px] mt-1" style={{ color: 'var(--label-tertiary)' }}>
                  Добавьте первый ЖК
                </p>
              </div>
              <Link href="/complexes/new">
                <Button size="sm" className="mt-2">Добавить ЖК</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {complexes.map(c => <ComplexCard key={c.id} complex={c} />)}
            </div>
          )}
        </div>
      </div>

      <Link href="/complexes/new" className="fab" aria-label="Добавить ЖК">
        <Plus size={24} strokeWidth={2.2} />
      </Link>

      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр ЖК" snapPoints={[0.65, 0.92]}>
        <ComplexFilterForm value={filter} onChange={setFilter} onClose={() => setFilterOpen(false)} />
      </BottomSheet>
    </>
  );
}

function ComplexCard({ complex: c }: { complex: ResidentialComplex }) {
  const cover = c.photos?.find(p => p.is_cover) ?? c.photos?.[0];
  const cls = c.class ? CLASS_LABELS[c.class] : null;

  return (
    <Link href={`/complexes/${c.id}`}>
      <article
        className="squircle-card overflow-hidden press-scale flex flex-col"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Cover photo */}
        <div className="relative h-44 bg-[var(--fill-tertiary)] flex-shrink-0">
          {cover ? (
            <Image src={cover.url} alt={c.name} fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Building size={36} style={{ color: 'var(--label-quaternary)' }} />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }} />
          {/* Class badge */}
          {cls && (
            <div className="absolute top-2 right-2">
              <Badge variant={cls.variant} size="sm">{cls.label}</Badge>
            </div>
          )}
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <p className="text-white text-[16px] font-bold leading-tight drop-shadow-sm">{c.name}</p>
            {c.developer && (
              <p className="text-white/80 text-[12px] mt-0.5">{c.developer}</p>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {c.district && (
              <span className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{c.district}</span>
            )}
            {c.year_delivery && (
              <div className="flex items-center gap-1">
                <Calendar size={11} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>{c.year_delivery}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {(c.property_count ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <BedDouble size={12} style={{ color: 'var(--ios-blue)' }} />
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ios-blue)' }}>
                  {c.property_count} кв.
                </span>
              </div>
            )}
            {c.min_price && (
              <div className="flex items-center gap-1">
                <TrendingUp size={11} style={{ color: 'var(--ios-green)' }} />
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ios-green)' }}>
                  от {formatPrice(c.min_price)}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

function ComplexFilterForm({
  value, onChange, onClose,
}: {
  value: ComplexFilter;
  onChange: (v: ComplexFilter) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(value);

  function set<K extends keyof ComplexFilter>(k: K, v: ComplexFilter[K]) {
    setLocal(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <span className="section-label">Поиск</span>
        <input
          className="input-field"
          placeholder="Название или застройщик..."
          value={local.q ?? ''}
          onChange={e => set('q', e.target.value || undefined)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">Класс</span>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(CLASS_LABELS) as [ComplexClass, typeof CLASS_LABELS[ComplexClass]][]).map(([val, { label }]) => (
            <button
              key={val}
              onClick={() => set('class', local.class === val ? undefined : val)}
              className={`chip press-scale ${local.class === val ? 'chip-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">Район</span>
        <div className="flex gap-2 flex-wrap">
          {DISTRICTS.map(d => (
            <button
              key={d}
              onClick={() => set('district', local.district === d ? undefined : d)}
              className={`chip press-scale ${local.district === d ? 'chip-active' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={() => { setLocal({}); onChange({}); onClose(); }}>
          Сбросить
        </Button>
        <Button className="flex-1" onClick={() => { onChange(local); onClose(); }}>
          Применить
        </Button>
      </div>
    </div>
  );
}
