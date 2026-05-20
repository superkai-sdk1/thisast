import type { PropertyType, PaymentForm, RenovationType } from './property';

export type KanbanStatus =
  | 'new'
  | 'qualifying'
  | 'selection'
  | 'viewings'
  | 'thinking'
  | 'negotiation'
  | 'deal';

export type ClientType = 'buyer' | 'seller' | 'renter' | 'landlord';
export type ClientTemperature = 'hot' | 'warm' | 'cold' | 'thinking';
export type MarketType = 'any' | 'new_building' | 'secondary';
export type UtilitiesIncluded = 'not_set' | 'included' | 'separate';

export type RepairType =
  | 'no_repair'
  | 'cosmetic'
  | 'euro'
  | 'designer'
  | 'new_building_finish';

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  buyer: 'Покупатель',
  seller: 'Продавец',
  renter: 'Арендатор',
  landlord: 'Арендодатель',
};

export const TEMPERATURE_LABELS: Record<ClientTemperature, string> = {
  hot: 'Горячий',
  warm: 'Тёплый',
  cold: 'Холодный',
  thinking: 'Думает',
};

export const TEMPERATURE_COLORS: Record<ClientTemperature, string> = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
  thinking: '#8b5cf6',
};

export const MARKET_TYPE_LABELS: Record<MarketType, string> = {
  any: 'Любой',
  new_building: 'Новостройка',
  secondary: 'Вторичка',
};

export const UTILITIES_LABELS: Record<UtilitiesIncluded, string> = {
  not_set: 'Не указано',
  included: 'Включены в стоимость',
  separate: 'Оплачиваются отдельно',
};

export const KANBAN_STAGES: { value: KanbanStatus; label: string }[] = [
  { value: 'new', label: 'Новый' },
  { value: 'qualifying', label: 'Выявление потребности' },
  { value: 'selection', label: 'Подбор объектов' },
  { value: 'viewings', label: 'Просмотры' },
  { value: 'thinking', label: 'Думает' },
  { value: 'negotiation', label: 'Торг' },
  { value: 'deal', label: 'Сделка' },
];

export interface Demand {
  id: string;
  display_id: number;
  agent_id: string;
  // client classification
  client_type: ClientType;
  temperature: ClientTemperature | null;
  is_active: boolean;
  is_contact_overdue: boolean;
  // contacts
  buyer_name: string;
  buyer_phone: string;
  // buyer/renter fields
  market_type: MarketType | null;
  budget_min: number | null;
  budget_max: number;
  property_type: PropertyType;
  rooms: number[];
  districts: string[];
  repair_types: RepairType[];
  payment_forms: PaymentForm[];
  area_min: number | null;
  area_max: number | null;
  floor_min: number | null;
  floor_max: number | null;
  // seller fields
  net_price: number | null;
  // landlord fields
  rent_price: number | null;
  deposit: number | null;
  utilities_included: UtilitiesIncluded;
  // funnel
  kanban_status: KanbanStatus;
  // contact dates
  first_contact_at: string | null;
  last_contact_at: string | null;
  next_contact_at: string | null;
  // notes
  notes: string | null;
  demand_notes: string | null;
  internal_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DemandFilter {
  search?: string;
  client_type?: ClientType;
  temperature?: ClientTemperature;
  is_active?: boolean;
  kanban_status?: KanbanStatus;
  budget_max?: number;
  districts?: string[];
  payment_forms?: PaymentForm[];
  repair_types?: RepairType[];
  page?: number;
  limit?: number;
}
