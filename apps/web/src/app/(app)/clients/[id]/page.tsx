'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Phone, Eye, Sparkles, MapPin, Thermometer, Calendar, Wallet, Home, Ruler, Clock, Pencil } from 'lucide-react';
import { useDemand, useDemandMatches, useDemandActivity } from '@/lib/hooks/queries/useDemands';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';
import { KANBAN_STAGES } from '@crm/shared-types';
import { demandsApi } from '@/lib/api/demands';
import { useQueryClient } from '@tanstack/react-query';
import { demandKeys } from '@/lib/hooks/queries/useDemands';
import { apiClient } from '@/lib/api/client';

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

const CLIENT_TYPE_LABELS: Record<string, string> = {
  buyer: 'Покупатель', seller: 'Продавец', renter: 'Арендатор', landlord: 'Арендодатель',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Квартира', house: 'Дом', land: 'Участок',
  commercial: 'Коммерция', new_building: 'Новостройка',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Наличные', mortgage: 'Ипотека', installment: 'Рассрочка',
  trade_in: 'Trade-in', matcapital: 'Маткапитал', military_mortgage: 'Воен. ипотека',
};

const TEMPERATURE_INFO: Record<string, { label: string; color: string }> = {
  hot:      { label: 'Горячий',  color: 'var(--ios-red)'    },
  warm:     { label: 'Тёплый',   color: 'var(--ios-orange)' },
  cold:     { label: 'Холодный', color: 'var(--ios-blue)'   },
  thinking: { label: 'Думает',   color: 'var(--label-tertiary)' },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note:    <MessageSquare size={13} />,
  call:    <Phone size={13} />,
  viewing: <Eye size={13} />,
};

