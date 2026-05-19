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

  const greeting = getGreeting();

  return (
    <>
      <GlassNavBar title="Главная" />

      <div className="px-4 py-6 flex flex-col gap-6">
        {/* Greeting */}
        <div>
          <p className="text-[var(--label-secondary)] text-sm">{greeting}</p>
          <h2 className="text-2xl font-bold text-[var(--label-primary)]">
            {user?.full_name?.split(' ')[0] ?? 'Агент'}
          </h2>
        </div>

        {/* KPI grid */}
        <section>
          <h3 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
            Показатели
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <PermissionGate permission="can_see_financials">
              <KPIWidget
                label="Оборот"
                value={summary ? formatPrice(summary.gross_commission) : '—'}
                icon={<TrendingUp className="w-4 h-4" />}
                className="col-span-2"
              />
            </PermissionGate>

            <KPIWidget
              label="Объектов"
              value={propertiesPage?.total ?? '—'}
              icon={<Building2 className="w-4 h-4" />}
            />
            <KPIWidget
              label="Клиентов"
              value={demands?.length ?? '—'}
              icon={<Users className="w-4 h-4" />}
            />
            <KPIWidget
              label="Сделок"
              value={summary?.closed_count ?? '—'}
              icon={<Handshake className="w-4 h-4" />}
              className="col-span-2"
            />
          </div>
        </section>

        {/* Stale leads notice */}
        {demands && demands.filter(d => d.kanban_status === 'new').length > 0 && (
          <section className="glass-card squircle-card p-4">
            <p className="text-sm font-semibold text-[var(--label-primary)]">
              Новые клиенты
            </p>
            <p className="text-xs text-[var(--label-secondary)] mt-1">
              {demands.filter(d => d.kanban_status === 'new').length} заявок ожидают обработки
            </p>
          </section>
        )}
      </div>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Доброй ночи,';
  if (h < 12) return 'Доброе утро,';
  if (h < 18) return 'Добрый день,';
  return 'Добрый вечер,';
}
