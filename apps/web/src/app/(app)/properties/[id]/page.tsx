'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Share2, Trash2, Lock, Pencil, MapPin, BedDouble, Maximize2, Layers } from 'lucide-react';
import { useProperty, useDeleteProperty } from '@/lib/hooks/queries/useProperties';
import { useRequestAccess } from '@/lib/hooks/queries/useSharing';
import { PropertyGallery } from '@/components/organisms/PropertyGallery';
import { PDFDownloadButton } from '@/components/organisms/PDFDownloadButton';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { formatPrice } from '@/lib/utils/format';

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
  const [accessRequested, setAccessRequested] = useState(false);

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

  const specs = [
    property.rooms      && { icon: BedDouble, label: 'Комнат',   value: `${property.rooms} комн.`     },
    property.area_sqm   && { icon: Maximize2, label: 'Площадь',  value: `${property.area_sqm} м²`     },
    (property.floor && property.floor_total) && {
      icon: Layers, label: 'Этаж', value: `${property.floor} / ${property.floor_total}`,
    },
    property.price      && { icon: null, label: 'Цена',       value: formatPrice(property.price)    },
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
            <PermissionGate permission="clientSafeInverse">
              <p className="text-[26px] font-bold leading-tight" style={{ color: 'var(--label-primary)' }}>
                {formatPrice(property.price)}
              </p>
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
              disabled={accessRequested || requestAccess.isPending}
              loading={requestAccess.isPending}
              onClick={async () => {
                await requestAccess.mutateAsync(id);
                setAccessRequested(true);
              }}
            >
              <Lock size={14} />
              {accessRequested ? 'Запрос отправлен' : 'Запросить доступ'}
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
