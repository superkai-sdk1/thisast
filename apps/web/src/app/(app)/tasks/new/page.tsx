'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import { Button } from '@/components/atoms/Button';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Низкий', color: 'var(--label-tertiary)' },
  { value: 'medium', label: 'Средний', color: 'var(--ios-blue)' },
  { value: 'high', label: 'Высокий', color: 'var(--ios-orange)' },
  { value: 'urgent', label: 'Срочный', color: 'var(--ios-red)' },
];

interface FormValues {
  title: string;
  description: string;
  due_at: string;
  priority: TaskPriority;
  demand_id: string;
  property_id: string;
  complex_id: string;
  deal_id: string;
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}

// Default due_at: tomorrow at noon
function defaultDueAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  // Format for datetime-local: YYYY-MM-DDTHH:MM
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00`;
}

export default function NewTaskPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [values, setValues] = useState<FormValues>({
    title: '',
    description: '',
    due_at: defaultDueAt(),
    priority: 'medium',
    demand_id: '',
    property_id: '',
    complex_id: '',
    deal_id: '',
  });

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  const createMutation = useMutation({
    mutationFn: () =>
      tasksApi.create({
        title: values.title,
        description: values.description || null,
        due_at: new Date(values.due_at).toISOString(),
        priority: values.priority,
        status: 'new',
        demand_id: values.demand_id || null,
        property_id: values.property_id || null,
        complex_id: values.complex_id || null,
        deal_id: values.deal_id || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      router.push('/tasks');
    },
  });

  const canSubmit = values.title.trim().length > 0 && values.due_at.length > 0;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <div className="glass-nav sticky top-0 z-20" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between h-11 px-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--ios-blue)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            Новая задача
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-5">

        <FormSection label="Название *">
          <input
            className="input-field"
            placeholder="Что нужно сделать?"
            value={values.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </FormSection>

        <FormSection label="Описание">
          <textarea
            className="input-field resize-none"
            rows={3}
            placeholder="Дополнительные детали..."
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </FormSection>

        <FormSection label="Срок *">
          <input
            className="input-field"
            type="datetime-local"
            value={values.due_at}
            onChange={(e) => set('due_at', e.target.value)}
          />
        </FormSection>

        <FormSection label="Приоритет">
          <div className="flex gap-2 flex-wrap">
            {PRIORITY_OPTIONS.map(({ value, label, color }) => {
              const isActive = values.priority === value;
              return (
                <button
                  key={value}
                  onClick={() => set('priority', value)}
                  className="press-scale px-3 py-1.5 rounded-full text-[13px] font-medium transition-all"
                  style={{
                    background: isActive
                      ? `color-mix(in srgb, ${color} 20%, transparent)`
                      : 'var(--fill-tertiary)',
                    color: isActive ? color : 'var(--label-secondary)',
                    border: `1.5px solid ${isActive ? color : 'transparent'}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </FormSection>

        <FormSection label="ID клиента / объекта / ЖК / сделки (опционально)">
          <input
            className="input-field"
            placeholder="demand_id (UUID)"
            value={values.demand_id}
            onChange={(e) => set('demand_id', e.target.value)}
          />
          <input
            className="input-field"
            placeholder="property_id (UUID)"
            value={values.property_id}
            onChange={(e) => set('property_id', e.target.value)}
          />
          <input
            className="input-field"
            placeholder="complex_id (UUID)"
            value={values.complex_id}
            onChange={(e) => set('complex_id', e.target.value)}
          />
          <input
            className="input-field"
            placeholder="deal_id (UUID)"
            value={values.deal_id}
            onChange={(e) => set('deal_id', e.target.value)}
          />
        </FormSection>

      </div>

      <div
        className="fixed bottom-0 inset-x-0 px-4 pt-4"
        style={{
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, var(--bg-primary) 60%, transparent)',
        }}
      >
        <Button
          className="w-full"
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          loading={createMutation.isPending}
        >
          Создать задачу
        </Button>
      </div>
    </div>
  );
}
