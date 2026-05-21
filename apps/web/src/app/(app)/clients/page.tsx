'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, SlidersHorizontal, Users, Wallet, Phone, Flame, Thermometer } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { demandsApi } from '@/lib/api/demands';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { formatPrice } from '@/lib/utils/format';
import { KANBAN_STAGES } from '@crm/shared-types';
import type { Demand } from '@crm/shared-types';

type ViewMode = 'list' | 'kanban';

const CLIENT_TYPE_TABS = [
  { value: '', label: 'Все' },
  { value: 'buyer', label: 'Покупатели' },
  { value: 'seller', label: 'Продавцы' },
  { value: 'renter', label: 'Арендаторы' },
  { value: 'landlord', label: 'Арендодатели' },
] as const;

const TEMPERATURE_LABELS: Record<string, { label: string; color: string }> = {
  hot:     { label: 'Горячий',  color: 'var(--ios-red)'    },
  warm:    { label: 'Тёплый',   color: 'var(--ios-orange)' },
  cold:    { label: 'Холодный', color: 'var(--ios-blue)'   },
  thinking:{ label: 'Думает',   color: 'var(--label-tertiary)' },
};

const STAGE_COLORS: Record<string, { badge: 'default' | 'success' | 'warning' | 'info' | 'purple'; dot: string }> = {
  new:         { badge: 'info',    dot: 'bg-[var(--ios-blue)]'   },
  qualifying:  { badge: 'purple',  dot: 'bg-[var(--ios-purple)]' },
  selection:   { badge: 'info',    dot: 'bg-[var(--ios-teal)]'   },
  viewings:    { badge: 'warning', dot: 'bg-[var(--ios-orange)]' },
  thinking:    { badge: 'default', dot: 'bg-[var(--label-tertiary)]' },
  negotiation: { badge: 'warning', dot: 'bg-[var(--ios-yellow)]' },
  deal:        { badge: 'success', dot: 'bg-[var(--ios-green)]'  },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Наличные', mortgage: 'Ипотека', installment: 'Рассрочка',
  trade_in: 'Trade-in', matcapital: 'Маткапитал', military_mortgage: 'Воен. ипотека',
};

interface ClientFilter {
  client_type?: string;
  temperature?: string;
  is_active?: string;
  kanban_status?: string;
}

export default function ClientsPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [clientType, setClientType] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<ClientFilter>({});

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ['demands', { client_type: clientType, ...filter }],
    queryFn: () => demandsApi.list({ client_type: clientType || undefined, ...filter } as never),
  });

  const hasActiveFilters = clientType !== '' || Object.values(filter).some(v => v !== undefined && v !== '');

  return (
    <>
      <GlassNavBar
        title="Клиенты"
        right={
          <div className="flex gap-1 items-center">
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

      {/* Client type tabs */}
      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-10 glass-nav border-b-0 px-4 pt-2 pb-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CLIENT_TYPE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setClientType(tab.value)}
              className={`chip flex-shrink-0 press-scale ${clientType === tab.value ? 'chip-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <SegmentedControl
            options={[{ value: 'list', label: 'Список' }, { value: 'kanban', label: 'Канбан' }]}
            value={view}
            onChange={(v) => setView(v as ViewMode)}
          />
        </div>
      </div>

      <div className="gradient-mesh min-h-full">
        {view === 'list' ? (
          <ClientList demands={demands} isLoading={isLoading} />
        ) : (
          <ClientKanban demands={demands} isLoading={isLoading} />
        )}
      </div>

      <Link href="/clients/new" className="fab" aria-label="Добавить клиента">
        <Plus size={24} strokeWidth={2.2} />
      </Link>

      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр" snapPoints={[0.6, 0.85]}>
        <ClientFilterForm value={filter} onChange={setFilter} onClose={() => setFilterOpen(false)} />
      </BottomSheet>
    </>
  );
}

function ClientList({ demands, isLoading }: { demands: Demand[]; isLoading?: boolean }) {
  const qc = useQueryClient();
  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      demandsApi.update(id, { is_active } as never),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['demands'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }
  if (demands.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 px-4">
        <div className="w-16 h-16 rounded-[20px] flex items-center justify-center" style={{ background: 'var(--fill-tertiary)' }}>
          <Users size={28} style={{ color: 'var(--label-tertiary)' }} />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>Нет клиентов</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--label-tertiary)' }}>Добавьте первого клиента</p>
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="mt-2">Добавить клиента</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="px-4 pt-3 pb-6 flex flex-col gap-3">
      {demands.map((d) => (
        <div key={d.id} className="relative">
          <Link href={`/clients/${d.id}`}>
            <ClientCard demand={d} />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleActive.mutate({ id: d.id, is_active: !((d as any).is_active ?? true) });
            }}
            className="absolute top-3 right-3 text-[11px] px-2 py-1 rounded-full press-scale z-10"
            style={{
              background: (d as any).is_active !== false ? 'rgba(52,199,89,0.15)' : 'var(--fill-tertiary)',
              color: (d as any).is_active !== false ? 'var(--ios-green)' : 'var(--label-quaternary)',
            }}
          >
            {(d as any).is_active !== false ? 'Активен' : 'Неактивен'}
          </button>
        </div>
      ))}
    </div>
  );
}

function ClientCard({ demand }: { demand: Demand }) {
  const stageInfo = STAGE_COLORS[demand.kanban_status] ?? STAGE_COLORS.new;
  const stageLabel = KANBAN_STAGES.find(s => s.value === demand.kanban_status)?.label ?? demand.kanban_status;
  const temp = demand.temperature ? TEMPERATURE_LABELS[demand.temperature] : null;
  const clientTypeLabel: Record<string, string> = {
    buyer: 'Покупатель', seller: 'Продавец', renter: 'Арендатор', landlord: 'Арендодатель',
  };

  return (
    <article
      className="squircle-card overflow-hidden press-scale"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stageInfo.dot}`} />
            <div className="min-w-0">
              <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                {demand.buyer_name}
              </p>
              {(demand as any).display_id && (
                <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>#{(demand as any).display_id}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={stageInfo.badge} size="sm">{stageLabel}</Badge>
            {(demand as any).client_type && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>
                {clientTypeLabel[(demand as any).client_type] ?? (demand as any).client_type}
              </span>
            )}
          </div>
        </div>

        {/* Temperature + contact overdue */}
        {(temp || (demand as any).is_contact_overdue) && (
          <div className="flex items-center gap-2">
            {temp && (
              <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: temp.color }}>
                <Thermometer size={12} />
                {temp.label}
              </span>
            )}
            {(demand as any).is_contact_overdue && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(255,59,48,0.12)', color: 'var(--ios-red)' }}>
                Контакт просрочен
              </span>
            )}
          </div>
        )}

        {/* Budget */}
        {(demand.budget_min !== null || demand.budget_max !== null) && (
          <div className="flex items-center gap-1.5">
            <Wallet size={12} style={{ color: 'var(--label-tertiary)' }} />
            <span className="text-[13px] font-medium" style={{ color: 'var(--label-secondary)' }}>
              {demand.budget_min ? formatPrice(demand.budget_min) + ' — ' : ''}{formatPrice(demand.budget_max ?? 0)}
            </span>
          </div>
        )}

        {/* Districts / payment forms */}
        {(() => {
          const districts = Array.isArray(demand.districts) ? demand.districts : [];
          const paymentForms = Array.isArray(demand.payment_forms) ? demand.payment_forms : [];
          if (districts.length === 0 && paymentForms.length === 0) return null;
          return (
            <div className="flex gap-1 flex-wrap">
              {districts.slice(0, 2).map(d => (
                <span key={d} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>{d}</span>
              ))}
              {paymentForms.slice(0, 2).map(p => (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}>{PAYMENT_LABELS[p] ?? p}</span>
              ))}
            </div>
          );
        })()}
      </div>
    </article>
  );
}

