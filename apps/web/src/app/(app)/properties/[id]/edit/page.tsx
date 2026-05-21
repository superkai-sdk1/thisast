'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProperty } from '@/lib/hooks/queries/useProperties';
import { propertiesApi } from '@/lib/api/properties';
import { propertyKeys } from '@/lib/hooks/queries/useProperties';
import { ImageUploader } from '@/components/molecules/ImageUploader';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import type { PropertyType, PaymentForm, VisibilityStatus } from '@crm/shared-types';

interface Props {
  params: Promise<{ id: string }>;
}

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'cash',              label: 'Наличные'      },
  { value: 'mortgage',          label: 'Ипотека'       },
  { value: 'installment',       label: 'Рассрочка'     },
  { value: 'matcapital',        label: 'Маткапитал'    },
  { value: 'military_mortgage', label: 'Воен. ипотека' },
];

const VISIBILITY_OPTIONS: { value: VisibilityStatus; label: string; badge: 'default' | 'info' | 'success' }[] = [
  { value: 'private', label: 'Личный',    badge: 'default' },
  { value: 'shared',  label: 'Агентство', badge: 'info'    },
  { value: 'public',  label: 'Публичный', badge: 'success' },
];

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

export default function EditPropertyPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: property, isLoading } = useProperty(id);

  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [rooms, setRooms] = useState('');
  const [floor, setFloor] = useState('');
  const [floorTotal, setFloorTotal] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [conditions, setConditions] = useState<PaymentForm[]>([]);
  const [visibility, setVisibility] = useState<VisibilityStatus>('private');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!property) return;
    setPrice(String(property.price ?? ''));
    setDistrict(property.district ?? '');
    setStreet(property.street ?? '');
    setHouseNumber(property.house_number ?? '');
    setAreaSqm(String(property.area_sqm ?? ''));
    setRooms(String(property.rooms ?? ''));
    setFloor(String(property.floor ?? ''));
    setFloorTotal(String(property.floor_total ?? ''));
    setDescription(property.description ?? '');
    setTags((property.tags ?? []).join(', '));
    setConditions((property.conditions ?? []) as PaymentForm[]);
    setVisibility(property.visibility_status ?? 'private');
  }, [property]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof propertiesApi.update>[1]) =>
      propertiesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
      qc.invalidateQueries({ queryKey: propertyKeys.lists() });
      router.back();
    },
    onError: (e: unknown) => setSaveError((e as Error)?.message ?? 'Ошибка сохранения'),
  });

  const photoDeleteMutation = useMutation({
    mutationFn: (photoId: string) => propertiesApi.deletePhoto(id, photoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.detail(id) }),
  });

  async function handlePhotoUpload(file: File) {
    await propertiesApi.uploadPhotos(id, [file]);
    qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
  }

  function togglePayment(p: PaymentForm) {
    setConditions(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p],
    );
  }

  function handleSubmit() {
    setSaveError(null);
    updateMutation.mutate({
      price: price ? Number(price) : undefined,
      district: district || undefined,
      street: street || undefined,
      house_number: houseNumber || undefined,
      area_sqm: areaSqm ? Number(areaSqm) : undefined,
      rooms: rooms ? Number(rooms) : undefined,
      floor: floor ? Number(floor) : undefined,
      floor_total: floorTotal ? Number(floorTotal) : undefined,
      description: description || undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      conditions,
      visibility_status: visibility,
    } as Parameters<typeof propertiesApi.update>[1]);
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>Редактировать</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-5">

        {/* Photos */}
        <FormSection label="Фотографии">
          <div className="flex gap-2 flex-wrap">
            {(property?.photos ?? []).map(photo => (
              <div key={photo.id} className="relative">
                <img src={photo.url} alt="" className="w-20 h-20 object-cover rounded-[14px]" />
                {photo.is_cover && (
                  <Badge variant="info" size="sm" className="absolute top-1 left-1 text-[10px]">
                    Обложка
                  </Badge>
                )}
                <button
                  onClick={() => photoDeleteMutation.mutate(photo.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white press-scale"
                  style={{ background: 'var(--ios-red)' }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
          <ImageUploader onUpload={handlePhotoUpload} maxFiles={10} />
        </FormSection>

        {/* Visibility */}
        <FormSection label="Видимость">
          <div className="flex gap-2">
            {VISIBILITY_OPTIONS.map(({ value, label, badge }) => (
              <button
                key={value}
                onClick={() => setVisibility(value)}
                className="flex-1 py-2.5 rounded-[14px] text-[13px] font-semibold press-scale transition-colors"
                style={{
                  background: visibility === value ? 'var(--ios-blue)' : 'var(--fill-tertiary)',
                  color: visibility === value ? 'white' : 'var(--label-primary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Price */}
        <FormSection label="Цена, ₽">
          <input type="number" className="input-field" placeholder="0"
            value={price} onChange={e => setPrice(e.target.value)} />
        </FormSection>

        {/* Location */}
        <FormSection label="Район">
          <div className="flex gap-2 flex-wrap mb-1">
            {DISTRICTS.map(d => (
              <button key={d}
                onClick={() => setDistrict(prev => prev === d ? '' : d)}
                className={`chip press-scale ${district === d ? 'chip-active' : ''}`}>
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input-field" placeholder="Улица"
              value={street} onChange={e => setStreet(e.target.value)} />
            <input className="input-field" style={{ width: 96 }} placeholder="Дом"
              value={houseNumber} onChange={e => setHouseNumber(e.target.value)} />
          </div>
        </FormSection>

        {/* Area & rooms */}
        <FormSection label="Площадь и комнаты">
          <div className="flex gap-2">
            <input type="number" className="input-field" placeholder="м²"
              value={areaSqm} onChange={e => setAreaSqm(e.target.value)} />
            <input type="number" className="input-field" style={{ width: 96 }} placeholder="Комн."
              value={rooms} onChange={e => setRooms(e.target.value)} />
          </div>
        </FormSection>

        {/* Floor */}
        <FormSection label="Этаж">
          <div className="flex gap-2">
            <input type="number" className="input-field" placeholder="Этаж"
              value={floor} onChange={e => setFloor(e.target.value)} />
            <input type="number" className="input-field" placeholder="Всего этажей"
              value={floorTotal} onChange={e => setFloorTotal(e.target.value)} />
          </div>
        </FormSection>

        {/* Payment */}
        <FormSection label="Форма оплаты">
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_OPTIONS.map(({ value, label }) => (
              <button key={value}
                onClick={() => togglePayment(value)}
                className={`chip press-scale ${conditions.includes(value) ? 'chip-active' : ''}`}>
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Tags */}
        <FormSection label="Метки (через запятую)">
          <input className="input-field" placeholder="Срочно, Эксклюзив, Торг"
            value={tags} onChange={e => setTags(e.target.value)} />
        </FormSection>

        {/* Description */}
        <FormSection label="Описание">
          <textarea className="input-field resize-none" rows={4}
            value={description} onChange={e => setDescription(e.target.value)} />
        </FormSection>

      </div>

      <div className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)' }}>
        {saveError && (
          <p className="text-[13px] mb-2" style={{ color: 'var(--ios-red)' }}>{saveError}</p>
        )}
        <Button className="w-full" onClick={handleSubmit} loading={updateMutation.isPending}>
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}
