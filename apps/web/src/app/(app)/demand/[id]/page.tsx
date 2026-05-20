'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Phone, Eye, Sparkles, MapPin } from 'lucide-react';
import { useDemand, useDemandMatches, useDemandActivity } from '@/lib/hooks/queries/useDemands';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';
import { KANBAN_STAGES } from '@crm/shared-types';
import { demandsApi } from '@/lib/api/demands';
import { useQueryClient } from '@tanstack/react-query';
import { demandKeys } from '@/lib/hooks/queries/useDemands';

interface Props {
  params: Promise<{ id: string }>;
}

const STAGE_BADGES: Record<string, 'default' | 'success' | 'warning' | 'info' | 'purple'> = {
  new:         'info',
  qualifying:  'purple',
  selection:   'info',
  viewings:    'warning',
  thinking:    'default',
  negotiation: 'warning',
  deal:        'success',
};

const SUB_SCORE_LABELS: Record<string, string> = {
  budget: 'Бюджет', type: 'Тип', rooms: 'Комнаты',
  district: 'Район', area: 'Площадь', semantic: 'AI', payment: 'Оплата',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note:    <MessageSquare size={13} />,
  call:    <Phone size={13} />,
  viewing: <Eye size={13} />,
};

interface MatchItem {
  property_id: string;
  score?: number;
  budget_overage?: number;
  sub_scores?: Record<string, number>;
  property?: { district?: string; price?: number; address_street?: string };
}

interface ActivityItem {
  id: string;
  activity_type: string;
  body: string;
  created_at: string;
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
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  if (!demand) return null;

  const stageLabel = KANBAN_STAGES.find(s => s.value === demand.kanban_status)?.label ?? demand.kanban_status;
  const stageBadge = STAGE_BADGES[demand.kanban_status] ?? 'default';

  async function addActivity() {
    if (!activityBody.trim()) return;
    await demandsApi.addActivity(id, activityType, activityBody);
    setActivityBody('');
    setActivityOpen(false);
    qc.invalidateQueries({ queryKey: demandKeys.activity(id) });
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold truncate max-w-[55%]" style={{ color: 'var(--label-primary)' }}>
            {demand.buyer_name}
          </h1>
          <Badge variant={stageBadge} size="sm">{stageLabel}</Badge>
        </div>
      </div>

      <div className="gradient-mesh min-h-full">
        <div className="px-4 py-4 pb-6 flex flex-col gap-4">

          {/* Main info card */}
          <div
            className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Бюджет" value={`${formatPrice(demand.budget_min ?? 0)} — ${formatPrice(demand.budget_max)}`} />
              <InfoRow label="Тип" value={demand.property_type ?? '—'} />
              {demand.rooms && demand.rooms.length > 0 && (
                <InfoRow label="Комнат" value={demand.rooms.join(', ')} />
              )}
              {demand.districts && demand.districts.length > 0 && (
                <InfoRow label="Районы" value={demand.districts.join(', ')} />
              )}
              {demand.area_min && demand.area_max && (
                <InfoRow label="Площадь" value={`${demand.area_min}–${demand.area_max} м²`} />
              )}
            </div>

            {demand.payment_forms && demand.payment_forms.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3" style={{ borderTop: '0.5px solid var(--separator)' }}>
                {demand.payment_forms.map(p => (
                  <span key={p} className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contact actions */}
          <div className="flex gap-3">
            <a href={`tel:${demand.buyer_phone}`} className="flex-1">
              <Button variant="secondary" className="w-full">
                <Phone size={16} />
                Позвонить
              </Button>
            </a>
            <Button variant="secondary" className="flex-1" onClick={() => setActivityOpen(true)}>
              <MessageSquare size={16} />
              Заметка
            </Button>
          </div>

          {/* AI Matches */}
          {(matches as MatchItem[]).length > 0 && (
            <section>
              <div className="flex items-center gap-2 px-1 mb-3">
                <Sparkles size={14} style={{ color: 'var(--ios-blue)' }} />
                <p className="section-label" style={{ marginBottom: 0 }}>
                  Подобранные объекты ({(matches as MatchItem[]).length})
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {(matches as MatchItem[]).slice(0, 5).map((m) => {
                  const pct = Math.round((m.score ?? 0) * 100);
                  return (
                    <Link key={m.property_id} href={`/properties/${m.property_id}`}>
                      <div
                        className="squircle-card p-4 press-scale"
                        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={12} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }} />
                              <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                                {m.property?.address_street ?? m.property?.district ?? 'Объект'}
                              </p>
                            </div>
                            {m.property?.price && (
                              <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                                {formatPrice(m.property.price)}
                              </p>
                            )}
                          </div>
                          <div
                            className="px-2.5 py-1 rounded-[10px] flex-shrink-0 text-[13px] font-bold"
                            style={{
                              background: pct >= 70 ? 'rgba(52,199,89,0.12)' : pct >= 40 ? 'rgba(255,149,0,0.12)' : 'var(--fill-secondary)',
                              color: pct >= 70 ? 'var(--ios-green)' : pct >= 40 ? 'var(--ios-orange)' : 'var(--label-tertiary)',
                            }}
                          >
                            {pct}%
                          </div>
                        </div>

                        {/* Score breakdown */}
                        {m.sub_scores && (
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {Object.entries(m.sub_scores).map(([key, val]) => {
                              const p = Math.round((val as number) * 100);
                              return (
                                <span
                                  key={key}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{
                                    background: 'var(--fill-tertiary)',
                                    color: p >= 70 ? 'var(--ios-green)' : p >= 40 ? 'var(--ios-orange)' : 'var(--label-tertiary)',
                                  }}
                                >
                                  {SUB_SCORE_LABELS[key] ?? key} {p}%
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {m.budget_overage && (
                          <p className="text-[12px] mt-2" style={{ color: 'var(--ios-orange)' }}>
                            +{formatPrice(m.budget_overage)} выше бюджета
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Activity log */}
          {(activity as ActivityItem[]).length > 0 && (
            <section>
              <p className="section-label px-1">История</p>
              <div className="flex flex-col gap-2">
                {(activity as ActivityItem[]).map((a) => (
                  <div
                    key={a.id}
                    className="squircle-card p-3"
                    style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ color: 'var(--label-tertiary)' }}>{ACTIVITY_ICONS[a.activity_type] ?? null}</span>
                      <span className="text-[12px] font-medium" style={{ color: 'var(--label-secondary)' }}>
                        {{note: 'Заметка', call: 'Звонок', viewing: 'Показ'}[a.activity_type] ?? a.activity_type}
                      </span>
                      <span className="text-[11px] ml-auto" style={{ color: 'var(--label-tertiary)' }}>
                        {formatRelativeTime(a.created_at)}
                      </span>
                    </div>
                    <p className="text-[13px]" style={{ color: 'var(--label-primary)' }}>{a.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
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
                  className="flex-1 py-2.5 rounded-[14px] text-[14px] font-semibold press-scale transition-colors"
                  style={{
                    background: activityType === type ? 'var(--ios-blue)' : 'var(--fill-tertiary)',
                    color: activityType === type ? 'white' : 'var(--label-primary)',
                  }}
                >
                  {labels[type]}
                </button>
              );
            })}
          </div>
          <textarea
            className="input-field resize-none"
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
      <p className="text-[11px] mb-0.5" style={{ color: 'var(--label-tertiary)' }}>{label}</p>
      <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>{String(value)}</p>
    </div>
  );
}
