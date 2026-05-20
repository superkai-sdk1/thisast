'use client';

import Link from 'next/link';
import { TrendingUp, Building2, Users, Handshake, ArrowRight, Bell } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useDealsSummary } from '@/lib/hooks/queries/useDeals';
import { useProperties } from '@/lib/hooks/queries/useProperties';
import { useDemands } from '@/lib/hooks/queries/useDemands';
import { KPIWidget } from '@/components/molecules/KPIWidget';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { formatPrice } from '@/lib/utils/format';

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const { data: summary } = useDealsSummary();
  const { data: propertiesPage } = useProperties({ page: 1, limit: 1 });
  const { data: demands } = useDemands();
  const newLeads = demands?.filter(d => d.kanban_status === 'new').length ?? 0;
  const activeDeals = demands?.filter(d => d.kanban_status !== 'new' && d.kanban_status !== 'deal').length ?? 0;

  return (
    <>
      <GlassNavBar
        title={getGreeting()}
        large
        subtitle={user?.full_name ?? 'Агент'}
        showSafeToggle
        right={
          <button className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--label-tertiary)' }}>
            <Bell size={18} strokeWidth={1.8} />
          </button>
        }
      />

      <div className="gradient-mesh">
        <div className="px-4 pt-3 pb-6 flex flex-col gap-4">

          {/* KPI Grid */}
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
              tint="green"
              className="col-span-2"
            />
          </div>

          {/* New leads alert */}
          {newLeads > 0 && (
            <Link href="/demand">
              <div
                className="squircle-card px-4 py-4 flex items-center gap-3 press-scale"
                style={{
                  background: 'rgba(255,149,0,0.10)',
                  border: '0.5px solid rgba(255,149,0,0.25)',
                  boxShadow: '0 2px 12px rgba(255,149,0,0.10)',
                }}
              >
                <div className="w-10 h-10 rounded-[13px] flex items-center justify-center"
                  style={{ background: 'rgba(255,149,0,0.18)' }}>
                  <Users size={18} style={{ color: 'var(--ios-orange)' }} />
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

          {/* Active pipeline */}
          {activeDeals > 0 && (
            <Link href="/demand">
              <div
                className="squircle-card px-4 py-4 flex items-center gap-3 press-scale"
                style={{
                  background: 'rgba(0,122,255,0.08)',
                  border: '0.5px solid rgba(0,122,255,0.18)',
                }}
              >
                <div className="w-10 h-10 rounded-[13px] flex items-center justify-center"
                  style={{ background: 'rgba(0,122,255,0.14)' }}>
                  <Handshake size={18} style={{ color: 'var(--ios-blue)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                    В работе
                  </p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                    {activeDeals} сделк{activeDeals === 1 ? 'а' : activeDeals < 5 ? 'и' : 'и'} в процессе
                  </p>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--ios-blue)', flexShrink: 0 }} />
              </div>
            </Link>
          )}

          {/* Quick actions */}
          <div>
            <p className="section-label px-1 mb-3">Быстрые действия</p>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction href="/properties/new" label="Добавить объект" icon={<Building2 size={20} />} color="var(--ios-blue)" />
              <QuickAction href="/demand/new" label="Новый клиент" icon={<Users size={20} />} color="var(--ios-purple)" />
              <QuickAction href="/properties" label="Все объекты" icon={<Building2 size={20} />} color="var(--ios-indigo)" />
              <QuickAction href="/deals" label="Сделки" icon={<Handshake size={20} />} color="var(--ios-green)" />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function QuickAction({ href, label, icon, color }: { href: string; label: string; icon: React.ReactNode; color: string }) {
  return (
    <Link href={href}>
      <div
        className="squircle-card p-4 flex flex-col gap-3 press-scale"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <span className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>
          {label}
        </span>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
