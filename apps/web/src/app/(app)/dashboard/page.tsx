'use client';

import { TrendingUp, Building2, Users, Handshake } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useDealsSummary } from '@/lib/hooks/queries/useDeals';
import { useProperties } from '@/lib/hooks/queries/useProperties';
import { useDemands } from '@/lib/hooks/queries/useDemands';
import { KPIWidget } from '@/components/molecules/KPIWidget';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { formatPrice } from '@/lib/utils/format';
import { PermissionGate } from '@/components/molecules/PermissionGate';

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const { data: summary } = useDealsSummary();
  const { data: propertiesPage } = useProperties({ page: 1, limit: 1 });
  const { data: demands } = useDemands();
  const newLeads = demands?.filter(d => d.kanban_status === 'new').length ?? 0;

  return (
    <>
      <GlassNavBar
        title={getGreeting()}
        large
        subtitle={user?.full_name ?? 'Агент'}
        showSafeToggle
      />

      <div className="gradient-mesh">
        <div className="px-4 pt-2 pb-6 flex flex-col gap-3">

          <div className="grid grid-cols-2 gap-3">
            <PermissionGate permission="can_see_financials">
              <KPIWidget
                label="Оборот комиссий"
                value={summary ? formatPrice(summary.gross_commission) : '—'}
                icon={<TrendingUp size={16} />}
                tint="blue"
                className="col-span-2"
              />
            </PermissionGate>

            <KPIWidget
              label="Объектов"
              value={propertiesPage?.total ?? '—'}
              icon={<Building2 size={16} />}
              tint="indigo"
            />
            <KPIWidget
              label="Клиентов"
              value={demands?.length ?? '—'}
              icon={<Users size={16} />}
              tint="purple"
            />
            <KPIWidget
              label="Закрыто сделок"
              value={summary?.closed_count ?? '—'}
              icon={<Handshake size={16} />}
              tint="green"
              className="col-span-2"
            />
          </div>

          {newLeads > 0 && (
            <div
              className="squircle-card px-4 py-4 flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255,149,0,0.12), rgba(255,149,0,0.05))',
                border: '0.5px solid rgba(255,149,0,0.25)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,149,0,0.15)' }}>
                <Users size={17} className="text-[var(--ios-orange)]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--label-primary)]">Новые клиенты</p>
                <p className="text-[13px] text-[var(--label-secondary)] mt-0.5">
                  {newLeads} заявок ожидают обработки
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}
