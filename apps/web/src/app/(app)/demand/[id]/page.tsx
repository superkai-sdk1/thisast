'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageSquare, Phone, Eye } from 'lucide-react';
import { useDemand, useDemandMatches, useDemandActivity } from '@/lib/hooks/queries/useDemands';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';
import { KANBAN_STAGES } from '@crm/shared-types';
import type { Demand } from '@crm/shared-types';
import { demandsApi } from '@/lib/api/demands';
import { useQueryClient } from '@tanstack/react-query';
import { demandKeys } from '@/lib/hooks/queries/useDemands';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default function DemandDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: demand, isLoading } = useDemand(id);
  const { data: matches = [] } = useDemandMatches(id);
  const { data: activity = [] } = useDemandActivity(id);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState<'note' | 'call' | 'viewing'>('note');
  const [activityBody, setActivityBody] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--ios-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!demand) return null;

  const stageLabel = KANBAN_STAGES.find(s => s.value === demand.kanban_status)?.label ?? demand.kanban_status;

  async function addActivity() {
    if (!activityBody.trim()) return;
    await demandsApi.addActivity(id, activityType, activityBody);
    setActivityBody('');
    setActivityOpen(false);
    qc.invalidateQueries({ queryKey: demandKeys.activity(id) });
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="glass-nav sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()} className="text-[var(--ios-blue)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[var(--label-primary)] truncate max-w-[60%]">
            {demand.buyer_name}
          </h1>
          <Badge variant="default" className="text-xs">{stageLabel}</Badge>
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Main info */}
        <section className="glass-card squircle-card p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-y-3">
            <InfoRow label="Бюджет" value={`${formatPrice(demand.budget_min ?? 0)} – ${formatPrice(demand.budget_max)}`} />
            <InfoRow label="Тип" value={demand.property_type} />
            {demand.rooms && demand.rooms.length > 0 && (
              <InfoRow label="Комнат" value={demand.rooms.join(', ')} />
            )}
            {demand.districts && demand.districts.length > 0 && (
              <InfoRow label="Районы" value={demand.districts.join(', ')} />
            )}
          </div>
        </section>

        {/* Contact */}
        <section className="flex gap-3">
          <a href={`tel:${demand.buyer_phone}`} className="flex-1">
            <Button variant="secondary" className="w-full">
              <Phone className="w-4 h-4" />
              Позвонить
            </Button>
          </a>
          <Button variant="secondary" className="flex-1" onClick={() => setActivityOpen(true)}>
            <MessageSquare className="w-4 h-4" />
            Заметка
          </Button>
        </section>

        {/* AI Matches */}
        {matches.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[var(--label-primary)] mb-3">
              Подобранные объекты ({matches.length})
            </h2>
            <div className="flex flex-col gap-2">
              {(matches as MatchItem[]).slice(0, 5).map((m) => (
                <Link key={m.property_id} href={`/properties/${m.property_id}`}>
                  <div className="glass-card squircle-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-[var(--label-primary)]">
                          {m.property?.district ?? 'Объект'}
                        </p>
                        {m.property?.price && (
                          <p className="text-xs text-[var(--label-secondary)]">
                            {formatPrice(m.property.price)}
                          </p>
                        )}
                      </div>
                      <Badge variant="match" className="text-xs shrink-0">
                        {Math.round((m.score ?? 0) * 100)}%
                      </Badge>
                    </div>
                    {/* Score breakdown */}
                    {m.sub_scores && (
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(m.sub_scores).map(([key, val]) => (
                          <ScorePill key={key} label={SUB_SCORE_LABELS[key] ?? key} value={val as number} />
                        ))}
                      </div>
                    )}
                    {m.budget_overage && (
                      <p className="text-xs text-[var(--ios-orange)] mt-1">
                        +{formatPrice(m.budget_overage)} выше бюджета
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Activity log */}
        {activity.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[var(--label-primary)] mb-3">История</h2>
            <div className="flex flex-col gap-2">
              {(activity as ActivityItem[]).map((a) => (
                <div key={a.id} className="glass-card squircle-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ActivityIcon type={a.activity_type} />
                    <span className="text-xs text-[var(--label-tertiary)]">
                      {formatRelativeTime(a.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--label-primary)]">{a.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add activity sheet */}
      <BottomSheet isOpen={activityOpen} onClose={() => setActivityOpen(false)} title="Добавить запись">
        <div className="flex flex-col gap-4 py-2">
          <div className="flex gap-2">
            {(['note', 'call', 'viewing'] as const).map((type) => {
              const labels = { note: 'Заметка', call: 'Звонок', viewing: 'Показ' };
              return (
                <button
                  key={type}
                  onClick={() => setActivityType(type)}
                  className={`flex-1 py-2 rounded-[14px] text-sm font-medium transition-colors ${
                    activityType === type
                      ? 'bg-[var(--ios-blue)] text-white'
                      : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                  }`}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
          <textarea
            className="w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none resize-none"
            rows={4}
            placeholder="Текст заметки..."
            value={activityBody}
            onChange={e => setActivityBody(e.target.value)}
          />
          <Button onClick={addActivity} disabled={!activityBody.trim()} className="w-full">
            Сохранить
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-[var(--label-tertiary)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--label-primary)]">{String(value)}</p>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    note:    <MessageSquare className="w-3 h-3" />,
    call:    <Phone className="w-3 h-3" />,
    viewing: <Eye className="w-3 h-3" />,
  };
  return <span className="text-[var(--label-tertiary)]">{icons[type] ?? null}</span>;
}

const SUB_SCORE_LABELS: Record<string, string> = {
  budget: 'Бюджет', type: 'Тип', rooms: 'Комнаты',
  district: 'Район', area: 'Площадь', semantic: 'AI', payment: 'Оплата',
};

function ScorePill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? 'text-[var(--ios-green)]' : pct >= 40 ? 'text-[var(--ios-orange)]' : 'text-[var(--label-tertiary)]';
  return (
    <span className={`text-xs ${color} bg-[var(--fill-tertiary)] px-2 py-0.5 rounded-full`}>
      {label} {pct}%
    </span>
  );
}

interface MatchItem {
  property_id: string;
  score?: number;
  budget_overage?: number;
  sub_scores?: Record<string, number>;
  property?: { district?: string; price?: number };
}

interface ActivityItem {
  id: string;
  activity_type: string;
  body: string;
  created_at: string;
}
