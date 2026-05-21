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
import { useComplexes } from '@/lib/hooks/queries/useComplexes';
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
  { value: 'private', label: 'Личный'    },
  { value: 'shared',  label: 'Агентство' },
  { value: 'public',  label: 'Публичный' },
];

const STATUS_OPTIONS = [
  { value: 'active',     label: 'Активный' },
  { value: 'sold',       label: 'Продан'   },
  { value: 'withdrawn',  label: 'Снят'     },
];

const LISTING_OPTIONS = [
  { value: 'sale', label: 'Продажа' },
  { value: 'rent', label: 'Аренда'  },
];

const RENOVATION_OPTIONS = [
  { value: 'none',     label: 'Без отделки'   },
  { value: 'rough',    label: 'Черновая'      },
  { value: 'cosmetic', label: 'Косметический' },
  { value: 'euro',     label: 'Евро'          },
  { value: 'clean',    label: 'Чистовая'      },
  { value: 'designer', label: 'Дизайнерский'  },
];

const BATHROOM_OPTIONS = [
  { value: 'combined',   label: 'Совмещённый' },
  { value: 'separate',   label: 'Раздельный'  },
  { value: 'two',        label: '2 санузла'   },
  { value: 'three_plus', label: '3+ санузла'  },
];

const ROOM_TYPE_OPTIONS = [
  { value: 'isolated',    label: 'Изолированные' },
  { value: 'adjacent',    label: 'Смежные'       },
  { value: 'studio',      label: 'Студия'        },
  { value: 'free_layout', label: 'Свободная планировка' },
];

const BUILDING_STATUS_OPTIONS = [
  { value: 'delivered',         label: 'Сдан'           },
  { value: 'under_construction', label: 'Строится'      },
];

const FURNITURE_OPTIONS = [
  { value: 'none',     label: 'Без мебели'   },
  { value: 'storage',  label: 'Хранение'     },
  { value: 'sleeping', label: 'Спальное'     },
  { value: 'kitchen',  label: 'Кухня'        },
  { value: 'all',      label: 'Полная'       },
];

const UTILITIES_OPTIONS = [
  { value: 'electricity', label: 'Электричество' },
  { value: 'gas',         label: 'Газ'           },
  { value: 'water',       label: 'Водопровод'    },
  { value: 'sewage',      label: 'Канализация'   },
  { value: 'internet',    label: 'Интернет'      },
];

