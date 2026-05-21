'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft, Building, BedDouble, Maximize2, MapPin, Calendar,
  Layers, Plus, SlidersHorizontal, Pencil,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useComplex } from '@/lib/hooks/queries/useComplexes';
import { usePropertiesInfinite } from '@/lib/hooks/queries/useProperties';
import { PropertyGallery } from '@/components/organisms/PropertyGallery';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { formatPrice } from '@/lib/utils/format';
import { complexesApi } from '@/lib/api/complexes';
import type { ComplexClass, Property } from '@crm/shared-types';
import type { PropertyFilter } from '@/lib/api/properties';
import type { ComplexApartment, CreateApartmentInput } from '@/lib/api/complexes';

interface ApartmentFilter {
  rooms?: number;
  price_min?: number;
  price_max?: number;
  payment_form?: string;
}

interface Props { params: Promise<{ id: string }> }

const CLASS_LABELS: Record<ComplexClass, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'purple' }> = {
  economy: { label: 'Эконом',  variant: 'default' },
  comfort: { label: 'Комфорт', variant: 'info'    },
  business:{ label: 'Бизнес',  variant: 'purple'  },
  premium: { label: 'Премиум', variant: 'warning' },
};

const ROOM_OPTIONS = [1, 2, 3, 4];
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Наличные', mortgage: 'Ипотека', installment: 'Рассрочка',
  trade_in: 'Trade-in', matcapital: 'Маткапитал', military_mortgage: 'Воен. ипотека',
};

