'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Share2, Trash2, Lock, Pencil, MapPin, BedDouble, Maximize2, Layers, Building, ClipboardList, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty, useDeleteProperty } from '@/lib/hooks/queries/useProperties';
import { useRequestAccess } from '@/lib/hooks/queries/useSharing';
import { PropertyGallery } from '@/components/organisms/PropertyGallery';
import { PDFDownloadButton } from '@/components/organisms/PDFDownloadButton';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { formatPrice } from '@/lib/utils/format';
import { propertiesApi } from '@/lib/api/properties';
import { tasksApi, type Task } from '@/lib/api/tasks';
import { MortgageCalculator } from '@/components/organisms/MortgageCalculator';
import { InstallmentCalculator } from '@/components/organisms/InstallmentCalculator';

interface EntityEvent {
  event_type: string;
  description: string;
  created_at: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

const VISIBILITY_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'info' }> = {
  private: { label: 'Скрытый',   variant: 'default' },
  shared:  { label: 'Агентский', variant: 'info' },
  public:  { label: 'Публичный', variant: 'success' },
};

export default function PropertyDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: property, isLoading } = useProperty(id);
  const deleteMutation = useDeleteProperty();
  const requestAccess = useRequestAccess();
  const { data: events = [] } = useQuery({
    queryKey: ['property-events', id],
    queryFn: () => propertiesApi.getEvents(id),
    enabled: !!id,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', { property_id: id }],
    queryFn: () => tasksApi.list({ entity_type: 'property', entity_id: id } as Parameters<typeof tasksApi.list>[0]),
    enabled: !!id,
  });
  const qc = useQueryClient();
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksApi.update(taskId, { status: status as Task['status'] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const [accessRequested, setAccessRequested] = useState(false);
  const [accessError, setAccessError] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  if (!property) return null;

  async function handleDelete() {
    if (!confirm('Удалить объект? Это действие нельзя отменить.')) return;
    await deleteMutation.mutateAsync(id);
    router.back();
  }

  const vis = VISIBILITY_LABELS[property.visibility_status ?? 'private'] ?? VISIBILITY_LABELS.private;

  const LISTING_TYPE_LABELS: Record<string, string> = {
    sale: 'Продажа',
    rent: 'Аренда',
  };

  const RENOVATION_LABELS: Record<string, string> = {
    none:     'Без отделки',
    rough:    'Черновая',
    cosmetic: 'Косметический',
    euro:     'Евро',
    designer: 'Дизайнерский',
  };

  const specs = [
    property.rooms      && { icon: BedDouble, label: 'Комнат',   value: `${property.rooms} комн.`     },
    property.area_sqm   && { icon: Maximize2, label: 'Площадь',  value: `${property.area_sqm} м²`     },
    (property.floor && property.floor_total) && {
      icon: Layers, label: 'Этаж', value: `${property.floor} / ${property.floor_total}`,
    },
    property.price      && { icon: null, label: 'Цена',       value: formatPrice(property.price)    },
    property.listing_type && {
      icon: null, label: 'Вид',
      value: LISTING_TYPE_LABELS[property.listing_type] ?? property.listing_type,
    },
    property.renovation && {
      icon: null, label: 'Ремонт',
      value: RENOVATION_LABELS[property.renovation] ?? property.renovation,
    },
    property.net_price && {
      icon: null, label: 'На руки',
      value: formatPrice(property.net_price),
    },
  ].filter(Boolean) as { icon: React.ElementType | null; label: string; value: string }[];

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Floating back button */}
      <button
        onClick={() => router.back()}
        className="fixed top-[calc(12px+env(safe-area-inset-top))] left-4 z-30 w-9 h-9 rounded-full flex items-center justify-center text-white press-scale"
        style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(12px)' }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Gallery — full bleed */}
      <PropertyGallery
        photos={property.photos ?? []}
        className="w-full h-[55vw] min-h-56 max-h-80 rounded-none"
      />

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Title area */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <PermissionGate hideInSafeMode>
              <div>
                <p className="text-[26px] font-bold leading-tight" style={{ color: 'var(--label-primary)' }}>
                  {formatPrice(property.price)}
                </p>
                {property.display_id && (
                  <p className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--label-tertiary)' }}>
                    #{property.display_id}
                  </p>
                )}
              </div>
            </PermissionGate>
            <Badge variant={vis.variant} size="sm" className="flex-shrink-0 mt-1">{vis.label}</Badge>
          </div>

          <PermissionGate hideInSafeMode>
            <div className="flex items-start gap-1.5 mt-1">
              <MapPin size={13} style={{ color: 'var(--label-tertiary)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-[14px]" style={{ color: 'var(--label-secondary)' }}>
                {[property.district, property.street, property.house_number]
                  .filter(Boolean).join(', ') || 'Адрес не указан'}
              </p>
            </div>
          </PermissionGate>

          {property.tags && property.tags.length > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {property.tags.map(tag => (
                <span key={tag} className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--fill-secondary)', color: 'var(--label-secondary)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Specs grid */}
        {specs.length > 0 && (
          <div
            className="squircle-card p-4 grid grid-cols-2 gap-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            {specs.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5">
                {Icon && (
                  <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--fill-tertiary)' }}>
                    <Icon size={14} style={{ color: 'var(--label-secondary)' }} />
                  </div>
                )}
                <div>
                  <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>{label}</p>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feature badges */}
        {(property.has_loggia || property.has_balcony || property.has_wardrobe || property.has_panoramic) && (
          <div className="flex gap-1.5 flex-wrap">
            {property.has_loggia    && <span className="chip text-[12px] py-0.5">Лоджия</span>}
            {property.has_balcony   && <span className="chip text-[12px] py-0.5">Балкон</span>}
            {property.has_wardrobe  && <span className="chip text-[12px] py-0.5">Гардероб</span>}
            {property.has_panoramic && <span className="chip text-[12px] py-0.5">Панорамные окна</span>}
          </div>
        )}

        {/* Description */}
        {property.description && (
          <div
            className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            <p className="section-label">Описание</p>
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--label-secondary)' }}>
              {property.description}
            </p>
          </div>
        )}

        {/* Complex block */}
        {property.complex_id && property.complex_name && (
          <Link href={`/complexes/${property.complex_id}`}>
            <div className="squircle-card p-4 flex items-center gap-3 press-scale"
              style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
              <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Building size={16} style={{ color: 'var(--neon-blue)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>Жилой комплекс</p>
                <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                  {property.complex_name}
                </p>
                {property.complex_developer && (
                  <p className="text-[12px] truncate" style={{ color: 'var(--label-secondary)' }}>
                    {property.complex_developer}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Calculators */}
        {(property.conditions as string[] | undefined)?.includes('mortgage') && property.price && (
          <MortgageCalculator
            price={property.price}
            rate={property.mortgage_rate ?? undefined}
            initialPct={property.mortgage_initial_pct ?? undefined}
          />
        )}
        {(property.conditions as string[] | undefined)?.includes('installment') && property.price && (
          <InstallmentCalculator
            plans={property.installment_plans ?? []}
            area={property.area_sqm ?? undefined}
            price={property.price}
          />
        )}

        {/* Tasks */}
        <div className="squircle-card p-4 flex flex-col gap-3"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <p className="section-label">Задачи</p>
            <Link href={`/tasks/new?property_id=${id}`}>
              <button className="w-7 h-7 rounded-full flex items-center justify-center press-scale"
                style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--neon-blue)' }}>
                <Plus size={14} />
              </button>
            </Link>
          </div>
          {(tasks as Task[]).length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <ClipboardList size={16} style={{ color: 'var(--label-quaternary)' }} />
              <p className="text-[13px]" style={{ color: 'var(--label-tertiary)' }}>Нет задач по этому объекту</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(tasks as Task[]).map(task => (
                <div key={task.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--label-primary)' }}>
                      {task.title}
                    </p>
                    {task.due_at && (
                      <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>
                        {new Date(task.due_at).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => updateTaskMutation.mutate({
                      taskId: task.id,
                      status: task.status === 'done' ? 'new' : 'done',
                    })}
                    className="flex-shrink-0 text-[11px] px-2 py-1 rounded-full press-scale"
                    style={{
                      background: task.status === 'done' ? 'rgba(52,199,89,0.15)' : 'var(--fill-tertiary)',
                      color: task.status === 'done' ? 'var(--ios-green)' : 'var(--label-secondary)',
                    }}
                  >
                    {task.status === 'done' ? 'Готово' : 'В работе'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Owner contacts */}
        <PermissionGate hideInSafeMode>
          {property.owner_id && (
            <div
              className="squircle-card p-4"
              style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
            >
              <p className="section-label">Собственник</p>
              <p className="text-[14px]" style={{ color: 'var(--label-secondary)' }}>
                Откройте карточку собственника для просмотра контактов
              </p>
            </div>
          )}
        </PermissionGate>

        {/* Events history */}
        {events.length > 0 && (
          <div className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>
            <p className="section-label">История</p>
            <div className="flex flex-col gap-2 mt-2">
              {(events as EntityEvent[]).map((e, i) => (
                <div key={i} className="flex items-start justify-between gap-3"
                  style={{ borderBottom: '0.5px solid var(--separator)', paddingBottom: 8 }}>
                  <p className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>{e.description}</p>
                  <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--label-tertiary)' }}>
                    {new Date(e.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <PDFDownloadButton propertyId={id} address={property.street ?? undefined} />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: formatPrice(property.price), url: window.location.href });
              }
            }}
          >
            <Share2 size={14} />
            Поделиться
          </Button>

          {property.visibility_status === 'private' && (
            <Button
              variant="secondary"
              size="sm"
              disabled={accessRequested || accessError || requestAccess.isPending}
              loading={requestAccess.isPending}
              onClick={async () => {
                try {
                  await requestAccess.mutateAsync(id);
                  setAccessRequested(true);
                } catch {
                  setAccessError(true);
                }
              }}
            >
              <Lock size={14} />
              {accessError ? 'Недоступно' : accessRequested ? 'Запрос отправлен' : 'Запросить доступ'}
            </Button>
          )}

          <Link href={`/properties/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil size={14} />
              Изменить
            </Button>
          </Link>

          <PermissionGate permission="can_delete_records">
            <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleteMutation.isPending}>
              <Trash2 size={14} />
            </Button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
