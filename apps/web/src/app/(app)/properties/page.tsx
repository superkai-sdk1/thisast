'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, Plus } from 'lucide-react';
import { usePropertiesInfinite } from '@/lib/hooks/queries/useProperties';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { formatPrice } from '@/lib/utils/format';
import type { PropertyFilter } from '@/lib/api/properties';
import type { PropertyType } from '@crm/shared-types';

const TYPES: { label: string; value: PropertyType | '' }[] = [
  { label: 'Все',         value: ''             },
  { label: 'Квартиры',   value: 'apartment'    },
  { label: 'Вторичка',   value: 'resale'       },
  { label: 'Новострой',  value: 'new_building' },
  { label: 'Дома',        value: 'house'        },
  { label: 'Участки',    value: 'land'         },
  { label: 'Коммерция',  value: 'commercial'   },
  { label: 'Аренда',     value: 'rent'         },
];

export default function PropertiesPage() {
  const [activeType, setActiveType] = useState<PropertyType | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<Omit<PropertyFilter, 'page' | 'type'>>({});

  const activeFilter: Omit<PropertyFilter, 'page'> = {
    ...(activeType && { type: activeType }),
    ...filter,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = usePropertiesInfinite(activeFilter);

  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (!node) return;
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.current.observe(node);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <GlassNavBar
        title="Объекты"
        right={
          <div className="flex gap-2">
            <button onClick={() => setFilterOpen(true)} className="p-2 text-[var(--ios-blue)]">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <PermissionGate permission="can_view_global_database">
              <Link href="/properties/new" className="p-2 text-[var(--ios-blue)]">
                <Plus className="w-5 h-5" />
              </Link>
            </PermissionGate>
          </div>
        }
      />

      {/* Category tabs */}
      <div className="px-4 py-3 overflow-x-auto no-scrollbar">
        <SegmentedControl
          options={TYPES.map(t => ({ value: t.value === '' ? '__all__' : t.value, label: t.label }))}
          value={activeType === '' ? '__all__' : activeType}
          onChange={(v) => setActiveType(v === '__all__' ? '' : v as PropertyType)}
        />
      </div>

      {/* Property grid */}
      <div className="px-4 grid grid-cols-1 gap-4 pb-4">
        {items.map((property) => (
          <Link key={property.id} href={`/properties/${property.id}`}>
            <article className="glass-card squircle-card overflow-hidden">
              {/* Cover photo */}
              <div className="relative h-48 bg-[var(--fill-tertiary)]">
                {property.photos?.[0] && (
                  <Image
                    src={property.photos[0].url}
                    alt={property.street ?? 'Объект'}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                  {property.tags?.includes('Срочно') && (
                    <Badge variant="destructive" className="text-xs">Срочно</Badge>
                  )}
                  {property.tags?.includes('Эксклюзив') && (
                    <Badge variant="default" className="text-xs">Эксклюзив</Badge>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-lg font-bold text-[var(--label-primary)]">
                  {formatPrice(property.price)}
                </p>
                <PermissionGate hideInSafeMode fallback={
                  <p className="text-sm text-[var(--label-secondary)] mt-0.5">
                    {property.district}
                  </p>
                }>
                  <p className="text-sm text-[var(--label-secondary)] mt-0.5 truncate">
                    {property.street
                      ? `${property.district}, ${property.street}`
                      : property.district}
                  </p>
                </PermissionGate>

                <div className="flex gap-3 mt-2 text-xs text-[var(--label-tertiary)]">
                  {property.rooms && <span>{property.rooms}-комн.</span>}
                  {property.area_sqm && <span>{property.area_sqm} м²</span>}
                  {property.floor && <span>{property.floor} эт.</span>}
                </div>
              </div>
            </article>
          </Link>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <p className="text-center text-sm text-[var(--label-tertiary)] py-4">Загрузка...</p>
        )}
      </div>

      {/* Filter bottom sheet */}
      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтры">
        <PropertyFilterForm
          value={filter}
          onChange={setFilter}
          onClose={() => setFilterOpen(false)}
          type={activeType}
        />
      </BottomSheet>
    </>
  );
}

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];
const TAGS = ['Срочно', 'Эксклюзив', 'Торг', 'Ипотека'];

function FilterInput({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function RangeInputs({
  fromVal, toVal, onFromChange, onToChange, placeholder = ['от', 'до'],
}: {
  fromVal: number | undefined;
  toVal: number | undefined;
  onFromChange: (v: number | undefined) => void;
  onToChange: (v: number | undefined) => void;
  placeholder?: [string, string];
}) {
  const cls = 'flex-1 px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] outline-none';
  return (
    <div className="flex gap-2">
      <input
        type="number"
        placeholder={placeholder[0]}
        className={cls}
        value={fromVal ?? ''}
        onChange={e => onFromChange(e.target.value ? Number(e.target.value) : undefined)}
      />
      <input
        type="number"
        placeholder={placeholder[1]}
        className={cls}
        value={toVal ?? ''}
        onChange={e => onToChange(e.target.value ? Number(e.target.value) : undefined)}
      />
    </div>
  );
}

function ChipGroup<T extends string | number>({
  options, active, onToggle, labelFn,
}: {
  options: T[];
  active: T[];
  onToggle: (val: T) => void;
  labelFn?: (v: T) => string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const isActive = active.includes(opt);
        return (
          <button
            key={String(opt)}
            onClick={() => onToggle(opt)}
            className={`px-4 py-2 rounded-[14px] text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[var(--ios-blue)] text-white'
                : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
            }`}
          >
            {labelFn ? labelFn(opt) : String(opt)}
          </button>
        );
      })}
    </div>
  );
}

function toggleItem<T>(arr: T[] | undefined, item: T): T[] {
  const list = arr ?? [];
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}

function PropertyFilterForm({
  value, onChange, onClose, type,
}: {
  value: Omit<PropertyFilter, 'page' | 'type'>;
  onChange: (v: Omit<PropertyFilter, 'page' | 'type'>) => void;
  onClose: () => void;
  type: PropertyType | '';
}) {
  const [local, setLocal] = useState(value);

  function set<K extends keyof typeof local>(key: K, val: (typeof local)[K]) {
    setLocal((prev) => ({ ...prev, [key]: val }));
  }

  const showRooms = type === 'apartment' || type === 'resale' || type === '' ;
  const showFloor = type === 'apartment' || type === 'resale' || type === 'new_building' || type === '';
  const showArea  = type !== 'land';
  const showLandArea = type === 'land' || type === '';

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Search */}
      <FilterInput label="Поиск">
        <input
          type="text"
          placeholder="Адрес, район, описание..."
          className="w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none"
          value={local.q ?? ''}
          onChange={e => set('q', e.target.value || undefined)}
        />
      </FilterInput>

      {/* Price */}
      <FilterInput label="Цена, ₽">
        <RangeInputs
          fromVal={local.price_min}
          toVal={local.price_max}
          onFromChange={v => set('price_min', v)}
          onToChange={v => set('price_max', v)}
        />
      </FilterInput>

      {/* Area */}
      {showArea && (
        <FilterInput label="Площадь, м²">
          <RangeInputs
            fromVal={local.area_min}
            toVal={local.area_max}
            onFromChange={v => set('area_min', v)}
            onToChange={v => set('area_max', v)}
          />
        </FilterInput>
      )}

      {/* Land area — same field, different label */}
      {showLandArea && type === 'land' && (
        <FilterInput label="Площадь участка, сот.">
          <RangeInputs
            fromVal={local.area_min}
            toVal={local.area_max}
            onFromChange={v => set('area_min', v)}
            onToChange={v => set('area_max', v)}
          />
        </FilterInput>
      )}

      {/* Rooms */}
      {showRooms && (
        <FilterInput label="Комнат">
          <ChipGroup
            options={[1, 2, 3, 4, 5]}
            active={local.rooms ?? []}
            onToggle={(r) => set('rooms', toggleItem(local.rooms, r))}
            labelFn={(r) => r === 5 ? '5+' : String(r)}
          />
        </FilterInput>
      )}

      {/* Floor */}
      {showFloor && (
        <FilterInput label="Этаж">
          <RangeInputs
            fromVal={local.floor_min}
            toVal={local.floor_max}
            onFromChange={v => set('floor_min', v)}
            onToChange={v => set('floor_max', v)}
            placeholder={['с', 'по']}
          />
        </FilterInput>
      )}

      {/* Districts */}
      <FilterInput label="Район">
        <ChipGroup
          options={DISTRICTS}
          active={local.district ? [local.district] : []}
          onToggle={(d) => set('district', local.district === d ? undefined : d)}
        />
      </FilterInput>

      {/* Visibility */}
      <FilterInput label="Видимость">
        <ChipGroup
          options={['private', 'shared', 'public'] as const}
          active={local.status ? [local.status] : []}
          onToggle={(s) => set('status', local.status === s ? undefined : s)}
          labelFn={(s) => ({ private: 'Личные', shared: 'Агентство', public: 'Публичные' }[s])}
        />
      </FilterInput>

      {/* Tags */}
      <FilterInput label="Метки">
        <ChipGroup
          options={TAGS}
          active={local.tags ?? []}
          onToggle={(t) => set('tags', toggleItem(local.tags, t))}
        />
      </FilterInput>

      {/* My objects only */}
      <label className="flex items-center justify-between py-1 cursor-pointer">
        <span className="text-sm text-[var(--label-primary)]">Только мои объекты</span>
        <button
          role="switch"
          aria-checked={!!local.is_mine}
          onClick={() => set('is_mine', local.is_mine ? undefined : true)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            local.is_mine ? 'bg-[var(--ios-blue)]' : 'bg-[var(--fill-secondary)]'
          }`}
        >
          <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
            local.is_mine ? 'translate-x-5.5' : 'translate-x-0.5'
          }`} />
        </button>
      </label>

      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => { setLocal({}); onChange({}); onClose(); }}
        >
          Сбросить
        </Button>
        <Button
          className="flex-1"
          onClick={() => { onChange(local); onClose(); }}
        >
          Применить
        </Button>
      </div>
    </div>
  );
}