const SUB_SCORE_LABELS: Record<string, string> = {
  budget: 'Бюджет', type: 'Тип', rooms: 'Комнаты',
  district: 'Район', area: 'Площадь', semantic: 'AI', payment: 'Оплата',
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

interface EventItem {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

export default function ClientDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: demand, isLoading } = useDemand(id);
  const { data: matches = [] } = useDemandMatches(id);
  const { data: activity = [] } = useDemandActivity(id);
  const { data: events = [] } = useQuery<EventItem[]>({
    queryKey: ['demand-events', id],
    queryFn: () => apiClient.get(`/demands/${id}/events`).then(r => Array.isArray(r.data) ? r.data : r.data.data ?? []),
  });

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
  const temp = demand.temperature ? TEMPERATURE_INFO[demand.temperature] : null;
  const clientType = (demand as any).client_type ?? 'buyer';

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
          <div className="flex flex-col items-center">
            <h1 className="text-[16px] font-semibold truncate max-w-[55%]" style={{ color: 'var(--label-primary)' }}>
              {demand.buyer_name}
            </h1>
            {(demand as any).display_id && (
              <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>#{(demand as any).display_id}</span>
            )}
          </div>
          <Link href={`/clients/${id}/edit`}>
            <button className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
              style={{ color: 'var(--ios-blue)' }}>
              <Pencil size={16} />
            </button>
          </Link>
        </div>
      </div>

      <div className="gradient-mesh min-h-full">
        <div className="px-4 py-4 pb-6 flex flex-col gap-4">

          {/* Hero contact card */}
          <div className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
            {/* Type + temp row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge variant={stageBadge} size="sm">{stageLabel}</Badge>
              <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold"
                style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}>
                {CLIENT_TYPE_LABELS[clientType] ?? clientType}
              </span>
              {temp && (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${temp.color}18`, color: temp.color }}>
                  <Thermometer size={12} />
                  {temp.label}
                </span>
              )}
              {(demand as any).is_contact_overdue && (
                <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(255,59,48,0.12)', color: 'var(--ios-red)' }}>
                  ⚠ Контакт просрочен
                </span>
              )}
            </div>

            {/* Phone */}
            {demand.buyer_phone && (
              <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '0.5px solid var(--separator)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(52,199,89,0.12)' }}>
                  <Phone size={16} style={{ color: 'var(--ios-green)' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Телефон</p>
                  <p className="text-[16px] font-semibold font-mono" style={{ color: 'var(--label-primary)' }}>
                    {demand.buyer_phone}
                  </p>
                </div>
                <a href={`tel:${demand.buyer_phone}`} className="flex-shrink-0">
                  <button className="px-4 py-2 rounded-full text-white text-[13px] font-semibold press-scale"
                    style={{ background: 'var(--ios-green)' }}>
                    Позвонить
                  </button>
                </a>
              </div>
            )}

            {/* Dates */}
            <div className="flex gap-4 flex-wrap">
              {(demand as any).first_contact_at && (
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Первый контакт</p>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--label-secondary)' }}>
                    {new Date((demand as any).first_contact_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
              {(demand as any).next_contact_at && (
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Следующий контакт</p>
                  <p className="text-[13px] font-medium"
                    style={{ color: (demand as any).is_contact_overdue ? 'var(--ios-red)' : 'var(--label-secondary)' }}>
                    <Clock size={11} className="inline mr-1" />
                    {new Date((demand as any).next_contact_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
              {(demand as any).created_at && !(demand as any).first_contact_at && (
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>В базе с</p>
                  <p className="text-[13px] font-medium" style={{ color: 'var(--label-secondary)' }}>
                    {new Date((demand as any).created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setActivityType('note'); setActivityOpen(true); }}>
              <MessageSquare size={16} />Заметка
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => { setActivityType('viewing'); setActivityOpen(true); }}>
              <Eye size={16} />Показ
            </Button>
          </div>

          {/* Main info card */}
          <div className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
            <p className="section-label">Параметры поиска</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {(demand.budget_max || demand.budget_min) && (
                <div className="col-span-2 flex items-center gap-2">
                  <Wallet size={14} style={{ color: 'var(--label-tertiary)', flexShrink: 0 }} />
                  <div>
                    <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>Бюджет</p>
                    <p className="text-[15px] font-bold" style={{ color: 'var(--label-primary)' }}>
                      {demand.budget_min ? formatPrice(demand.budget_min) + ' — ' : ''}{formatPrice(demand.budget_max ?? 0)}
                    </p>
                  </div>
                </div>
              )}
              {(demand as any).net_price && (
                <InfoRow label="Цена на руки" value={formatPrice((demand as any).net_price)} />
              )}
              {(demand as any).rent_price && (
                <InfoRow label="Ставка аренды" value={formatPrice((demand as any).rent_price) + '/мес'} />
              )}
              {(demand as any).deposit && (
                <InfoRow label="Залог" value={formatPrice((demand as any).deposit)} />
              )}
              {demand.property_type && (
                <InfoRow label="Тип объекта" value={PROPERTY_TYPE_LABELS[demand.property_type] ?? demand.property_type} />
              )}
              {demand.rooms && demand.rooms.length > 0 && (
                <InfoRow label="Комнат" value={(demand.rooms as number[]).join(', ')} />
              )}
              {(demand.area_min || demand.area_max) && (
                <InfoRow label="Площадь" value={
                  demand.area_min && demand.area_max
                    ? `${demand.area_min}–${demand.area_max} м²`
                    : demand.area_min ? `от ${demand.area_min} м²` : `до ${demand.area_max} м²`
                } />
              )}
            </div>

            {/* Districts */}
            {demand.districts && demand.districts.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid var(--separator)' }}>
                <p className="text-[11px] mb-1.5" style={{ color: 'var(--label-tertiary)' }}>Районы</p>
                <div className="flex flex-wrap gap-1">
                  {(demand.districts as string[]).map(d => (
                    <span key={d} className="text-[12px] font-medium px-2.5 py-0.5 rounded-full"
                      style={{ background: 'var(--fill-secondary)', color: 'var(--label-secondary)' }}>{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Payment forms */}
            {demand.payment_forms && demand.payment_forms.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid var(--separator)' }}>
                <p className="text-[11px] mb-1.5" style={{ color: 'var(--label-tertiary)' }}>Форма оплаты</p>
                <div className="flex flex-wrap gap-1">
                  {(demand.payment_forms as string[]).map(p => (
                    <span key={p} className="text-[12px] font-medium px-2.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}>
                      {PAYMENT_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {(demand.notes || (demand as any).demand_notes) && (
              <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid var(--separator)' }}>
                <p className="text-[11px] mb-1" style={{ color: 'var(--label-tertiary)' }}>Заметки</p>
                {demand.notes && <p className="text-[13px] leading-relaxed" style={{ color: 'var(--label-primary)' }}>{demand.notes}</p>}
                {(demand as any).demand_notes && (
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--label-secondary)' }}>{(demand as any).demand_notes}</p>
                )}
              </div>
            )}
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
                      <div className="squircle-card p-4 press-scale"
                        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
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
                          <div className="px-2.5 py-1 rounded-[10px] flex-shrink-0 text-[13px] font-bold"
                            style={{
                              background: pct >= 70 ? 'rgba(52,199,89,0.12)' : pct >= 40 ? 'rgba(255,149,0,0.12)' : 'var(--fill-secondary)',
                              color: pct >= 70 ? 'var(--ios-green)' : pct >= 40 ? 'var(--ios-orange)' : 'var(--label-tertiary)',
                            }}>
                            {pct}%
                          </div>
                        </div>
                        {m.sub_scores && (
                          <div className="flex gap-1.5 flex-wrap mt-1">
                            {Object.entries(m.sub_scores).map(([key, val]) => {
                              const p = Math.round((val as number) * 100);
                              return (
                                <span key={key} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--fill-tertiary)', color: p >= 70 ? 'var(--ios-green)' : p >= 40 ? 'var(--ios-orange)' : 'var(--label-tertiary)' }}>
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
              <p className="section-label px-1">История звонков / показов</p>
              <div className="flex flex-col gap-2">
                {(activity as ActivityItem[]).map((a) => (
                  <div key={a.id} className="squircle-card p-3"
                    style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ color: 'var(--label-tertiary)' }}>{ACTIVITY_ICONS[a.activity_type] ?? null}</span>
                      <span className="text-[12px] font-medium" style={{ color: 'var(--label-secondary)' }}>
                        {{note: 'Заметка', call: 'Звонок', viewing: 'Показ'}[a.activity_type as 'note'|'call'|'viewing'] ?? a.activity_type}
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

          {/* Entity events */}
          {(events as EventItem[]).length > 0 && (
            <section>
              <p className="section-label px-1">Лента событий</p>
              <div className="flex flex-col gap-2">
                {(events as EventItem[]).map((e) => (
                  <div key={e.id} className="squircle-card p-3"
                    style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium" style={{ color: 'var(--label-secondary)' }}>{e.description}</span>
                      <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>
                        {new Date(e.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    {e.user_name && (
                      <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>{e.user_name}</p>
                    )}
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
                <button key={type} onClick={() => setActivityType(type)}
                  className="flex-1 py-2.5 rounded-[14px] text-[14px] font-semibold press-scale transition-colors"
                  style={{
                    background: activityType === type ? 'var(--ios-blue)' : 'var(--fill-tertiary)',
                    color: activityType === type ? 'white' : 'var(--label-primary)',
                  }}>
                  {labels[type]}
                </button>
              );
            })}
          </div>
          <textarea className="input-field resize-none" rows={4} placeholder="Текст заметки..."
            value={activityBody} onChange={e => setActivityBody(e.target.value)} />
          <Button onClick={addActivity} disabled={!activityBody.trim()} className="w-full">Сохранить</Button>
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
