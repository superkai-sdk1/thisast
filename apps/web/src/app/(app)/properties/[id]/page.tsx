'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Share2, Trash2, Lock, Pencil } from 'lucide-react';
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
        <div className="w-8 h-8 border-2 border-[var(--ios-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) return null;

  async function handleDelete() {
    if (!confirm('Удалить объект?')) return;
    await deleteMutation.mutateAsync(id);
    router.back();
  }

  const specs = [
    property.area_sqm   && { label: 'Площадь',  value: `${property.area_sqm} м²`     },
    property.rooms      && { label: 'Комнат',    value: String(property.rooms)         },
    property.floor      && { label: 'Этаж',      value: String(property.floor)         },
    property.price      && { label: 'Цена',      value: formatPrice(property.price)    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      {/* Floating back button */}
      <button
        onClick={() => router.back()}
        className="fixed top-[calc(1rem+env(safe-area-inset-top))] left-4 z-30 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Gallery — full bleed */}
      <PropertyGallery
        photos={property.photos ?? []}
        className="w-full h-[55vw] min-h-56 max-h-72 rounded-none"
      />

      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Price + tags */}
        <div>
          <p className="text-2xl font-bold text-[var(--label-primary)]">
            {formatPrice(property.price)}
          </p>

          <PermissionGate hideInSafeMode fallback={
            <p className="text-sm text-[var(--label-secondary)] mt-1">{property.district}</p>
          }>
            <p className="text-sm text-[var(--label-secondary)] mt-1">
              {[property.district, property.street, property.house_number]
                .filter(Boolean).join(', ')}
            </p>
          </PermissionGate>

          {property.tags && property.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {property.tags.map(tag => (
                <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Specs grid */}
        <div className="glass-card squircle-card p-4">
          <div className="grid grid-cols-2 gap-y-3">
            {specs.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[var(--label-tertiary)]">{label}</p>
                <p className="text-sm font-semibold text-[var(--label-primary)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div>
            <h2 className="text-sm font-semibold text-[var(--label-primary)] mb-2">Описание</h2>
            <p className="text-sm text-[var(--label-secondary)] leading-relaxed whitespace-pre-wrap">
              {property.description}
            </p>
          </div>
        )}

        {/* Owner contacts */}
        <PermissionGate hideInSafeMode>
          {property.owner_id && (
            <div className="glass-card squircle-card p-4">
              <p className="text-xs text-[var(--label-tertiary)] mb-1">Собственник</p>
              <p className="text-sm font-semibold text-[var(--label-primary)]">
                Контакты скрыты — откройте карточку собственника
              </p>
            </div>
          )}
        </PermissionGate>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
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
            <Share2 className="w-4 h-4" />
            Поделиться
          </Button>

          {/* Request access for private/agency objects */}
          {property.visibility_status === 'private' && (
            <Button
              variant="secondary"
              size="sm"
              disabled={accessRequested || requestAccess.isPending}
              onClick={async () => {
                await requestAccess.mutateAsync(id);
                setAccessRequested(true);
              }}
              loading={requestAccess.isPending}
            >
              <Lock className="w-4 h-4" />
              {accessRequested ? 'Запрос отправлен' : 'Запросить доступ'}
            </Button>
          )}

          <Link href={`/properties/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil className="w-4 h-4" />
              Изменить
            </Button>
          </Link>

          <PermissionGate permission="can_delete_records">
            <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
