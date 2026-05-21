'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, Plus, LayoutList, LayoutGrid, Grid3X3, BedDouble, Maximize2, MapPin, Search } from 'lucide-react';
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

type ViewMode = 'list' | 'grid2' | 'grid3';

const VIEW_ICONS: { mode: ViewMode; Icon: React.ElementType; title: string }[] = [
  { mode: 'list',  Icon: LayoutList, title: '1 столбец'  },
  { mode: 'grid2', Icon: LayoutGrid, title: '2 столбца'  },
  { mode: 'grid3', Icon: Grid3X3,    title: '3 столбца'  },
];

export default function PropertiesPage() {
  const [activeType, setActiveType] = useState<PropertyType | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<Omit<PropertyFilter, 'page' | 'type'>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('grid2');

  useEffect(() => {
    const saved = localStorage.getItem('props-view-mode') as ViewMode | null;
    if (saved) setViewMode(saved);
  }, []);

  function changeView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem('props-view-mode', mode);
  }

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
            {/* View mode toggle */}
            <div className="flex items-center gap-0.5 rounded-[10px] p-0.5 mr-1"
              style={{ background: 'var(--fill-tertiary)' }}>
              {VIEW_ICONS.map(({ mode, Icon, title }) => (
                <button
                  key={mode}
                  title={title}
                  onClick={() => changeView(mode)}
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center press-scale transition-colors"
                  style={{
                    background: viewMode === mode ? 'var(--bg-elevated)' : 'transparent',
                    color: viewMode === mode ? 'var(--ios-blue)' : 'var(--label-tertiary)',
                    boxShadow: viewMode === mode ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
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
        <div className={`px-4 pt-3 pb-6 ${
          viewMode === 'list'  ? 'flex flex-col gap-3' :
          viewMode === 'grid2' ? 'grid grid-cols-2 gap-3' :
                                 'grid grid-cols-3 gap-2'
        }`}>

          {properties.length === 0 && !isFetchingNextPage && (
            <div className={viewMode !== 'list' ? 'col-span-full' : ''}>
              <EmptyState />
            </div>
          )}

          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} compact={viewMode !== 'list'} />
          ))}

          <div ref={sentinelRef} className={viewMode !== 'list' ? 'col-span-full' : ''} />

          {isFetchingNextPage && (
            <div className={`flex justify-center py-4 ${viewMode !== 'list' ? 'col-span-full' : ''}`}>
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

function PropertyCard({ property: p, compact = false }: { property: Property; compact?: boolean }) {
  const cover = p.photos?.find(ph => ph.is_cover) ?? p.photos?.[0];
  const vis = VISIBILITY_LABELS[p.visibility_status] ?? VISIBILITY_LABELS.private;

  if (compact) {
    return (
      <Link href={`/properties/${p.id}`}>
        <article className="squircle-card overflow-hidden press-scale flex flex-col h-full"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
          {/* Photo */}
          <div className="relative aspect-[4/3] bg-[var(--fill-tertiary)]">
            {cover ? (
              <Image src={cover.url} alt={p.street ?? ''} fill className="object-cover" sizes="50vw" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin size={16} style={{ color: 'var(--label-quaternary)' }} />
              </div>
            )}
            <div className="absolute inset-0 photo-overlay" />
            <div className="absolute top-1.5 right-1.5">
              <Badge variant={vis.variant} size="sm" className="text-[9px] px-1.5 py-0.5">{vis.label}</Badge>
            </div>
            {p.tags && p.tags.length > 0 && (
              <div className="absolute top-1.5 left-1.5">
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  {p.tags[0]}
                </span>
              </div>
            )}
          </div>
          {/* Info */}
          <div className="p-2 flex flex-col gap-1 flex-1">
            <PermissionGate hideInSafeMode>
              <p className="text-[13px] font-bold leading-tight" style={{ color: 'var(--label-primary)' }}>
                {formatPrice(p.price)}
              </p>
            </PermissionGate>
            <p className="text-[11px] truncate" style={{ color: 'var(--label-tertiary)' }}>
              {p.district ?? p.city}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {p.rooms && (
                <span className="flex items-center gap-0.5 text-[11px]" style={{ color: 'var(--label-secondary)' }}>
                  <BedDouble size={10} />{p.rooms}к
                </span>
              )}
              {p.area_sqm && (
                <span className="text-[11px]" style={{ color: 'var(--label-secondary)' }}>{p.area_sqm}м²</span>
              )}
              {p.floor && p.floor_total && (
                <span className="text-[11px]" style={{ color: 'var(--label-secondary)' }}>{p.floor}/{p.floor_total}эт</span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

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
            <PermissionGate hideInSafeMode>
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
          <PermissionGate hideInSafeMode>
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
            {p.floor && p.floor_total && (
              <span className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                {p.floor}/{p.floor_total} эт.
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
  function toggle<K extends keyof typeof local>(k: K, v: (typeof local)[K]) {
    setLocal(p => ({ ...p, [k]: p[k] === v ? undefined : v }));
  }

  const RENOVATIONS = [
    { v: 'none',     l: 'Без отделки'   },
    { v: 'rough',    l: 'Черновая'      },
    { v: 'cosmetic', l: 'Косметический' },
    { v: 'euro',     l: 'Евро'          },
    { v: 'designer', l: 'Дизайнерский'  },
  ];

  return (
    <div className="flex flex-col gap-5 py-2">
      <FilterSection label="Поиск">
        <input type="text" placeholder="Улица, район..." className="input-field"
          value={local.q ?? ''}
          onChange={e => set('q', e.target.value || undefined)} />
      </FilterSection>

      <FilterSection label="Вид сделки">
        <div className="flex gap-2">
          {([['sale', 'Продажа'], ['rent', 'Аренда']] as const).map(([v, l]) => (
            <button key={v} onClick={() => toggle('listing_type', v)}
              className={`chip press-scale ${local.listing_type === v ? 'chip-active' : ''}`}>{l}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Статус объекта">
        <div className="flex gap-2 flex-wrap">
          {([['active', 'Активный'], ['sold', 'Продан'], ['withdrawn', 'Снят']] as const).map(([v, l]) => (
            <button key={v} onClick={() => toggle('property_status', v)}
              className={`chip press-scale ${local.property_status === v ? 'chip-active' : ''}`}>{l}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Ремонт">
        <div className="flex gap-2 flex-wrap">
          {RENOVATIONS.map(({ v, l }) => (
            <button key={v} onClick={() => toggle('renovation', v)}
              className={`chip press-scale ${local.renovation === v ? 'chip-active' : ''}`}>{l}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Особенности">
        <div className="flex gap-2 flex-wrap">
          {([
            ['has_loggia',    'Лоджия'],
            ['has_balcony',   'Балкон'],
            ['has_wardrobe',  'Гардероб'],
            ['has_panoramic', 'Панорамные'],
            ['from_realtor',  'От риэлтора'],
          ] as const).map(([k, l]) => (
            <button key={k}
              onClick={() => set(k, local[k] ? undefined : true as never)}
              className={`chip press-scale ${local[k] ? 'chip-active' : ''}`}>{l}</button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Цена, ₽">
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="От" className="input-field"
            value={String((local as Record<string, unknown>).price_min ?? '')}
            onChange={e => set('price_min' as keyof typeof local, e.target.value ? Number(e.target.value) : undefined as never)} />
          <input type="number" placeholder="До" className="input-field"
            value={String((local as Record<string, unknown>).price_max ?? '')}
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
