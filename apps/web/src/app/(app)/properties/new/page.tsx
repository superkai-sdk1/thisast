'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api/properties';
import { propertyKeys } from '@/lib/hooks/queries/useProperties';
import { useDraftForm } from '@/lib/hooks/useDraftForm';
import { ImageUploader } from '@/components/molecules/ImageUploader';
import { Button } from '@/components/atoms/Button';
import type { PropertyType, PaymentForm } from '@crm/shared-types';

const DRAFT_ID = 'new-property';

interface PropertyFormValues {
  property_type: PropertyType | '';
  city: string;
  district: string;
  street: string;
  house_number: string;
  price: string;
  area_sqm: string;
  rooms: string;
  floor: string;
  floor_total: string;
  description: string;
  conditions: PaymentForm[];
  tags: string;
}

const INITIAL: PropertyFormValues = {
  property_type: '',
  city: 'Махачкала',
  district: '',
  street: '',
  house_number: '',
  price: '',
  area_sqm: '',
  rooms: '',
  floor: '',
  floor_total: '',
  description: '',
  conditions: [],
  tags: '',
};

const TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'apartment',    label: 'Квартира'   },
  { value: 'resale',       label: 'Вторичка'   },
  { value: 'new_building', label: 'Новострой'  },
  { value: 'house',        label: 'Дом'        },
  { value: 'land',         label: 'Участок'    },
  { value: 'commercial',   label: 'Коммерция'  },
  { value: 'rent',         label: 'Аренда'     },
];

const PAYMENT_OPTIONS: { value: PaymentForm; label: string }[] = [
  { value: 'cash',              label: 'Наличные'      },
  { value: 'mortgage',          label: 'Ипотека'       },
  { value: 'installment',       label: 'Рассрочка'     },
  { value: 'matcapital',        label: 'Маткапитал'    },
  { value: 'military_mortgage', label: 'Воен. ипотека' },
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

export default function NewPropertyPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { values, setValues, restored, clearDraft } = useDraftForm<PropertyFormValues>(
    'property', DRAFT_ID, INITIAL,
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const createMutation = useMutation({
    mutationFn: propertiesApi.create,
    onSuccess: async (property) => {
      clearDraft();
      if (pendingFiles.length > 0) {
        setUploadingPhotos(true);
        try {
          await propertiesApi.uploadPhotos((property as { id: string }).id, pendingFiles);
        } finally {
          setUploadingPhotos(false);
        }
      }
      qc.invalidateQueries({ queryKey: propertyKeys.all() });
      router.back();
    },
  });

  function set<K extends keyof PropertyFormValues>(key: K, val: PropertyFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  function togglePayment(p: PaymentForm) {
    set('conditions', values.conditions.includes(p)
      ? values.conditions.filter(x => x !== p)
      : [...values.conditions, p]);
  }

  async function handleSubmit() {
    if (!values.price || !values.property_type) return;
    await createMutation.mutateAsync({
      property_type: values.property_type as PropertyType,
      city: values.city || 'Махачкала',
      district: values.district || undefined,
      street: values.street || undefined,
      house_number: values.house_number || undefined,
      price: Number(values.price),
      area_sqm: values.area_sqm ? Number(values.area_sqm) : undefined,
      rooms: values.rooms ? Number(values.rooms) : undefined,
      floor: values.floor ? Number(values.floor) : undefined,
      floor_total: values.floor_total ? Number(values.floor_total) : undefined,
      description: values.description || undefined,
      conditions: values.conditions,
      tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      visibility_status: 'private',
    } as Parameters<typeof propertiesApi.create>[0]);
  }

  const showRoomFloor = !values.property_type || ['apartment', 'resale', 'new_building', 'house'].includes(values.property_type);
  const showFloor = !values.property_type || ['apartment', 'resale', 'new_building'].includes(values.property_type);

  if (!restored) return null;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}>
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>Новый объект</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-5">

        <FormSection label="Тип *">
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => set('property_type', value)}
                className={`chip press-scale ${values.property_type === value ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection label="Цена, ₽ *">
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={values.price}
            onChange={e => set('price', e.target.value)}
          />
        </FormSection>

        <FormSection label="Район">
          <div className="flex gap-2 flex-wrap mb-2">
            {DISTRICTS.map(d => (
              <button
                key={d}
                onClick={() => set('district', values.district === d ? '' : d)}
                className={`chip press-scale ${values.district === d ? 'chip-active' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input-field"
              placeholder="Улица"
              value={values.street}
              onChange={e => set('street', e.target.value)}
            />
            <input
              className="input-field"
              style={{ width: 96 }}
              placeholder="Дом"
              value={values.house_number}
              onChange={e => set('house_number', e.target.value)}
            />
          </div>
        </FormSection>

        {showRoomFloor && (
          <FormSection label="Площадь и комнаты">
            <div className="flex gap-2">
              <input
                type="number"
                className="input-field"
                placeholder="м²"
                value={values.area_sqm}
                onChange={e => set('area_sqm', e.target.value)}
              />
              <input
                type="number"
                className="input-field"
                style={{ width: 96 }}
                placeholder="Комн."
                value={values.rooms}
                onChange={e => set('rooms', e.target.value)}
              />
            </div>
          </FormSection>
        )}

        {showFloor && (
          <FormSection label="Этаж">
            <div className="flex gap-2">
              <input type="number" className="input-field" placeholder="Этаж"
                value={values.floor} onChange={e => set('floor', e.target.value)} />
              <input type="number" className="input-field" placeholder="Всего этажей"
                value={values.floor_total} onChange={e => set('floor_total', e.target.value)} />
            </div>
          </FormSection>
        )}

        <FormSection label="Форма оплаты">
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => togglePayment(value)}
                className={`chip press-scale ${values.conditions.includes(value) ? 'chip-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </FormSection>

        <FormSection label="Метки (через запятую)">
          <input
            className="input-field"
            placeholder="Срочно, Эксклюзив, Торг"
            value={values.tags}
            onChange={e => set('tags', e.target.value)}
          />
        </FormSection>

        <FormSection label="Описание">
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Подробное описание объекта..."
            value={values.description}
            onChange={e => set('description', e.target.value)}
          />
        </FormSection>

        <FormSection label="Фотографии">
          {pendingFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {pendingFiles.map((f, i) => (
                <div key={i} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="w-20 h-20 object-cover rounded-[14px]"
                  />
                  <button
                    onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                    style={{ background: 'var(--ios-red)' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <ImageUploader
            onUpload={async (file) => setPendingFiles(prev => [...prev, file])}
            maxFiles={10}
          />
          <p className="text-[12px] mt-1" style={{ color: 'var(--label-tertiary)' }}>
            Фото загрузятся после создания объекта
          </p>
        </FormSection>

      </div>

      <div className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))', background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)' }}>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!values.price || !values.property_type}
          loading={createMutation.isPending || uploadingPhotos}
        >
          {uploadingPhotos
            ? 'Загрузка фото...'
            : pendingFiles.length > 0
              ? `Добавить объект + ${pendingFiles.length} фото`
              : 'Добавить объект'}
        </Button>
      </div>
    </div>
  );
}
