'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, SlidersHorizontal } from 'lucide-react';
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

export default function DemandPage() {
  const [view, setView] = useState<ViewMode>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<DemandFilter>({});
  const { data: demands = [] } = useDemands(filter);

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
              className={`p-2 ${hasActiveFilters ? 'text-[var(--ios-blue)]' : 'text-[var(--label-tertiary)]'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <Link href="/demand/new" className="p-2 text-[var(--ios-blue)]">
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        }
      />

      <div className="px-4 py-3">
        <SegmentedControl
          options={[{ value: 'list', label: 'Список' }, { value: 'kanban', label: 'Канбан' }]}
          value={view}
          onChange={(v) => setView(v as ViewMode)}
        />
      </div>

      {view === 'list' ? (
        <DemandList demands={demands} />
      ) : (
        <DemandKanban demands={demands} />
      )}

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

function DemandList({ demands }: { demands: Demand[] }) {
  return (
    <div className="px-4 flex flex-col gap-3 pb-4">
      {demands.length === 0 && (
        <p className="text-center text-sm text-[var(--label-tertiary)] py-12">
          Нет клиентов
        </p>
      )}
      {demands.map((d) => (
        <Link key={d.id} href={`/demand/${d.id}`}>
          <DemandCard demand={d} />
        </Link>
      ))}
    </div>
  );
}

function DemandCard({ demand }: { demand: Demand }) {
  const stageLabel = KANBAN_STAGES.find(s => s.value === demand.kanban_status)?.label ?? demand.kanban_status;

  return (
    <article className="glass-card squircle-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[var(--label-primary)] truncate">{demand.buyer_name}</p>
        <Badge variant="default" className="text-xs shrink-0">{stageLabel}</Badge>
      </div>

      <p className="text-sm text-[var(--label-secondary)]">
        {formatPrice(demand.budget_min ?? 0)} – {formatPrice(demand.budget_max)}
      </p>

      {demand.districts && demand.districts.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {demand.districts.slice(0, 3).map(d => (
            <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-[var(--fill-tertiary)] text-[var(--label-secondary)]">{d}</span>
          ))}
        </div>
      )}

      {demand.payment_forms && demand.payment_forms.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {demand.payment_forms.map(p => (
            <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-[var(--ios-blue)]/10 text-[var(--ios-blue)]">
              {PAYMENT_LABELS[p] ?? p}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function DemandKanban({ demands }: { demands: Demand[] }) {
  const updateStatus = useUpdateDemandStatus();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const demand = demands.find(d => d.id === active.id);
    if (!demand) return;
    updateStatus.mutate({ id: demand.id, status: over.id as string });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4">
        {KANBAN_STAGES.map((stage) => {
          const stageDemands = demands.filter(d => d.kanban_status === stage.value);
          return (
            <div key={stage.value} className="flex-shrink-0 w-64">
              <div className="glass-card squircle-card p-3 mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--label-primary)]">{stage.label}</span>
                <span className="text-xs text-[var(--label-tertiary)] w-5 h-5 rounded-full bg-[var(--fill-secondary)] flex items-center justify-center">
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
                      <article className="glass-card squircle-card p-3 cursor-grab active:cursor-grabbing">
                        <p className="text-sm font-semibold text-[var(--label-primary)] truncate">{demand.buyer_name}</p>
                        <p className="text-xs text-[var(--label-secondary)] mt-1">
                          до {formatPrice(demand.budget_max)}
                        </p>
                        {demand.districts && demand.districts.length > 0 && (
                          <p className="text-xs text-[var(--label-tertiary)] mt-1 truncate">
                            {demand.districts.join(', ')}
                          </p>
                        )}
                        {demand.payment_forms && demand.payment_forms.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-1.5">
                            {demand.payment_forms.slice(0, 2).map(p => (
                              <span key={p} className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--ios-blue)]/10 text-[var(--ios-blue)]">
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
          className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
            active.includes(opt)
              ? 'bg-[var(--ios-blue)] text-white'
              : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
          }`}
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
      {/* Search */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">Поиск</label>
        <input
          type="text"
          placeholder="Имя или телефон..."
          className="w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none"
          value={local.q ?? ''}
          onChange={e => set('q', e.target.value || undefined)}
        />
      </div>

      {/* Budget max */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">Бюджет до, ₽</label>
        <input
          type="number"
          placeholder="Максимальный бюджет"
          className="w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none"
          value={local.budget_max ?? ''}
          onChange={e => set('budget_max', e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>

      {/* Kanban stage */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">Стадия</label>
        <div className="flex gap-2 flex-wrap">
          {KANBAN_STAGES.map(stage => (
            <button
              key={stage.value}
              onClick={() => set('kanban_status', local.kanban_status === stage.value ? undefined : stage.value)}
              className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                local.kanban_status === stage.value
                  ? 'bg-[var(--ios-blue)] text-white'
                  : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Districts */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">Районы</label>
        <ChipToggle
          options={DISTRICTS}
          active={(local.districts ?? []) as string[]}
          onToggle={(d) => set('districts', toggleArr(local.districts, d))}
        />
      </div>

      {/* Payment forms */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">Форма оплаты</label>
        <ChipToggle
          options={Object.keys(PAYMENT_LABELS)}
          active={(local.payment_forms ?? []) as string[]}
          onToggle={(p) => set('payment_forms', toggleArr(local.payment_forms, p))}
          labelFn={(p) => PAYMENT_LABELS[p] ?? p}
        />
      </div>

      {/* Repair types */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide">Ремонт</label>
        <ChipToggle
          options={Object.keys(REPAIR_LABELS)}
          active={(local.repair_types ?? []) as string[]}
          onToggle={(r) => set('repair_types', toggleArr(local.repair_types, r))}
          labelFn={(r) => REPAIR_LABELS[r] ?? r}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={() => { setLocal({}); onChange({}); onClose(); }}>
          Сбросить
        </Button>
        <Button className="flex-1" onClick={() => { onChange(local); onClose(); }}>
          Применить
        </Button>
      </div>
    </div>
  );
}
