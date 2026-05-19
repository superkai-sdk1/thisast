'use client';

import Link from 'next/link';
import { TrendingUp, CheckCircle2, Clock, Plus } from 'lucide-react';
import { useDeals, useDealsSummary } from '@/lib/hooks/queries/useDeals';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { KPIWidget } from '@/components/molecules/KPIWidget';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { Badge } from '@/components/atoms/Badge';
import { formatPrice, formatDate } from '@/lib/utils/format';
import type { Deal } from '@crm/shared-types';

export default function DealsPage() {
  const { data: summary } = useDealsSummary();
  const { data: deals = [] } = useDeals();

  const closed     = deals.filter(d => d.status === 'closed');
  const inProgress = deals.filter(d => d.status === 'in_progress');

  return (
    <>
      <GlassNavBar
        title="Сделки"
        right={
          <Link href="/deals/new" className="p-2 text-[var(--ios-blue)]">
            <Plus className="w-5 h-5" />
          </Link>
        }
      />

      <div className="px-4 py-6 flex flex-col gap-6">
        {/* Summary KPIs */}
        <PermissionGate permission="can_see_financials">
          <section>
            <h3 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
              Финансы
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <KPIWidget
                label="Оборот"
                value={summary ? formatPrice(summary.gross_commission) : '—'}
                icon={<TrendingUp className="w-4 h-4" />}
                className="col-span-2"
              />
              <KPIWidget
                label="Чистая комиссия"
                value={summary ? formatPrice(summary.net_commission) : '—'}
              />
              <KPIWidget
                label="Сделок закрыто"
                value={summary?.closed_count ?? '—'}
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
            </div>
          </section>
        </PermissionGate>

        {/* In-progress */}
        {inProgress.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
              В работе ({inProgress.length})
            </h3>
            <div className="flex flex-col gap-3">
              {inProgress.map(d => <DealCard key={d.id} deal={d} />)}
            </div>
          </section>
        )}

        {/* Closed */}
        {closed.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
              Закрытые ({closed.length})
            </h3>
            <div className="flex flex-col gap-3">
              {closed.map(d => <DealCard key={d.id} deal={d} />)}
            </div>
          </section>
        )}

        {deals.length === 0 && (
          <p className="text-center text-sm text-[var(--label-tertiary)] py-12">Нет сделок</p>
        )}
      </div>
    </>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <article className="glass-card squircle-card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--label-primary)]">
            {deal.external_address ?? `Объект #${deal.property_id?.slice(0, 8)}`}
          </p>
          {deal.deal_price && (
            <p className="text-xs text-[var(--label-secondary)] mt-0.5">
              {formatPrice(deal.deal_price)}
            </p>
          )}
        </div>
        <Badge variant={deal.status === 'closed' ? 'success' : 'default'} className="text-xs shrink-0">
          {deal.status === 'closed' ? (
            <><CheckCircle2 className="w-3 h-3" /> Закрыта</>
          ) : (
            <><Clock className="w-3 h-3" /> В работе</>
          )}
        </Badge>
      </div>

      <PermissionGate permission="can_see_financials">
        {deal.my_commission && (
          <p className="text-xs text-[var(--ios-green)] font-semibold">
            Комиссия: {formatPrice(deal.my_commission)}
          </p>
        )}
      </PermissionGate>

      {deal.closed_at && (
        <p className="text-xs text-[var(--label-tertiary)]">
          Закрыта {formatDate(deal.closed_at)}
        </p>
      )}
    </article>
  );
}
