'use client';

import Link from 'next/link';
import { TrendingUp, Building2, Users, Handshake, ArrowRight, Zap, Target, Clock } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useDealsSummary } from '@/lib/hooks/queries/useDeals';
import { useProperties } from '@/lib/hooks/queries/useProperties';
import { useDemands } from '@/lib/hooks/queries/useDemands';
import { KPIWidget } from '@/components/molecules/KPIWidget';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { formatPrice } from '@/lib/utils/format';

export default function DashboardPage() {
  const user   = useAppStore(s => s.user);
  const { data: summary }        = useDealsSummary();
  const { data: propertiesPage } = useProperties({ page: 1, limit: 1 });
  const { data: demands }        = useDemands();

  const newLeads    = demands?.filter(d => d.kanban_status === 'new').length ?? 0;
  const activeDeals = demands?.filter(
    d => d.kanban_status !== 'new' && d.kanban_status !== 'deal',
  ).length ?? 0;

  return (
    <>
      {/* Mobile-only nav bar */}
      <GlassNavBar
        title={getGreeting()}
        large
        subtitle={user?.full_name ?? 'Агент'}
        showSafeToggle
      />

      <div className="gradient-mesh min-h-full page-enter">
        <div className="px-4 pt-3 pb-8 flex flex-col gap-4">

          {/* ── KPI Grid ──────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <PermissionGate permission="can_see_financials">
              <KPIWidget
                label="Оборот комиссий"
                value={summary ? formatPrice(summary.gross_commission) : '—'}
                icon={<TrendingUp size={17} />}
                tint="blue"
                className="col-span-2"
              />
            </PermissionGate>

            <KPIWidget
              label="Объектов"
              value={propertiesPage?.total ?? '—'}
              icon={<Building2 size={17} />}
              tint="indigo"
            />
            <KPIWidget
              label="Клиентов"
              value={demands?.length ?? '—'}
              icon={<Users size={17} />}
              tint="purple"
            />
            <KPIWidget
              label="Закрыто сделок"
              value={summary?.closed_count ?? '—'}
              icon={<Handshake size={17} />}
              tint="teal"
              className="col-span-2"
            />
          </div>

          {/* ── Burning tasks strip ────────────────────── */}
          {(newLeads > 0 || activeDeals > 0) && (
            <div className="flex flex-col gap-2">
              <p className="section-label px-1">Срочно</p>

              {newLeads > 0 && (
                <Link href="/demand">
                  <div
                    className="squircle-card px-4 py-4 flex items-center gap-3 press-scale float-up"
                    style={{
                      background: 'rgba(255,149,0,0.08)',
                      border:     '1px solid rgba(255,149,0,0.22)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[13px] flex items-center justify-center pulse-neon flex-shrink-0"
                      style={{ background: 'rgba(255,149,0,0.16)', '--neon-blue': '#FF9500' } as React.CSSProperties}
                    >
                      <Zap size={18} style={{ color: 'var(--ios-orange)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                        Новые заявки
                      </p>
                      <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                        {newLeads} клиент{newLeads === 1 ? '' : newLeads < 5 ? 'а' : 'ов'} ожидают обработки
                      </p>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--ios-orange)', flexShrink: 0 }} />
                  </div>
                </Link>
              )}

              {activeDeals > 0 && (
                <Link href="/demand">
                  <div
                    className="squircle-card px-4 py-4 flex items-center gap-3 press-scale float-up"
                    style={{
                      background: 'rgba(79,117,255,0.07)',
                      border:     '1px solid rgba(79,117,255,0.18)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(79,117,255,0.14)' }}
                    >
                      <Target size={18} style={{ color: 'var(--neon-blue)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                        В работе
                      </p>
                      <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                        {activeDeals} сделк{activeDeals === 1 ? 'а' : activeDeals < 5 ? 'и' : 'и'} в процессе
                      </p>
                    </div>
                    <ArrowRight size={16} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* ── Quick actions grid ─────────────────────── */}
          <div>
            <p className="section-label px-1">Быстрые действия</p>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                href="/properties/new"
                label="Добавить объект"
                icon={<Building2 size={20} />}
                color="var(--neon-blue)"
                glow="rgba(79,117,255,0.40)"
              />
              <QuickAction
                href="/demand/new"
                label="Новый клиент"
                icon={<Users size={20} />}
                color="var(--neon-purple)"
                glow="rgba(200,75,255,0.38)"
              />
              <QuickAction
                href="/properties"
                label="Все объекты"
                icon={<Building2 size={20} />}
                color="var(--neon-teal)"
                glow="rgba(6,239,197,0.35)"
              />
              <QuickAction
                href="/deals"
                label="Сделки"
                icon={<Handshake size={20} />}
                color="var(--ios-green)"
                glow="rgba(52,199,89,0.35)"
              />
            </div>
          </div>

          {/* ── Pipeline summary bar ───────────────────── */}
          {summary && (
            <PermissionGate permission="can_see_financials">
              <PipelineBar
                closed={summary.closed_count ?? 0}
                active={activeDeals}
                new_={newLeads}
              />
            </PermissionGate>
          )}

        </div>
      </div>
    </>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function QuickAction({
  href, label, icon, color, glow,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
}) {
  return (
    <Link href={href}>
      <div
        className="squircle-card p-4 flex flex-col gap-3 press-scale float-up"
        style={{
          background: 'var(--bg-elevated)',
          border:     '1px solid var(--separator)',
          boxShadow:  'var(--shadow-card)',
        }}
      >
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{
            background: `${color}18`,
            color,
            boxShadow:  `0 0 14px ${glow}`,
          }}
        >
          {icon}
        </div>
        <span className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>
          {label}
        </span>
      </div>
    </Link>
  );
}

function PipelineBar({ closed, active, new_ }: { closed: number; active: number; new_: number }) {
  const total = closed + active + new_ || 1;
  const segments = [
    { label: 'Закрыто',  value: closed, color: 'var(--neon-teal)',   glow: 'rgba(6,239,197,0.55)'  },
    { label: 'В работе', value: active, color: 'var(--neon-blue)',   glow: 'rgba(79,117,255,0.55)' },
    { label: 'Новые',    value: new_,   color: 'var(--ios-orange)',  glow: 'rgba(255,149,0,0.55)'  },
  ];

  return (
    <div
      className="squircle-card p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
    >
      <p className="section-label">Воронка</p>

      {/* Segmented bar */}
      <div className="flex h-[6px] rounded-full overflow-hidden gap-[2px]">
        {segments.map(s => (
          <div
            key={s.label}
            style={{
              flex:       s.value / total,
              background: s.color,
              boxShadow:  `0 0 8px ${s.glow}`,
              borderRadius: '4px',
              minWidth:   s.value > 0 ? '6px' : '0',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: s.color, boxShadow: `0 0 6px ${s.glow}` }}
            />
            <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
              {s.label}
            </span>
            <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--label-secondary)' }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
