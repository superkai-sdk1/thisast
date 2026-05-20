'use client';

import Link from 'next/link';
import { TrendingUp, CheckCircle2, Clock, Plus, Handshake } from 'lucide-react';
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
          <Link href="/deals/new"
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}>
            <Plus size={20} />
          </Link>
        }
      />

      <div className="gradient-mesh min-h-full">
        <div className="px-4 pt-3 pb-6 flex flex-col gap-5">

          {/* Summary KPIs */}
          <PermissionGate permission="can_see_financials">
            <div className="grid grid-cols-2 gap-3">
              <KPIWidget
                label="Оборот комиссий"
                value={summary ? formatPrice(summary.gross_commission) : '—'}
                icon={<TrendingUp size={17} />}
                tint="blue"
                className="col-span-2"
              />
              <KPIWidget
                label="Чистая комиссия"
                value={summary ? formatPrice(summary.net_commission) : '—'}
                tint="green"
                icon={<TrendingUp size={17} />}
              />
              <KPIWidget
                label="Закрыто"
                value={summary?.closed_count ?? '—'}
                tint="purple"
                icon={<CheckCircle2 size={17} />}
              />
            </div>
          </PermissionGate>

          {/* In-progress */}
          {inProgress.length > 0 && (
            <section>
              <p className="section-label px-1">В работе ({inProgress.length})</p>
              <div className="flex flex-col gap-3">
                {inProgress.map(d => <DealCard key={d.id} deal={d} />)}
              </div>
            </section>
          )}

          {/* Closed */}
          {closed.length > 0 && (
            <section>
              <p className="section-label px-1">Закрытые ({closed.length})</p>
              <div className="flex flex-col gap-3">
                {closed.map(d => <DealCard key={d.id} deal={d} />)}
              </div>
            </section>
          )}

          {deals.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center"
                style={{ background: 'var(--fill-tertiary)' }}>
                <Handshake size={28} style={{ color: 'var(--label-tertiary)' }} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>Сделок пока нет</p>
                <p className="text-[13px] mt-1" style={{ color: 'var(--label-tertiary)' }}>Создайте первую сделку</p>
              </div>
              <Link href="/deals/new">
                <div className="mt-2 px-5 h-9 rounded-[14px] flex items-center gap-2 text-[13px] font-semibold text-white press-scale"
                  style={{ background: 'var(--ios-blue)' }}>
                  <Plus size={15} />
                  Новая сделка
                </div>
              </Link>
            </div>
          )}

        </div>
      </div>

      <Link href="/deals/new" className="fab" aria-label="Новая сделка">
        <Plus size={24} strokeWidth={2.2} />
      </Link>
    </>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const isClosed = deal.status === 'closed';

  return (
    <article
      className="squircle-card overflow-hidden press-scale"
      style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
    >
      {/* Status stripe */}
      <div className="h-1 w-full" style={{
        background: isClosed
          ? 'linear-gradient(90deg, var(--ios-green), rgba(52,199,89,0.3))'
          : 'linear-gradient(90deg, var(--ios-blue), rgba(0,122,255,0.3))',
      }} />

      <div className="p-4 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
              {deal.external_address ?? `Объект #${deal.property_id?.slice(0, 8) ?? '—'}`}
            </p>
            {deal.deal_price && (
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                {formatPrice(deal.deal_price)}
              </p>
            )}
          </div>
          <Badge variant={isClosed ? 'success' : 'info'} size="sm">
            {isClosed ? (
              <span className="flex items-center gap-1"><CheckCircle2 size={10} /> Закрыта</span>
            ) : (
              <span className="flex items-center gap-1"><Clock size={10} /> В работе</span>
            )}
          </Badge>
        </div>

        <PermissionGate permission="can_see_financials">
          {deal.my_commission && (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} style={{ color: 'var(--ios-green)' }} />
              <span className="text-[13px] font-semibold" style={{ color: 'var(--ios-green)' }}>
                Комиссия: {formatPrice(deal.my_commission)}
              </span>
            </div>
          )}
        </PermissionGate>

        {deal.closed_at && (
          <p className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
            Закрыта {formatDate(deal.closed_at)}
          </p>
        )}
      </div>
    </article>
  );
}
