'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  TrendingUp, Building2, Users, Handshake, ArrowRight,
  Zap, Target, Plus, BarChart3, ClipboardList,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store/useAppStore';
import { useDealsSummary } from '@/lib/hooks/queries/useDeals';
import { useProperties } from '@/lib/hooks/queries/useProperties';
import { useDemands } from '@/lib/hooks/queries/useDemands';
import { analyticsApi } from '@/lib/api/analytics';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { formatPrice } from '@/lib/utils/format';

const PERIOD_OPTIONS = [
  { value: 'day',     label: 'Сегодня'   },
  { value: 'week',    label: 'Неделя'    },
  { value: 'month',   label: 'Месяц'     },
  { value: 'quarter', label: 'Квартал'   },
  { value: 'year',    label: 'Год'       },
  { value: 'all',     label: 'Всё время' },
] as const;

interface ReportStats {
  period: string;
  from_date: string;
  to_date: string;
  contacts: number;
  clients: number;
  properties: number;
  deals: number;
  activity: { event_type: string; description: string; created_at: string; user_name?: string }[];
}

export default function DashboardPage() {
  const user                      = useAppStore(s => s.user);
  const { data: summary }         = useDealsSummary();
  const { data: propertiesPage }  = useProperties({ page: 1, limit: 1 });
  const { data: demands }         = useDemands();
  const [period, setPeriod]       = useState<string>('month');

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: analyticsApi.dashboard,
    staleTime: 5 * 60 * 1000,
  });

  const { data: reportStats } = useQuery({
    queryKey: ['analytics-reports', period],
    queryFn: () => analyticsApi.reports(period) as Promise<ReportStats>,
    staleTime: 2 * 60 * 1000,
  });

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
        <div className="px-4 pt-4 pb-10 flex flex-col gap-4 md:px-6 md:pt-6">

          {/* ── Desktop welcome ── */}
          <div className="hidden md:block">
            <h2
              className="text-[26px] font-bold tracking-tight"
              style={{ color: 'var(--label-primary)', fontFamily: 'var(--font-heading), sans-serif' }}
            >
              {getGreeting()}, {user?.full_name?.split(' ')[0] ?? 'Агент'} 👋
            </h2>
            <p className="text-[14px] mt-0.5" style={{ color: 'var(--label-tertiary)' }}>
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* ── 12-col desktop grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

            {/* Hero — commission turnover (8 cols) */}
            <PermissionGate permission="can_see_financials">
              <div className="md:col-span-8">
                <HeroCard
                  label="Оборот комиссий"
                  value={summary ? formatPrice(summary.gross_commission) : '—'}
                  sub={`${summary?.closed_count ?? 0} сделок закрыто`}
                />
              </div>
            </PermissionGate>

            {/* Urgent leads — pulsing amber (4 cols) */}
            <div className="md:col-span-4">
              <UrgentCard newLeads={newLeads} activeDeals={activeDeals} />
            </div>

            {/* 4 metric cards — 3+3+3+3 */}
            <div className="md:col-span-3">
              <MetricCard
                label="Объектов"
                value={propertiesPage?.total ?? '—'}
                icon={<Building2 size={18} />}
                color="var(--neon-blue)"
                bg="rgba(99,102,241,0.12)"
                glow="rgba(99,102,241,0.40)"
              />
            </div>
            <div className="md:col-span-3">
              <MetricCard
                label="Клиентов"
                value={demands?.length ?? '—'}
                icon={<Users size={18} />}
                color="var(--neon-purple)"
                bg="rgba(139,92,246,0.12)"
                glow="rgba(139,92,246,0.38)"
              />
            </div>
            <div className="md:col-span-3">
              <MetricCard
                label="Закрыто сделок"
                value={summary?.closed_count ?? '—'}
                icon={<Handshake size={18} />}
                color="var(--neon-teal)"
                bg="rgba(6,239,197,0.10)"
                glow="rgba(6,239,197,0.35)"
              />
            </div>
            <div className="md:col-span-3">
              <MetricCard
                label="Задач выполнено"
                value={analyticsData ? `${analyticsData.task_completion_pct}%` : '—'}
                icon={<ClipboardList size={18} />}
                color="var(--ios-green)"
                bg="rgba(52,199,89,0.12)"
                glow="rgba(52,199,89,0.38)"
              />
            </div>

            {/* Pipeline bar (12 cols) */}
            {summary && (
              <PermissionGate permission="can_see_financials">
                <div className="md:col-span-12">
                  <PipelineBar
                    closed={summary.closed_count ?? 0}
                    active={activeDeals}
                    new_={newLeads}
                  />
                </div>
              </PermissionGate>
            )}

            {/* Quick actions (12 cols) */}
            <div className="md:col-span-12">
              <p className="section-label px-0.5 mb-3">Быстрые действия</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickAction
                  href="/properties/new"
                  label="Добавить объект"
                  icon={<Plus size={19} />}
                  color="var(--neon-blue)"
                  glow="rgba(99,102,241,0.42)"
                />
                <QuickAction
                  href="/clients/new"
                  label="Новый клиент"
                  icon={<Users size={19} />}
                  color="var(--neon-purple)"
                  glow="rgba(139,92,246,0.40)"
                />
                <QuickAction
                  href="/properties"
                  label="Все объекты"
                  icon={<Building2 size={19} />}
                  color="var(--cyber-cyan)"
                  glow="rgba(6,182,212,0.38)"
                />
                <QuickAction
                  href="/deals"
                  label="Сделки"
                  icon={<BarChart3 size={19} />}
                  color="var(--neon-teal)"
                  glow="rgba(6,239,197,0.35)"
                />
              </div>
            </div>

            {/* ── Отчёты ── */}
            <div className="md:col-span-12">
              <div className="flex items-center justify-between mb-3">
                <p className="section-label px-0.5 mb-0">Отчёты</p>
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {PERIOD_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setPeriod(opt.value)}
                      className={`chip text-[12px] py-1 px-2.5 flex-shrink-0 press-scale ${period === opt.value ? 'chip-active' : ''}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {reportStats && (
                <>
                  {reportStats.from_date && (
                    <p className="text-[12px] mb-3" style={{ color: 'var(--label-tertiary)' }}>
                      {new Date(reportStats.from_date).toLocaleDateString('ru-RU')} — {new Date(reportStats.to_date).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {([
                      { label: 'Новые клиенты', value: reportStats.clients,    color: 'var(--neon-purple)', icon: <Users size={16} /> },
                      { label: 'Объекты',        value: reportStats.properties, color: 'var(--neon-blue)',   icon: <Building2 size={16} /> },
                      { label: 'Сделки',          value: reportStats.deals,      color: 'var(--neon-teal)',   icon: <Handshake size={16} /> },
                      { label: 'Активности',      value: reportStats.contacts,   color: 'var(--ios-orange)', icon: <ClipboardList size={16} /> },
                    ] as const).map(({ label, value, color, icon }) => (
                      <div key={label} className="squircle-card p-4"
                        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span style={{ color }}>{icon}</span>
                          <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>{label}</p>
                        </div>
                        <p className="text-[24px] font-bold tabular-nums" style={{ color: 'var(--label-primary)' }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {reportStats.activity.length > 0 && (
                    <div className="squircle-card p-4"
                      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
                      <p className="section-label mb-2">История действий</p>
                      <div className="flex flex-col gap-0">
                        {reportStats.activity.slice(0, 10).map((e, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 py-2"
                            style={{ borderBottom: i < reportStats.activity.slice(0,10).length - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                            <div className="min-w-0">
                              <p className="text-[13px]" style={{ color: 'var(--label-primary)' }}>{e.description}</p>
                              {e.user_name && <p className="text-[11px] mt-0.5" style={{ color: 'var(--label-tertiary)' }}>{e.user_name}</p>}
                            </div>
                            <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--label-tertiary)' }}>
                              {new Date(e.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ──────────────────────────────────── */

function HeroCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="squircle-card-lg p-6 flex flex-col gap-3 float-up h-full"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.12) 100%)',
        border:     '1px solid rgba(99,102,241,0.25)',
        boxShadow:  '0 8px 32px rgba(99,102,241,0.12), 0 0 0 1px rgba(99,102,241,0.08) inset',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'rgba(99,102,241,0.80)' }}>
          {label}
        </p>
        <div
          className="w-10 h-10 rounded-[13px] flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.20)', color: 'var(--neon-blue)', boxShadow: '0 0 14px rgba(99,102,241,0.38)' }}
        >
          <TrendingUp size={18} />
        </div>
      </div>
      <p
        className="text-[38px] font-bold leading-none tracking-tight tabular-nums"
        style={{ color: 'var(--label-primary)', fontFamily: 'var(--font-heading), sans-serif' }}
      >
        {value}
      </p>
      <p className="text-[13px]" style={{ color: 'var(--label-tertiary)' }}>{sub}</p>
    </div>
  );
}

function UrgentCard({ newLeads, activeDeals }: { newLeads: number; activeDeals: number }) {
  const hasUrgent = newLeads > 0 || activeDeals > 0;

  return (
    <div
      className={`squircle-card-lg p-5 flex flex-col gap-3 h-full ${hasUrgent ? 'pulse-amber' : ''}`}
      style={{
        background:  'rgba(245,158,11,0.07)',
        border:      `1px solid rgba(245,158,11,${hasUrgent ? '0.28' : '0.12'})`,
        boxShadow:   'var(--shadow-card)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'rgba(245,158,11,0.80)' }}>
          Срочно
        </p>
        <div
          className="w-9 h-9 rounded-[11px] flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
        >
          <Zap size={16} />
        </div>
      </div>

      {hasUrgent ? (
        <div className="flex flex-col gap-2 flex-1">
          {newLeads > 0 && (
            <Link href="/clients">
              <div
                className="flex items-center gap-2 p-3 rounded-[12px] press-scale"
                style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.18)' }}
              >
                <Zap size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                    {newLeads} новых заявк{newLeads === 1 ? 'а' : newLeads < 5 ? 'и' : 'ок'}
                  </p>
                </div>
                <ArrowRight size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />
              </div>
            </Link>
          )}
          {activeDeals > 0 && (
            <Link href="/clients">
              <div
                className="flex items-center gap-2 p-3 rounded-[12px] press-scale"
                style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)' }}
              >
                <Target size={14} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                    {activeDeals} сделок в работе
                  </p>
                </div>
                <ArrowRight size={13} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
              </div>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-center" style={{ color: 'var(--label-tertiary)' }}>
            Нет срочных задач
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label, value, icon, color, bg, glow,
}: {
  label: string; value: string | number;
  icon: React.ReactNode; color: string; bg: string; glow: string;
}) {
  return (
    <div
      className="squircle-card p-5 flex flex-col gap-3 float-up"
      style={{
        background: 'var(--bg-elevated)',
        border:     '1px solid var(--separator)',
        boxShadow:  'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--label-tertiary)' }}>
          {label}
        </p>
        <span
          className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
          style={{ background: bg, color, boxShadow: `0 0 14px ${glow}` }}
        >
          {icon}
        </span>
      </div>
      <span
        className="text-[32px] font-bold leading-none tabular-nums tracking-tight"
        style={{ color: 'var(--label-primary)', fontFamily: 'var(--font-heading), sans-serif' }}
      >
        {value}
      </span>
    </div>
  );
}

function QuickAction({
  href, label, icon, color, glow,
}: {
  href: string; label: string; icon: React.ReactNode; color: string; glow: string;
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
          style={{ background: `${color}18`, color, boxShadow: `0 0 14px ${glow}` }}
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
    { label: 'В работе', value: active, color: 'var(--neon-blue)',   glow: 'rgba(99,102,241,0.55)' },
    { label: 'Новые',    value: new_,   color: 'var(--neon-orange)', glow: 'rgba(245,158,11,0.55)' },
  ];

  return (
    <div
      className="squircle-card p-5 flex flex-col gap-4"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center justify-between">
        <p className="section-label mb-0">Воронка продаж</p>
        <p className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
          {total} всего
        </p>
      </div>

      {/* Segmented bar */}
      <div className="flex h-[7px] rounded-full overflow-hidden gap-[2px]">
        {segments.map(s => (
          <div
            key={s.label}
            style={{
              flex:         s.value / total,
              background:   s.color,
              boxShadow:    `0 0 8px ${s.glow}`,
              borderRadius: '4px',
              minWidth:     s.value > 0 ? '6px' : '0',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-5">
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