export default function ComplexDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: complex, isLoading } = useComplex(id);
  const [filterOpen, setFilterOpen] = useState(false);
  const [propFilter, setPropFilter] = useState<ApartmentFilter>({});
  const [activeTab, setActiveTab] = useState<'objects' | 'apartments'>('objects');

  const activeFilter: Omit<PropertyFilter, 'page'> = {
    complex_id: id,
    price_min: propFilter.price_min,
    price_max: propFilter.price_max,
    payment_form: propFilter.payment_form,
    rooms: propFilter.rooms !== undefined ? [propFilter.rooms] : undefined,
  };
  const { data: propData } = usePropertiesInfinite(activeFilter);
  const properties = propData?.pages.flatMap(p => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  if (!complex) return null;

  const cls = complex.class ? CLASS_LABELS[complex.class] : null;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="fixed top-[calc(12px+env(safe-area-inset-top))] left-4 z-30 w-9 h-9 rounded-full flex items-center justify-center text-white press-scale"
        style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(12px)' }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Hero gallery */}
      <PropertyGallery
        photos={(complex.photos ?? []).map(p => ({ ...p, property_id: complex.id }))}
        className="w-full h-[55vw] min-h-56 max-h-80 rounded-none"
      />

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--label-primary)' }}>
              {complex.name}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0 mt-1">
              {cls && <Badge variant={cls.variant} size="sm">{cls.label}</Badge>}
              <Link href={`/complexes/${id}/edit`}>
                <button className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--fill-secondary)', color: 'var(--label-secondary)' }}>
                  <Pencil size={13} />
                </button>
              </Link>
            </div>
          </div>

          {complex.developer && (
            <p className="text-[14px]" style={{ color: 'var(--label-secondary)' }}>
              {complex.developer}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {complex.district && (
              <div className="flex items-center gap-1">
                <MapPin size={12} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>{complex.district}</span>
              </div>
            )}
            {complex.year_delivery && (
              <div className="flex items-center gap-1">
                <Calendar size={12} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                  Сдача {complex.year_delivery}
                </span>
              </div>
            )}
            {complex.total_floors && (
              <div className="flex items-center gap-1">
                <Layers size={12} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                  {complex.total_floors} этажей
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats card */}
        <div className="squircle-card p-4 grid grid-cols-2 gap-4"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
          <div>
            <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Квартир в базе</p>
            <p className="text-[18px] font-bold" style={{ color: 'var(--ios-blue)' }}>
              {complex.property_count ?? 0}
            </p>
          </div>
          {complex.min_price && (
            <div>
              <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Цена от</p>
              <p className="text-[18px] font-bold" style={{ color: 'var(--ios-green)' }}>
                {formatPrice(complex.min_price)}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {complex.description && (
          <div className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
            <p className="section-label">О комплексе</p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--label-secondary)' }}>
              {complex.description}
            </p>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('objects')}
            className={`chip press-scale flex-1 ${activeTab === 'objects' ? 'chip-active' : ''}`}
          >
            Объекты {properties.length > 0 && `(${properties.length})`}
          </button>
          <button
            onClick={() => setActiveTab('apartments')}
            className={`chip press-scale flex-1 ${activeTab === 'apartments' ? 'chip-active' : ''}`}
          >
            Апартаменты
          </button>
        </div>

        {/* Objects tab */}
        {activeTab === 'objects' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="section-label" style={{ marginBottom: 0 }}>
                Квартиры в ЖК {properties.length > 0 && `(${properties.length})`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOpen(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
                  style={{ color: 'var(--label-tertiary)', background: 'var(--fill-tertiary)' }}
                >
                  <SlidersHorizontal size={14} />
                </button>
                <Link href={`/properties/new?complex_id=${id}`}>
                  <button
                    className="h-8 px-3 rounded-[10px] flex items-center gap-1 text-[12px] font-semibold press-scale"
                    style={{ background: 'var(--ios-blue)', color: 'white' }}
                  >
                    <Plus size={13} />
                    Добавить
                  </button>
                </Link>
              </div>
            </div>

            {properties.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8"
                style={{ background: 'var(--bg-elevated)', borderRadius: 16, border: '0.5px solid var(--separator)' }}>
                <BedDouble size={24} style={{ color: 'var(--label-quaternary)' }} />
                <p className="text-[13px]" style={{ color: 'var(--label-tertiary)' }}>
                  Квартиры не добавлены
                </p>
                <Link href={`/properties/new?complex_id=${id}`}>
                  <Button size="sm">Добавить квартиру</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {properties.map(p => <CompactPropertyCard key={p.id} property={p} />)}
              </div>
            )}
          </div>
        )}

        {/* Apartments tab */}
        {activeTab === 'apartments' && (
          <DeveloperApartmentsTab complexId={id} />
        )}
      </div>

      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр квартир" snapPoints={[0.65, 0.92]}>
        <ApartmentFilterForm value={propFilter} onChange={setPropFilter} onClose={() => setFilterOpen(false)} />
      </BottomSheet>
    </div>
  );
}

const STATUS_CONFIG = {
  free:     { label: 'Свободна', color: 'var(--ios-green)'  },
  reserved: { label: 'Резерв',   color: 'var(--ios-yellow)' },
  sold:     { label: 'Продана',  color: 'var(--ios-red)'    },
} as const;

const ROOMS_LABEL: Record<number, string> = {
  0: 'Студия',
  1: '1-комн',
  2: '2-комн',
  3: '3-комн',
  4: '4+-комн',
};

function DeveloperApartmentsTab({ complexId }: { complexId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<CreateApartmentInput, 'status'> & { status: 'free' | 'reserved' | 'sold' }>({
    area: 0,
    rooms: undefined,
    floor: undefined,
    status: 'free',
  });

  const { data: apartments = [], isLoading } = useQuery({
    queryKey: ['complex-apartments', complexId],
    queryFn: () => complexesApi.getApartments(complexId),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateApartmentInput) => complexesApi.createApartment(complexId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complex-apartments', complexId] });
      setShowForm(false);
      setForm({ area: 0, rooms: undefined, floor: undefined, status: 'free' });
    },
  });

  function handleSubmit() {
    if (!form.area) return;
    mutation.mutate({ area: form.area, rooms: form.rooms, floor: form.floor, status: form.status });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="section-label" style={{ marginBottom: 0 }}>
          Апартаменты {apartments.length > 0 && `(${apartments.length})`}
        </p>
        <button
          onClick={() => setShowForm(v => !v)}
          className="h-8 px-3 rounded-[10px] flex items-center gap-1 text-[12px] font-semibold press-scale"
          style={{ background: 'var(--ios-blue)', color: 'white' }}
        >
          <Plus size={13} />
          Добавить
        </button>
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="squircle-card p-4 mb-3 flex flex-col gap-3"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
          <p className="text-[13px] font-semibold" style={{ color: 'var(--label-primary)' }}>Добавить квартиру</p>

          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Площадь, м²</span>
              <input
                type="number"
                className="input-field"
                placeholder="50"
                value={form.area || ''}
                onChange={e => setForm(f => ({ ...f, area: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Этаж</span>
              <input
                type="number"
                className="input-field"
                placeholder="1"
                value={form.floor ?? ''}
                onChange={e => setForm(f => ({ ...f, floor: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Комнаты</span>
            <div className="flex gap-2 flex-wrap">
              {([0, 1, 2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, rooms: f.rooms === n ? undefined : n }))}
                  className={`chip press-scale ${form.rooms === n ? 'chip-active' : ''}`}
                >
                  {ROOMS_LABEL[n]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Статус</span>
            <div className="flex gap-2 flex-wrap">
              {(['free', 'reserved', 'sold'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`chip press-scale ${form.status === s ? 'chip-active' : ''}`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!form.area || mutation.isPending}>
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
        </div>
      ) : apartments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8"
          style={{ background: 'var(--bg-elevated)', borderRadius: 16, border: '0.5px solid var(--separator)' }}>
          <Building size={24} style={{ color: 'var(--label-quaternary)' }} />
          <p className="text-[13px]" style={{ color: 'var(--label-tertiary)' }}>
            Апартаменты не добавлены
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {apartments.map(apt => <ApartmentRow key={apt.id} apartment={apt} />)}
        </div>
      )}
    </div>
  );
}

function ApartmentRow({ apartment: a }: { apartment: ComplexApartment }) {
  const status = STATUS_CONFIG[a.status];
  return (
    <div className="squircle-card px-4 py-3 flex items-center justify-between"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-3">
        {a.rooms !== undefined && (
          <span className="text-[13px] font-medium" style={{ color: 'var(--label-primary)' }}>
            {ROOMS_LABEL[Math.min(a.rooms, 4)]}
          </span>
        )}
        <div className="flex items-center gap-1">
          <Maximize2 size={11} style={{ color: 'var(--label-tertiary)' }} />
          <span className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{a.area} м²</span>
        </div>
        {a.floor !== undefined && (
          <div className="flex items-center gap-1">
            <Layers size={11} style={{ color: 'var(--label-tertiary)' }} />
            <span className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{a.floor} эт.</span>
          </div>
        )}
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: `${status.color}22`, color: status.color }}
      >
        {status.label}
      </span>
    </div>
  );
}

function CompactPropertyCard({ property: p }: { property: Property }) {
  const cover = p.photos?.find(ph => ph.is_cover) ?? p.photos?.[0];

  return (
    <Link href={`/properties/${p.id}`}>
      <article className="squircle-card overflow-hidden press-scale flex gap-0"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
        {/* Thumbnail */}
        <div className="relative w-24 h-20 flex-shrink-0 bg-[var(--fill-tertiary)]">
          {cover ? (
            <Image src={cover.url} alt="" fill className="object-cover" sizes="96px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin size={14} style={{ color: 'var(--label-quaternary)' }} />
            </div>
          )}
        </div>
        {/* Info */}
        <div className="flex-1 px-3 py-2.5 min-w-0">
          <PermissionGate hideInSafeMode>
            <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--label-primary)' }}>
              {formatPrice(p.price)}
            </p>
          </PermissionGate>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {p.rooms && (
              <div className="flex items-center gap-1">
                <BedDouble size={11} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{p.rooms} комн.</span>
              </div>
            )}
            {p.area_sqm && (
              <div className="flex items-center gap-1">
                <Maximize2 size={11} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{p.area_sqm} м²</span>
              </div>
            )}
            {p.floor && p.floor_total && (
              <div className="flex items-center gap-1">
                <Layers size={11} style={{ color: 'var(--label-tertiary)' }} />
                <span className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{p.floor}/{p.floor_total}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

function ApartmentFilterForm({
  value, onChange, onClose,
}: {
  value: ApartmentFilter;
  onChange: (v: ApartmentFilter) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<ApartmentFilter>(value);

  function set<K extends keyof ApartmentFilter>(k: K, v: ApartmentFilter[K]) {
    setLocal(prev => ({ ...prev, [k]: v }));
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-2">
        <span className="section-label">Комнаты</span>
        <div className="flex gap-2">
          {ROOM_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => set('rooms', local.rooms === n ? undefined : n)}
              className={`chip press-scale flex-1 ${local.rooms === n ? 'chip-active' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">Цена</span>
        <div className="flex gap-2">
          <input type="number" className="input-field flex-1" placeholder="от ₽"
            value={local.price_min ?? ''}
            onChange={e => set('price_min', e.target.value ? Number(e.target.value) : undefined)} />
          <input type="number" className="input-field flex-1" placeholder="до ₽"
            value={local.price_max ?? ''}
            onChange={e => set('price_max', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="section-label">Форма оплаты</span>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
            <button key={val}
              onClick={() => set('payment_form', local.payment_form === val ? undefined : val)}
              className={`chip press-scale ${local.payment_form === val ? 'chip-active' : ''}`}
            >
              {label}
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
