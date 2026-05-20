'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, SlidersHorizontal, Users, Wallet } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDemands, useUpdateDemandStatus } from '@/lib/hooks/queries/useDemands';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { formatPrice } from '@/lib/utils/format';
import { KANBAN_STAGES } from '@crm/shared-types';
import type { Demand } from '@crm/shared-types';
import type { DemandFilter } from '@/lib/api/demands';

type ViewMode = 'list' | 'kanban';

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Наличные', mortgage: 'Ипотека', installment: 'Рассрочка',
  trade_in: 'Trade-in', matcapital: 'Маткапитал', military_mortgage: 'Воен. ипотека',
};
const REPAIR_LABELS: Record<string, string> = {
  no_repair: 'Без ремонта', cosmetic: 'Косметич.', euro: 'Евро',
  designer: 'Дизайнерский', new_building_finish: 'Чистовая',
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

export default function DemandPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<DemandFilter>({});
  const { data: demands = [], isLoading } = useDemands(filter);

  const hasActiveFilters = Object.values(filter).some(v =>
    v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
  );

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

      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-10 glass-nav border-b-0 px-4 py-2.5">
        <SegmentedControl
          options={[{ value: 'list', label: 'Список' }, { value: 'kanban', label: 'Канбан' }]}
          value={view}
          onChange={(v) => setView(v as ViewMode)}
        />
      </div>

      <div className="gradient-mesh min-h-full">
        {view === 'list' ? (
          <DemandList demands={demands} isLoading={isLoading} />
        ) : (
          <DemandKanban demands={demands} isLoading={isLoading} />
        )}
      </div>

      <Link href="/demand/new" className="fab" aria-label="Добавить клиента">
        <Plus size={24} strokeWidth={2.2} />
      </Link>

      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр клиентов" snapPoints={[0.75, 0.92]}>
        <DemandFilterForm
          value={filter}
          onChange={setFilter}
          onClose={() => setFilterOpen(false)}
        />
      </BottomSheet>
    </>
  );
}

function DemandList({ demands, isLoading }: { demands: Demand[]; isLoading?: boolean }) {
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
        <Link href="/demand/new">
          <Button size="sm" className="mt-2">Добавить клиента</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 flex flex-col gap-3">
      {demands.map((d) => (
        <Link key={d.id} href={`/demand/${d.id}`}>
          <DemandCard demand={d} />
        </Link>
      ))}
    </div>
  );
}

function DemandCard({ demand }: { demand: Demand }) {
  const stageInfo = STAGE_COLORS[demand.kanban_status] ?? STAGE_COLORS.new;
  const stageLabel = KANBAN_STAGES.find(s => s.value === demand.kanban_status)?.label ?? demand.kanban_status;

  return (
    <article
      className="squircle-card overflow-hidden press-scale"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="p-4 flex flex-col gap-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stageInfo.dot}`} />
            <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
              {demand.buyer_name}
            </p>
          </div>
          <Badge variant={stageInfo.badge} size="sm">{stageLabel}</Badge>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-1.5">
          <Wallet size={12} style={{ color: 'var(--label-tertiary)' }} />
          <span className="text-[13px] font-medium" style={{ color: 'var(--label-secondary)' }}>
            {formatPrice(demand.budget_min ?? 0)} — {formatPrice(demand.budget_max)}
          </span>
        </div>

        {/* Tags row */}
        {((demand.districts && demand.districts.length > 0) || (demand.payment_forms && demand.payment_forms.length > 0)) && (
          <div className="flex gap-1 flex-wrap">
            {demand.districts?.slice(0, 2).map(d => (
              <span key={d} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}>
                {d}
              </span>
            ))}
            {demand.payment_forms?.slice(0, 2).map(p => (
              <span key={p} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}>
                {PAYMENT_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function DemandKanban({ demands, isLoading }: { demands: Demand[]; isLoading?: boolean }) {
  const updateStatus = useUpdateDemandStatus();
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
              {/* Column header */}
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

              <SortableContext
                items={stageDemands.map(d => d.id)}
                strategy={verticalListSortingStrategy}
                id={stage.value}
              >
                <div className="flex flex-col gap-2">
                  {stageDemands.map((demand) => (
                    <Link key={demand.id} href={`/demand/${demand.id}`}>
                      <article
                        className="squircle-card p-3 cursor-grab active:cursor-grabbing press-scale"
                        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
                      >
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                          {demand.buyer_name}
                        </p>
                        <p className="text-[12px] mt-1" style={{ color: 'var(--label-secondary)' }}>
                          до {formatPrice(demand.budget_max)}
                        </p>
                        {demand.districts && demand.districts.length > 0 && (
                          <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--label-tertiary)' }}>
                            {demand.districts.join(', ')}
                          </p>
                        )}
                        {demand.payment_forms && demand.payment_forms.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1.5">
                            {demand.payment_forms.slice(0, 2).map(p => (
                              <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}>
                                {PAYMENT_LABELS[p] ?? p}
                              </span>
                            ))}
                          </div>
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

function ChipToggle<T extends string>({
  options, active, onToggle, labelFn,
}: {
  options: T[];
  active: T[];
  onToggle: (v: T) => void;
  labelFn?: (v: T) => string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`chip press-scale ${active.includes(opt) ? 'chip-active' : ''}`}
        >
          {labelFn ? labelFn(opt) : opt}
        </button>
      ))}
    </div>
  );
}

function toggleArr<T>(arr: T[] | undefined, item: T): T[] {
  const list = arr ?? [];
  return list.includes(item) ? list.filter(x => x !== item) : [...list, item];
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

function DemandFilterForm({
  value, onChange, onClose,
}: {
  value: DemandFilter;
  onChange: (v: DemandFilter) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(value);

  function set<K extends keyof DemandFilter>(key: K, val: DemandFilter[K]) {
    setLocal(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      <FilterSection label="Поиск">
        <input
          type="text"
          placeholder="Имя или телефон..."
          className="input-field"
          value={local.q ?? ''}
          onChange={e => set('q', e.target.value || undefined)}
        />
      </FilterSection>

      <FilterSection label="Бюджет до, ₽">
        <input
          type="number"
          placeholder="Максимальный бюджет"
          className="input-field"
          value={local.budget_max ?? ''}
          onChange={e => set('budget_max', e.target.value ? Number(e.target.value) : undefined)}
        />
      </FilterSection>

      <FilterSection label="Стадия">
        <div className="flex gap-2 flex-wrap">
          {KANBAN_STAGES.map(stage => (
            <button
              key={stage.value}
              onClick={() => set('kanban_status', local.kanban_status === stage.value ? undefined : stage.value)}
              className={`chip press-scale ${local.kanban_status === stage.value ? 'chip-active' : ''}`}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Районы">
        <ChipToggle
          options={DISTRICTS}
          active={(local.districts ?? []) as string[]}
          onToggle={(d) => set('districts', toggleArr(local.districts, d))}
        />
      </FilterSection>

      <FilterSection label="Форма оплаты">
        <ChipToggle
          options={Object.keys(PAYMENT_LABELS)}
          active={(local.payment_forms ?? []) as string[]}
          onToggle={(p) => set('payment_forms', toggleArr(local.payment_forms, p))}
          labelFn={(p) => PAYMENT_LABELS[p] ?? p}
        />
      </FilterSection>

      <FilterSection label="Ремонт">
        <ChipToggle
          options={Object.keys(REPAIR_LABELS)}
          active={(local.repair_types ?? []) as string[]}
          onToggle={(r) => set('repair_types', toggleArr(local.repair_types, r))}
          labelFn={(r) => REPAIR_LABELS[r] ?? r}
        />
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
