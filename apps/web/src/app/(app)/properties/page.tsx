'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, Plus, Search, BedDouble, Maximize2, MapPin } from 'lucide-react';
import { usePropertiesInfinite } from '@/lib/hooks/queries/useProperties';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { formatPrice } from '@/lib/utils/format';
import type { PropertyFilter } from '@/lib/api/properties';
import type { Property, PropertyType } from '@crm/shared-types';

const TYPES: { label: string; value: PropertyType | '' }[] = [
  { label: 'Все',       value: ''             },
  { label: 'Квартиры',  value: 'apartment'    },
  { label: 'Вторичка',  value: 'resale'       },
  { label: 'Новострой', value: 'new_building' },
  { label: 'Дома',      value: 'house'        },
  { label: 'Участки',   value: 'land'         },
  { label: 'Коммерция', value: 'commercial'   },
  { label: 'Аренда',    value: 'rent'         },
];

const VISIBILITY_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
  private: { label: 'Скрытый',   variant: 'default' },
  shared:  { label: 'Агентский', variant: 'info' },
  public:  { label: 'Публичный', variant: 'success' },
};

export default function PropertiesPage() {
  const [activeType, setActiveType] = useState<PropertyType | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<Omit<PropertyFilter, 'page' | 'type'>>({});

  const activeFilter: Omit<PropertyFilter, 'page'> = {
    ...(activeType && { type: activeType }),
    ...filter,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePropertiesInfinite(activeFilter);
  const properties = data?.pages.flatMap(p => p.items) ?? [];
  const hasActiveFilters = Object.values(filter).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true));

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (node && hasNextPage) {
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !isFetchingNextPage) fetchNextPage();
      });
      observer.current.observe(node);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <GlassNavBar
        title="Объекты"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center press-scale relative"
              style={{ color: hasActiveFilters ? 'var(--ios-blue)' : 'var(--label-tertiary)' }}
            >
              <SlidersHorizontal size={18} />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--ios-blue)' }} />
              )}
            </button>
          </div>
        }
      />

      {/* Category scroll */}
      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-10 glass-nav border-b-0 px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveType(t.value)}
              className={`chip press-scale flex-shrink-0 ${activeType === t.value ? 'chip-active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gradient-mesh min-h-full">
        <div className="px-4 pt-3 pb-6 flex flex-col gap-3">

          {properties.length === 0 && !isFetchingNextPage && (
            <EmptyState />
          )}

          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}

          <div ref={sentinelRef} />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link href="/properties/new" className="fab" aria-label="Добавить объект">
        <Plus size={24} strokeWidth={2.2} />
      </Link>

      {/* Filter sheet */}
      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр" snapPoints={[0.75, 0.92]}>
        <PropertyFilterForm value={filter} onChange={setFilter} onClose={() => setFilterOpen(false)} />
      </BottomSheet>
    </>
  );
}

function PropertyCard({ property: p }: { property: Property }) {
  const cover = p.photos?.find(ph => ph.is_cover) ?? p.photos?.[0];
  const vis = VISIBILITY_LABELS[p.visibility_status] ?? VISIBILITY_LABELS.private;

  return (
    <Link href={`/properties/${p.id}`}>
      <article className="squircle-card overflow-hidden press-scale"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>

        {/* Photo */}
        <div className="relative h-48 bg-[var(--fill-tertiary)]">
          {cover ? (
            <Image src={cover.url} alt={p.street ?? ''} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--fill-secondary)' }}>
                <MapPin size={20} style={{ color: 'var(--label-tertiary)' }} />
              </div>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 photo-overlay" />

          {/* Price badge */}
          <div className="absolute bottom-3 left-3">
            <PermissionGate permission="clientSafeInverse">
              <span className="text-white font-bold text-[17px] tracking-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {formatPrice(p.price)}
              </span>
            </PermissionGate>
          </div>

          {/* Visibility badge */}
          <div className="absolute top-3 right-3">
            <Badge variant={vis.variant} size="sm">{vis.label}</Badge>
          </div>

          {/* Tags */}
          {p.tags && p.tags.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-1">
              {p.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-2">
          <PermissionGate permission="clientSafeInverse">
            <p className="text-[15px] font-semibold leading-snug truncate" style={{ color: 'var(--label-primary)' }}>
              {p.street ? `${p.street}${p.house_number ? `, ${p.house_number}` : ''}` : p.district ?? 'Адрес не указан'}
            </p>
          </PermissionGate>
          <p className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
            {p.district ?? ''}
            {p.district && p.city ? ', ' : ''}
            {p.city ?? ''}
          </p>

          {/* Specs row */}
          <div className="flex items-center gap-3 pt-0.5">
            {p.rooms && (
              <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                <BedDouble size={13} />
                {p.rooms} комн.
              </span>
            )}
            {p.area_sqm && (
              <span className="flex items-center gap-1 text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                <Maximize2 size={12} />
                {p.area_sqm} м²
              </span>
            )}
            {p.floor && p.total_floors && (
              <span className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                {p.floor}/{p.total_floors} эт.
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{ background: 'var(--fill-tertiary)' }}>
        <Search size={28} style={{ color: 'var(--label-tertiary)' }} />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>Объекты не найдены</p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--label-tertiary)' }}>Измените фильтры или добавьте новый объект</p>
      </div>
      <Link href="/properties/new">
        <Button size="sm" className="mt-2">Добавить объект</Button>
      </Link>
    </div>
  );
}

function PropertyFilterForm({ value, onChange, onClose }: {
  value: Omit<PropertyFilter, 'page' | 'type'>;
  onChange: (v: Omit<PropertyFilter, 'page' | 'type'>) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(value);
  function set<K extends keyof typeof local>(k: K, v: (typeof local)[K]) {
    setLocal(p => ({ ...p, [k]: v }));
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <FilterSection label="Поиск">
        <input type="text" placeholder="Улица, район..." className="input-field"
          value={local.q ?? ''}
          onChange={e => set('q', e.target.value || undefined)} />
      </FilterSection>

      <FilterSection label="Цена, ₽">
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="От" className="input-field"
            value={(local as Record<string, unknown>).price_min ?? ''}
            onChange={e => set('price_min' as keyof typeof local, e.target.value ? Number(e.target.value) : undefined as never)} />
          <input type="number" placeholder="До" className="input-field"
            value={(local as Record<string, unknown>).price_max ?? ''}
            onChange={e => set('price_max' as keyof typeof local, e.target.value ? Number(e.target.value) : undefined as never)} />
        </div>
      </FilterSection>

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

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}