function ClientKanban({ demands, isLoading }: { demands: Demand[]; isLoading?: boolean }) {
  const qc = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      demandsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['demands'] }),
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const demand = demands.find(d => d.id === active.id);
    if (!demand) return;
    updateStatus.mutate({ id: demand.id, status: over.id as string });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pt-3 pb-6">
        {KANBAN_STAGES.map((stage) => {
          const stageDemands = demands.filter(d => d.kanban_status === stage.value);
          const stageInfo = STAGE_COLORS[stage.value] ?? STAGE_COLORS.new;
          return (
            <div key={stage.value} className="flex-shrink-0 w-60">
              <div className="squircle-card p-3 mb-2 flex items-center justify-between"
                style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stageInfo.dot}`} />
                  <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                    {stage.label}
                  </span>
                </div>
                <span className="text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--fill-secondary)', color: 'var(--label-tertiary)' }}>
                  {stageDemands.length}
                </span>
              </div>
              <SortableContext items={stageDemands.map(d => d.id)} strategy={verticalListSortingStrategy} id={stage.value}>
                <div className="flex flex-col gap-2">
                  {stageDemands.map((demand) => (
                    <Link key={demand.id} href={`/clients/${demand.id}`}>
                      <article className="squircle-card p-3 cursor-grab active:cursor-grabbing press-scale"
                        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                          {demand.buyer_name}
                        </p>
                        {demand.budget_max && (
                          <p className="text-[12px] mt-1" style={{ color: 'var(--label-secondary)' }}>
                            до {formatPrice(demand.budget_max)}
                          </p>
                        )}
                        {Array.isArray(demand.districts) && demand.districts.length > 0 && (
                          <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--label-tertiary)' }}>
                            {demand.districts.join(', ')}
                          </p>
                        )}
                      </article>
                    </Link>
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}

function ClientFilterForm({ value, onChange, onClose }: { value: ClientFilter; onChange: (v: ClientFilter) => void; onClose: () => void }) {
  const [local, setLocal] = useState(value);
  function set<K extends keyof ClientFilter>(key: K, val: ClientFilter[K]) {
    setLocal(prev => ({ ...prev, [key]: val }));
  }
  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex flex-col gap-2">
        <span className="section-label">Температура</span>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(TEMPERATURE_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => set('temperature', local.temperature === k ? undefined : k)}
              className={`chip press-scale ${local.temperature === k ? 'chip-active' : ''}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="section-label">Активность</span>
        <div className="flex gap-2">
          <button onClick={() => set('is_active', local.is_active === 'true' ? undefined : 'true')}
            className={`chip press-scale ${local.is_active === 'true' ? 'chip-active' : ''}`}>Активные</button>
          <button onClick={() => set('is_active', local.is_active === 'false' ? undefined : 'false')}
            className={`chip press-scale ${local.is_active === 'false' ? 'chip-active' : ''}`}>Неактивные</button>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={() => { setLocal({}); onChange({}); onClose(); }}>Сбросить</Button>
        <Button className="flex-1" onClick={() => { onChange(local); onClose(); }}>Применить</Button>
      </div>
    </div>
  );
}
