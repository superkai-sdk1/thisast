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

const VISIBILITY_OPTIONS: { value: VisibilityStatus; label: string }[] = [
  { value: 'private', label: 'Личный'     },
  { value: 'shared',  label: 'Агентство'  },
  { value: 'public',  label: 'Публичный'  },
];

const DISTRICTS = ['Центр', 'Горная', 'Искож', 'Дубки', 'Стрелка', 'Университет'];

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

  const cls = {
    input: 'w-full px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm text-[var(--label-primary)] placeholder:text-[var(--label-tertiary)] outline-none',
    label: 'text-xs font-semibold text-[var(--label-tertiary)] uppercase tracking-wide',
    section: 'flex flex-col gap-1.5',
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--ios-blue)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <div className="glass-nav sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()} className="text-[var(--ios-blue)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[var(--label-primary)]">Редактировать</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-5 flex flex-col gap-5 pb-24">
        {/* Photos */}
        <div className={cls.section}>
          <label className={cls.label}>Фотографии</label>
          <div className="flex gap-2 flex-wrap">
            {(property?.photos ?? []).map(photo => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.url}
                  alt=""
                  className="w-20 h-20 object-cover rounded-[12px]"
                />
                {photo.is_cover && (
                  <Badge variant="info" className="absolute top-1 left-1 text-[10px]">
                    Обложка
                  </Badge>
                )}
                <button
                  onClick={() => photoDeleteMutation.mutate(photo.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--ios-red)] text-white flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <ImageUploader onUpload={handlePhotoUpload} maxFiles={10} />
        </div>

        {/* Visibility */}
        <div className={cls.section}>
          <label className={cls.label}>Видимость</label>
          <div className="flex gap-2">
            {VISIBILITY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setVisibility(value)}
                className={`flex-1 py-2 rounded-[14px] text-sm font-medium transition-colors ${
                  visibility === value
                    ? 'bg-[var(--ios-blue)] text-white'
                    : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className={cls.section}>
          <label className={cls.label}>Цена, ₽</label>
          <input type="number" className={cls.input} placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
        </div>

        {/* Location */}
        <div className={cls.section}>
          <label className={cls.label}>Район</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {DISTRICTS.map(d => (
              <button
                key={d}
                onClick={() => setDistrict(prev => prev === d ? '' : d)}
                className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                  district === d ? 'bg-[var(--ios-blue)] text-white' : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className={cls.input} placeholder="Улица" value={street} onChange={e => setStreet(e.target.value)} />
            <input className="w-24 px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm outline-none" placeholder="Дом" value={houseNumber} onChange={e => setHouseNumber(e.target.value)} />
          </div>
        </div>

        {/* Area & rooms */}
        <div className={cls.section}>
          <label className={cls.label}>Площадь и комнаты</label>
          <div className="flex gap-2">
            <input type="number" className={cls.input} placeholder="м²" value={areaSqm} onChange={e => setAreaSqm(e.target.value)} />
            <input type="number" className="w-24 px-4 py-3 rounded-[14px] bg-[var(--fill-tertiary)] text-sm outline-none" placeholder="Комн." value={rooms} onChange={e => setRooms(e.target.value)} />
          </div>
        </div>

        {/* Floor */}
        <div className={cls.section}>
          <label className={cls.label}>Этаж</label>
          <div className="flex gap-2">
            <input type="number" className={cls.input} placeholder="Этаж" value={floor} onChange={e => setFloor(e.target.value)} />
            <input type="number" className={cls.input} placeholder="Всего" value={floorTotal} onChange={e => setFloorTotal(e.target.value)} />
          </div>
        </div>

        {/* Payment */}
        <div className={cls.section}>
          <label className={cls.label}>Форма оплаты</label>
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => togglePayment(value)}
                className={`px-3 py-2 rounded-[12px] text-sm font-medium transition-colors ${
                  conditions.includes(value) ? 'bg-[var(--ios-blue)] text-white' : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className={cls.section}>
          <label className={cls.label}>Метки</label>
          <input className={cls.input} placeholder="Срочно, Эксклюзив, Торг" value={tags} onChange={e => setTags(e.target.value)} />
        </div>

        {/* Description */}
        <div className={cls.section}>
          <label className={cls.label}>Описание</label>
          <textarea className={`${cls.input} resize-none`} rows={4} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 pb-[calc(1rem+env(safe-area-inset-bottom))] px-4 pt-4 bg-gradient-to-t from-[var(--bg-primary)] to-transparent">
        <Button className="w-full" onClick={handleSubmit} loading={updateMutation.isPending}>
          Сохранить изменения
        </Button>
      </div>
    </div>
  );
}