const COMMISSION_TYPE_OPTIONS = [
  { value: 'fixed',   label: 'Фиксированная' },
  { value: 'percent', label: 'Процент %'     },
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

function ChipGroup<T extends string>({
  options, value, onChange, multi,
}: {
  options: { value: T; label: string }[];
  value: T | T[];
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const isActive = (v: T) =>
    multi ? (value as T[]).includes(v) : value === v;
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`chip press-scale ${isActive(o.value) ? 'chip-active' : ''}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function EditPropertyPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: property, isLoading } = useProperty(id);
  const { data: complexes = [] } = useComplexes();

  // Base fields
  const [price, setPrice] = useState('');
  const [netPrice, setNetPrice] = useState('');
  const [agentCommission, setAgentCommission] = useState('');
  const [commissionType, setCommissionType] = useState('fixed');
  const [status, setStatus] = useState('active');
  const [listingType, setListingType] = useState('sale');
  const [visibility, setVisibility] = useState<VisibilityStatus>('private');
  const [fromRealtor, setFromRealtor] = useState(false);
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [conditions, setConditions] = useState<PaymentForm[]>([]);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [complexId, setComplexId] = useState<string | undefined>();

  // Apartment/flat fields
  const [areaSqm, setAreaSqm] = useState('');
  const [kitchenArea, setKitchenArea] = useState('');
  const [livingArea, setLivingArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [floor, setFloor] = useState('');
  const [floorTotal, setFloorTotal] = useState('');
  const [ceilingHeight, setCeilingHeight] = useState('');
  const [renovation, setRenovation] = useState('');
  const [bathroomType, setBathroomType] = useState('');
  const [roomType, setRoomType] = useState('');
  const [furniture, setFurniture] = useState<string[]>([]);
  const [hasLoggia, setHasLoggia] = useState(false);
  const [hasBalcony, setHasBalcony] = useState(false);
  const [hasWardrobe, setHasWardrobe] = useState(false);
  const [hasPanoramic, setHasPanoramic] = useState(false);
  const [warmFloor, setWarmFloor] = useState(false);

  // New building fields
  const [buildingStatus, setBuildingStatus] = useState('');
  const [deliveryYear, setDeliveryYear] = useState('');
  const [deliveryQuarter, setDeliveryQuarter] = useState('');

  // House fields
  const [plotArea, setPlotArea] = useState('');
  const [secondHouseArea, setSecondHouseArea] = useState('');
  const [houseFloors, setHouseFloors] = useState('');
  const [utilities, setUtilities] = useState<string[]>([]);

  // Land fields
  const [cadastralNumber, setCadastralNumber] = useState('');

  const [saveError, setSaveError] = useState<string | null>(null);

  const propertyType = property?.property_type as PropertyType | undefined;
  const isApartment = ['apartment', 'resale', 'new_building'].includes(propertyType ?? '');
  const isNewBuilding = propertyType === 'new_building';
  const isHouse = propertyType === 'house';
  const isLand = propertyType === 'land';

  useEffect(() => {
    if (!property) return;
    setPrice(String(property.price ?? ''));
    setNetPrice(String(property.net_price ?? ''));
    setAgentCommission(String(property.agent_commission ?? ''));
    setCommissionType(property.commission_type ?? 'fixed');
    setStatus(property.status ?? 'active');
    setListingType(property.listing_type ?? 'sale');
    setVisibility((property.visibility_status ?? 'private') as VisibilityStatus);
    setFromRealtor(property.from_realtor ?? false);
    setDistrict(property.district ?? '');
    setStreet(property.street ?? '');
    setHouseNumber(property.house_number ?? '');
    setConditions((property.conditions ?? []) as PaymentForm[]);
    setTags((property.tags ?? []).join(', '));
    setDescription(property.description ?? '');
    setComplexId(property.complex_id ?? undefined);
    setAreaSqm(String(property.area_sqm ?? ''));
    setKitchenArea(String(property.kitchen_area ?? ''));
    setLivingArea(String(property.living_area ?? ''));
    setRooms(String(property.rooms ?? ''));
    setFloor(String(property.floor ?? ''));
    setFloorTotal(String(property.floor_total ?? ''));
    setCeilingHeight(String(property.ceiling_height ?? ''));
    setRenovation(property.renovation ?? '');
    setBathroomType(property.bathroom_type ?? '');
    setRoomType(property.room_type ?? '');
    setFurniture(property.furniture ?? []);
    setHasLoggia(property.has_loggia ?? false);
    setHasBalcony(property.has_balcony ?? false);
    setHasWardrobe(property.has_wardrobe ?? false);
    setHasPanoramic(property.has_panoramic ?? false);
    setWarmFloor(property.warm_floor ?? false);
    setBuildingStatus(property.building_status ?? '');
    setDeliveryYear(String(property.delivery_year ?? ''));
    setDeliveryQuarter(String(property.delivery_quarter ?? ''));
    setPlotArea(String(property.plot_area ?? ''));
    setSecondHouseArea(String(property.second_house_area ?? ''));
    setHouseFloors(String(property.house_floors ?? ''));
    setUtilities(property.utilities ?? []);
    setCadastralNumber(property.cadastral_number ?? '');
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
    setConditions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }

  function toggleFurniture(v: string) {
    setFurniture(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function toggleUtility(v: string) {
    setUtilities(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function handleSubmit() {
    setSaveError(null);
    updateMutation.mutate({
      price: price ? Number(price) : undefined,
      net_price: netPrice ? Number(netPrice) : undefined,
      agent_commission: agentCommission ? Number(agentCommission) : undefined,
      commission_type: commissionType || undefined,
      status: status || undefined,
      listing_type: listingType || undefined,
      visibility_status: visibility,
      from_realtor: fromRealtor,
      district: district || undefined,
      street: street || undefined,
      house_number: houseNumber || undefined,
      conditions,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      description: description || undefined,
      complex_id: complexId || undefined,
      area_sqm: areaSqm ? Number(areaSqm) : undefined,
      kitchen_area: kitchenArea ? Number(kitchenArea) : undefined,
      living_area: livingArea ? Number(livingArea) : undefined,
      rooms: rooms ? Number(rooms) : undefined,
      floor: floor ? Number(floor) : undefined,
      floor_total: floorTotal ? Number(floorTotal) : undefined,
      ceiling_height: ceilingHeight ? Number(ceilingHeight) : undefined,
      renovation: renovation || undefined,
      bathroom_type: bathroomType || undefined,
      room_type: roomType || undefined,
      furniture: furniture.length ? furniture : undefined,
      has_loggia: hasLoggia,
      has_balcony: hasBalcony,
      has_wardrobe: hasWardrobe,
      has_panoramic: hasPanoramic,
      warm_floor: warmFloor,
      building_status: buildingStatus || undefined,
      delivery_year: deliveryYear ? Number(deliveryYear) : undefined,
      delivery_quarter: deliveryQuarter ? Number(deliveryQuarter) : undefined,
      plot_area: plotArea ? Number(plotArea) : undefined,
      second_house_area: secondHouseArea ? Number(secondHouseArea) : undefined,
      house_floors: houseFloors ? Number(houseFloors) : undefined,
      utilities: utilities.length ? utilities : undefined,
      cadastral_number: cadastralNumber || undefined,
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
                  <Badge variant="info" size="sm" className="absolute top-1 left-1 text-[10px]">Обложка</Badge>
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

        {/* Status */}
        <FormSection label="Статус объекта">
          <ChipGroup options={STATUS_OPTIONS as { value: string; label: string }[]}
            value={status} onChange={setStatus as (v: string) => void} />
        </FormSection>

        {/* Listing type */}
        <FormSection label="Тип сделки">
          <ChipGroup options={LISTING_OPTIONS as { value: string; label: string }[]}
            value={listingType} onChange={setListingType as (v: string) => void} />
        </FormSection>

        {/* Visibility */}
        <FormSection label="Видимость">
          <ChipGroup options={VISIBILITY_OPTIONS} value={visibility} onChange={setVisibility} />
        </FormSection>

        {/* From realtor */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[14px]" style={{ color: 'var(--label-primary)' }}>От риэлтора</span>
          <button
            onClick={() => setFromRealtor(v => !v)}
            className="w-12 h-7 rounded-full relative transition-colors"
            style={{ background: fromRealtor ? 'var(--ios-green)' : 'var(--fill-tertiary)' }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
              style={{ left: fromRealtor ? 'calc(100% - 26px)' : 2 }}
            />
          </button>
        </div>

        {/* Prices */}
        <FormSection label="Цена продажи, ₽ *">
          <input type="number" className="input-field" placeholder="0"
            value={price} onChange={e => setPrice(e.target.value)} />
        </FormSection>

        <FormSection label="Цена на руки, ₽">
          <input type="number" className="input-field" placeholder="0"
            value={netPrice} onChange={e => setNetPrice(e.target.value)} />
        </FormSection>

        <FormSection label="Комиссия риэлтора">
          <div className="flex gap-2">
            <input type="number" className="input-field" placeholder="0"
              value={agentCommission} onChange={e => setAgentCommission(e.target.value)} />
            <ChipGroup options={COMMISSION_TYPE_OPTIONS as { value: string; label: string }[]}
              value={commissionType} onChange={setCommissionType as (v: string) => void} />
          </div>
        </FormSection>

        {/* Location */}
        <FormSection label="Район">
          <div className="flex gap-2 flex-wrap mb-1">
            {DISTRICTS.map(d => (
              <button key={d} onClick={() => setDistrict(prev => prev === d ? '' : d)}
                className={`chip press-scale ${district === d ? 'chip-active' : ''}`}>{d}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input-field" placeholder="Улица"
              value={street} onChange={e => setStreet(e.target.value)} />
            <input className="input-field" style={{ width: 96 }} placeholder="Дом"
              value={houseNumber} onChange={e => setHouseNumber(e.target.value)} />
          </div>
        </FormSection>

        {/* Complex */}
        {complexes.length > 0 && (
          <FormSection label="Жилой комплекс">
            <select className="input-field" value={complexId ?? ''}
              onChange={e => setComplexId(e.target.value || undefined)}>
              <option value="">— Не привязан к ЖК —</option>
              {complexes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormSection>
        )}

        {/* Apartment-specific fields */}
        {isApartment && (
          <>
            <FormSection label="Площадь">
              <div className="flex gap-2">
                <input type="number" className="input-field" placeholder="Общая м²"
                  value={areaSqm} onChange={e => setAreaSqm(e.target.value)} />
                <input type="number" className="input-field" placeholder="Кухня м²"
                  value={kitchenArea} onChange={e => setKitchenArea(e.target.value)} />
                <input type="number" className="input-field" placeholder="Жилая м²"
                  value={livingArea} onChange={e => setLivingArea(e.target.value)} />
              </div>
            </FormSection>

            <FormSection label="Комнаты и этаж">
              <div className="flex gap-2">
                <input type="number" className="input-field" placeholder="Комнат"
                  value={rooms} onChange={e => setRooms(e.target.value)} />
                <input type="number" className="input-field" placeholder="Этаж"
                  value={floor} onChange={e => setFloor(e.target.value)} />
                <input type="number" className="input-field" placeholder="Всего этажей"
                  value={floorTotal} onChange={e => setFloorTotal(e.target.value)} />
              </div>
            </FormSection>

            <FormSection label="Высота потолков, м">
              <input type="number" className="input-field" placeholder="2.7"
                value={ceilingHeight} onChange={e => setCeilingHeight(e.target.value)} />
            </FormSection>

            <FormSection label="Ремонт">
              <ChipGroup options={RENOVATION_OPTIONS as { value: string; label: string }[]}
                value={renovation} onChange={setRenovation as (v: string) => void} />
            </FormSection>

            <FormSection label="Санузел">
              <ChipGroup options={BATHROOM_OPTIONS as { value: string; label: string }[]}
                value={bathroomType} onChange={setBathroomType as (v: string) => void} />
            </FormSection>

            <FormSection label="Тип комнат">
              <ChipGroup options={ROOM_TYPE_OPTIONS as { value: string; label: string }[]}
                value={roomType} onChange={setRoomType as (v: string) => void} />
            </FormSection>

            <FormSection label="Мебель">
              <div className="flex gap-2 flex-wrap">
                {FURNITURE_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => toggleFurniture(o.value)}
                    className={`chip press-scale ${furniture.includes(o.value) ? 'chip-active' : ''}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection label="Особенности">
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Лоджия',           val: hasLoggia,    set: setHasLoggia    },
                  { label: 'Балкон',            val: hasBalcony,   set: setHasBalcony   },
                  { label: 'Гардеробная',       val: hasWardrobe,  set: setHasWardrobe  },
                  { label: 'Панорамные окна',   val: hasPanoramic, set: setHasPanoramic },
                  { label: 'Тёплый пол',        val: warmFloor,    set: setWarmFloor    },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex items-center justify-between px-1">
                    <span className="text-[14px]" style={{ color: 'var(--label-primary)' }}>{label}</span>
                    <button
                      onClick={() => set(v => !v)}
                      className="w-12 h-7 rounded-full relative transition-colors"
                      style={{ background: val ? 'var(--ios-green)' : 'var(--fill-tertiary)' }}
                    >
                      <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform"
                        style={{ left: val ? 'calc(100% - 26px)' : 2 }} />
                    </button>
                  </div>
                ))}
              </div>
            </FormSection>
          </>
        )}

        {/* New building specific */}
        {isNewBuilding && (
          <>
            <FormSection label="Статус дома">
              <ChipGroup options={BUILDING_STATUS_OPTIONS as { value: string; label: string }[]}
                value={buildingStatus} onChange={setBuildingStatus as (v: string) => void} />
            </FormSection>

            <FormSection label="Срок сдачи">
              <div className="flex gap-2">
                <input type="number" className="input-field" placeholder="Год (2025)"
                  value={deliveryYear} onChange={e => setDeliveryYear(e.target.value)} />
                <select className="input-field" style={{ width: 120 }}
                  value={deliveryQuarter} onChange={e => setDeliveryQuarter(e.target.value)}>
                  <option value="">Квартал</option>
                  <option value="1">I кв.</option>
                  <option value="2">II кв.</option>
                  <option value="3">III кв.</option>
                  <option value="4">IV кв.</option>
                </select>
              </div>
            </FormSection>
          </>
        )}

        {/* House specific */}
        {isHouse && (
          <>
            <FormSection label="Площадь, м²">
              <input type="number" className="input-field" placeholder="Площадь дома"
                value={areaSqm} onChange={e => setAreaSqm(e.target.value)} />
            </FormSection>

            <FormSection label="Участок и этажность">
              <div className="flex gap-2">
                <input type="number" className="input-field" placeholder="Участок (соток)"
                  value={plotArea} onChange={e => setPlotArea(e.target.value)} />
                <input type="number" className="input-field" placeholder="Второй дом м²"
                  value={secondHouseArea} onChange={e => setSecondHouseArea(e.target.value)} />
                <input type="number" className="input-field" style={{ width: 80 }} placeholder="Этажей"
                  value={houseFloors} onChange={e => setHouseFloors(e.target.value)} />
              </div>
            </FormSection>

            <FormSection label="Коммуникации">
              <div className="flex gap-2 flex-wrap">
                {UTILITIES_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => toggleUtility(o.value)}
                    className={`chip press-scale ${utilities.includes(o.value) ? 'chip-active' : ''}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </FormSection>
          </>
        )}

        {/* Land specific */}
        {isLand && (
          <>
            <FormSection label="Участок (соток)">
              <input type="number" className="input-field" placeholder="0"
                value={plotArea} onChange={e => setPlotArea(e.target.value)} />
            </FormSection>

            <FormSection label="Кадастровый номер">
              <input className="input-field" placeholder="00:00:000000:0"
                value={cadastralNumber} onChange={e => setCadastralNumber(e.target.value)} />
            </FormSection>

            <FormSection label="Коммуникации">
              <div className="flex gap-2 flex-wrap">
                {UTILITIES_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => toggleUtility(o.value)}
                    className={`chip press-scale ${utilities.includes(o.value) ? 'chip-active' : ''}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </FormSection>
          </>
        )}

        {/* Payment forms */}
        <FormSection label="Формы оплаты">
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_OPTIONS.map(({ value, label }) => (
              <button key={value} onClick={() => togglePayment(value)}
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
