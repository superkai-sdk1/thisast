'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { analyticsApi } from '@/lib/api/analytics';
import { formatPrice } from '@/lib/utils/format';
import { BarChart2, TrendingUp, Users, Building2, Handshake, ClipboardList } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'day',     label: 'Сегодня'   },
  { value: 'week',    label: 'Неделя'    },
  { value: 'month',   label: 'Месяц'     },
  { value: 'quarter', label: 'Квартал'   },
  { value: 'year',    label: 'Год'       },
  { value: 'all',     label: 'Всё время' },
] as const;

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-reports', period],
    queryFn: () => analyticsApi.reports(period),
  });

  return (
    <>
      <GlassNavBar title="Отчёты" />

      {/* Period selector */}
      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-10 glass-nav border-b-0 px-4 py-2.5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`chip flex-shrink-0 press-scale ${period === opt.value ? 'chip-active' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="gradient-mesh min-h-full">
        <div className="px-4 py-4 pb-10 flex flex-col gap-4">

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
            </div>
          ) : stats ? (
            <>
              {/* Period header */}
              {stats.period && (
                <p className="text-[13px]" style={{ color: 'var(--label-tertiary)' }}>
                  {new Date(stats.period.from).toLocaleDateString('ru-RU')} — {new Date(stats.period.to).toLocaleDateString('ru-RU')}
                </p>
              )}

              {/* Clients block */}
              {stats.clients && (
                <ReportSection title="Клиенты" icon={<Users size={16} />}>
                  <StatGrid>
                    <StatItem label="Всего" value={stats.clients.total} />
                    <StatItem label="Покупатели" value={stats.clients.buyers} />
                    <StatItem label="Продавцы" value={stats.clients.sellers} />
                    <StatItem label="Арендаторы" value={stats.clients.renters} />
                    <StatItem label="Арендодатели" value={stats.clients.landlords} />
                  </StatGrid>
                </ReportSection>
              )}

              {/* Properties block */}
              {stats.properties && (
                <ReportSection title="Объекты" icon={<Building2 size={16} />}>
                  <StatGrid>
                    <StatItem label="Всего" value={stats.properties.total} />
                    <StatItem label="Квартиры" value={stats.properties.apartments} />
                    <StatItem label="Дома" value={stats.properties.houses} />
                    <StatItem label="Участки" value={stats.properties.lands} />
                    <StatItem label="На продажу" value={stats.properties.for_sale} />
                    <StatItem label="В аренду" value={stats.properties.for_rent} />
                  </StatGrid>
                </ReportSection>
              )}

              {/* Deals block */}
              {stats.deals && (
                <ReportSection title="Сделки" icon={<Handshake size={16} />}>
                  <StatGrid>
                    <StatItem label="Всего" value={stats.deals.total} />
                    <StatItem label="Закрыто" value={stats.deals.closed} />
                    <StatItem label="Комиссии" value={formatPrice(Number(stats.deals.commissions ?? 0))} />
                    <StatItem
                      label="Конверсия"
                      value={stats.deals.total > 0 ? `${Math.round((stats.deals.closed / stats.deals.total) * 100)}%` : '0%'}
                    />
                  </StatGrid>
                </ReportSection>
              )}

              {/* Contacts block */}
              {stats.contacts && (
                <ReportSection title="Контакты" icon={<ClipboardList size={16} />}>
                  <StatGrid>
                    <StatItem label="Действий" value={stats.contacts.total} />
                  </StatGrid>
                </ReportSection>
              )}

              {/* Activity history */}
              {stats.activity && (stats.activity as ActivityEvent[]).length > 0 && (
                <ReportSection title="История действий" icon={<TrendingUp size={16} />}>
                  <div className="flex flex-col gap-2 mt-1">
                    {(stats.activity as ActivityEvent[]).map((e, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 py-2"
                        style={{ borderBottom: '0.5px solid var(--separator)' }}>
                        <div className="min-w-0">
                          <p className="text-[13px]" style={{ color: 'var(--label-primary)' }}>{e.description}</p>
                          {e.user_name && (
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--label-tertiary)' }}>{e.user_name}</p>
                          )}
                        </div>
                        <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--label-tertiary)' }}>
                          {new Date(e.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    ))}
                  </div>
                </ReportSection>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16">
              <BarChart2 size={40} style={{ color: 'var(--label-tertiary)' }} />
              <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>Нет данных</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

interface ActivityEvent {
  event_type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

function ReportSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="squircle-card p-4"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: 'var(--ios-blue)' }}>{icon}</span>
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>;
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] mb-0.5" style={{ color: 'var(--label-tertiary)' }}>{label}</p>
      <p className="text-[22px] font-bold" style={{ color: 'var(--label-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {String(value ?? '0')}
      </p>
    </div>
  );
}
