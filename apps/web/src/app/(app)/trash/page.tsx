'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, RotateCcw, Building2, Users, Building } from 'lucide-react';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { formatPrice } from '@/lib/utils/format';
import { apiClient } from '@/lib/api/client';

type TrashedProperty = {
  id: string;
  property_type: string;
  district?: string;
  street?: string;
  house_number?: string;
  price?: number;
  deleted_at: string;
};

type TrashedComplex = {
  id: string;
  name: string;
  developer?: string;
  district?: string;
  deleted_at: string;
};

type TrashedClient = {
  id: string;
  buyer_name: string;
  buyer_phone?: string;
  client_type?: string;
  deleted_at: string;
};

const TABS = [
  { key: 'properties', label: 'Объекты', Icon: Building2 },
  { key: 'complexes',  label: 'ЖК',      Icon: Building  },
  { key: 'clients',    label: 'Клиенты', Icon: Users     },
] as const;

type TabKey = typeof TABS[number]['key'];

function daysLeft(deletedAt: string) {
  const days = Math.ceil((new Date(deletedAt).getTime() + 14 * 86400000 - Date.now()) / 86400000);
  return Math.max(0, days);
}

export default function TrashPage() {
  const [tab, setTab] = useState<TabKey>('properties');
  const qc = useQueryClient();

  const propertiesQ = useQuery<TrashedProperty[]>({
    queryKey: ['trash', 'properties'],
    queryFn: () => apiClient.get<{ data: TrashedProperty[] }>('/properties/trash').then(r => r.data.data ?? []),
  });

  const complexesQ = useQuery<TrashedComplex[]>({
    queryKey: ['trash', 'complexes'],
    queryFn: () => apiClient.get<{ data: TrashedComplex[] }>('/complexes/trash').then(r => r.data.data ?? []),
  });

  const clientsQ = useQuery<TrashedClient[]>({
    queryKey: ['trash', 'clients'],
    queryFn: () => apiClient.get<{ data: TrashedClient[] }>('/clients/trash').then(r => r.data.data ?? []),
  });

  const restoreProperty = useMutation({
    mutationFn: (id: string) => apiClient.post(`/properties/${id}/restore`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash', 'properties'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const restoreComplex = useMutation({
    mutationFn: (id: string) => apiClient.post(`/complexes/${id}/restore`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash', 'complexes'] });
      qc.invalidateQueries({ queryKey: ['complexes'] });
    },
  });

  const restoreClient = useMutation({
    mutationFn: (id: string) => apiClient.post(`/clients/${id}/restore`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash', 'clients'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const isLoading =
    (tab === 'properties' && propertiesQ.isLoading) ||
    (tab === 'complexes' && complexesQ.isLoading) ||
    (tab === 'clients' && clientsQ.isLoading);

  const TYPE_LABELS: Record<string, string> = {
    apartment: 'Квартира', house: 'Дом', land: 'Участок', commercial: 'Коммерция',
    parking: 'Паркинг', garage: 'Гараж', new_building: 'Новостройка', resale: 'Вторичка',
  };

  const CLIENT_TYPE_LABELS: Record<string, string> = {
    buyer: 'Покупатель', seller: 'Продавец', renter: 'Арендатор', landlord: 'Арендодатель',
  };

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <GlassNavBar title="Корзина" />

      <div className="px-4 pt-2 pb-24">
        {/* Tab bar */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`chip flex items-center gap-1.5 flex-shrink-0 press-scale ${tab === key ? 'chip-active' : ''}`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <p className="text-[12px] mb-3" style={{ color: 'var(--label-tertiary)' }}>
          Удалённые объекты хранятся 14 дней, после чего удаляются навсегда.
        </p>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
          </div>
        )}

        {/* Properties tab */}
        {tab === 'properties' && !propertiesQ.isLoading && (
          <div className="flex flex-col gap-2">
            {(propertiesQ.data ?? []).length === 0 && (
              <div className="text-center py-10">
                <Trash2 size={32} style={{ color: 'var(--label-quaternary)', margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--label-tertiary)' }} className="text-[14px]">Корзина пуста</p>
              </div>
            )}
            {(propertiesQ.data ?? []).map(p => (
              <div key={p.id} className="squircle-card p-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                      {TYPE_LABELS[p.property_type] ?? p.property_type}
                      {p.district && ` · ${p.district}`}
                    </p>
                  </div>
                  {p.street && (
                    <p className="text-[12px] truncate" style={{ color: 'var(--label-secondary)' }}>
                      {[p.street, p.house_number].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {p.price && (
                    <p className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>{formatPrice(p.price)}</p>
                  )}
                  <Badge variant={daysLeft(p.deleted_at) <= 3 ? 'warning' : 'default'} size="sm" className="mt-1">
                    Удалится через {daysLeft(p.deleted_at)} дн.
                  </Badge>
                </div>
                <Button
                  variant="secondary" size="sm"
                  loading={restoreProperty.isPending}
                  onClick={() => restoreProperty.mutate(p.id)}
                >
                  <RotateCcw size={14} />
                  Восстановить
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Complexes tab */}
        {tab === 'complexes' && !complexesQ.isLoading && (
          <div className="flex flex-col gap-2">
            {(complexesQ.data ?? []).length === 0 && (
              <div className="text-center py-10">
                <Trash2 size={32} style={{ color: 'var(--label-quaternary)', margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--label-tertiary)' }} className="text-[14px]">Корзина пуста</p>
              </div>
            )}
            {(complexesQ.data ?? []).map(c => (
              <div key={c.id} className="squircle-card p-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>{c.name}</p>
                  {c.developer && <p className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{c.developer}</p>}
                  {c.district && <p className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>{c.district}</p>}
                  <Badge variant={daysLeft(c.deleted_at) <= 3 ? 'warning' : 'default'} size="sm" className="mt-1">
                    Удалится через {daysLeft(c.deleted_at)} дн.
                  </Badge>
                </div>
                <Button
                  variant="secondary" size="sm"
                  loading={restoreComplex.isPending}
                  onClick={() => restoreComplex.mutate(c.id)}
                >
                  <RotateCcw size={14} />
                  Восстановить
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Clients tab */}
        {tab === 'clients' && !clientsQ.isLoading && (
          <div className="flex flex-col gap-2">
            {(clientsQ.data ?? []).length === 0 && (
              <div className="text-center py-10">
                <Trash2 size={32} style={{ color: 'var(--label-quaternary)', margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--label-tertiary)' }} className="text-[14px]">Корзина пуста</p>
              </div>
            )}
            {(clientsQ.data ?? []).map(c => (
              <div key={c.id} className="squircle-card p-4 flex items-center justify-between gap-3"
                style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>{c.buyer_name}</p>
                  {c.buyer_phone && <p className="text-[12px]" style={{ color: 'var(--label-secondary)' }}>{c.buyer_phone}</p>}
                  {c.client_type && (
                    <p className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
                      {CLIENT_TYPE_LABELS[c.client_type] ?? c.client_type}
                    </p>
                  )}
                  <Badge variant={daysLeft(c.deleted_at) <= 3 ? 'warning' : 'default'} size="sm" className="mt-1">
                    Удалится через {daysLeft(c.deleted_at)} дн.
                  </Badge>
                </div>
                <Button
                  variant="secondary" size="sm"
                  loading={restoreClient.isPending}
                  onClick={() => restoreClient.mutate(c.id)}
                >
                  <RotateCcw size={14} />
                  Восстановить
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
