import type { PropertyType, PaymentForm } from './property.js';

export type KanbanStatus =
  | 'new'
  | 'qualifying'
  | 'selection'
  | 'viewings'
  | 'thinking'
  | 'negotiation'
  | 'deal';

export type RepairType =
  | 'no_repair'
  | 'cosmetic'
  | 'euro'
  | 'designer'
  | 'new_building_finish';

export interface Demand {
  id: string;
  agent_id: string;
  buyer_name: string;
  buyer_phone: string;
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
  kanban_status: KanbanStatus;
  notes: string | null;
  internal_tags: string[];
  created_at: string;
  updated_at: string;
}

export const KANBAN_STAGES: { value: KanbanStatus; label: string }[] = [
  { value: 'new', label: 'Новый' },
  { value: 'qualifying', label: 'Выявление потребности' },
  { value: 'selection', label: 'Подбор объектов' },
  { value: 'viewings', label: 'Просмотры' },
  { value: 'thinking', label: 'Думает' },
  { value: 'negotiation', label: 'Торг' },
  { value: 'deal', label: 'Сделка' },
];
