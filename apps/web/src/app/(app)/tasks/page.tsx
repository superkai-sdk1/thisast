'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, SlidersHorizontal, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type Task, type TaskFilter } from '@/lib/api/tasks';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { Badge } from '@/components/atoms/Badge';

type ViewMode = 'list' | 'kanban' | 'calendar';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'new' | 'in_progress' | 'waiting' | 'done' | 'overdue' | 'cancelled';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'var(--label-tertiary)',
  medium: 'var(--ios-blue)',
  high: 'var(--ios-orange)',
  urgent: 'var(--ios-red)',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  waiting: 'Ожидание',
  done: 'Выполнена',
  overdue: 'Просрочена',
  cancelled: 'Отменена',
};

const STATUS_BADGE: Record<TaskStatus, 'default' | 'success' | 'warning' | 'info' | 'purple'> = {
  new: 'info',
  in_progress: 'warning',
  waiting: 'default',
  done: 'success',
  overdue: 'purple',
  cancelled: 'default',
};

const KANBAN_COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'waiting', label: 'Ожидание' },
  { value: 'done', label: 'Выполнена' },
];

const KANBAN_DOT_COLORS: Record<string, string> = {
  new: 'var(--ios-blue)',
  in_progress: 'var(--ios-orange)',
  waiting: 'var(--label-tertiary)',
  done: 'var(--ios-green)',
};

function useTasks(filter?: TaskFilter) {
  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => tasksApi.list(filter),
  });
}

function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

function formatDueDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return 'Сегодня';
  if (sameDay(d, tomorrow)) return 'Завтра';

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>('list');
  const { data: rawTasks, isLoading } = useTasks();

  const tasks: Task[] = useMemo(() => {
    if (!rawTasks) return [];
    if (Array.isArray(rawTasks)) return rawTasks;
    const maybe = rawTasks as { data?: Task[] };
    return Array.isArray(maybe.data) ? maybe.data : [];
  }, [rawTasks]);

  return (
    <>
      <GlassNavBar
        title="Задачи"
        right={
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ color: 'var(--label-tertiary)' }}
          >
            <SlidersHorizontal size={18} />
          </button>
        }
      />

      <div className="sticky top-[calc(44px+env(safe-area-inset-top))] z-10 glass-nav border-b-0 px-4 py-2.5">
        <SegmentedControl
          options={[
            { value: 'list', label: 'Список' },
            { value: 'kanban', label: 'Канбан' },
            { value: 'calendar', label: 'Календарь' },
          ]}
          value={view}
          onChange={(v) => setView(v as ViewMode)}
        />
      </div>

      <div className="gradient-mesh min-h-full">
        {view === 'list' && <TaskList tasks={tasks} isLoading={isLoading} />}
        {view === 'kanban' && <TaskKanban tasks={tasks} isLoading={isLoading} />}
        {view === 'calendar' && <TaskCalendar tasks={tasks} isLoading={isLoading} />}
      </div>

      <Link href="/tasks/new" className="fab" aria-label="Добавить задачу">
        <Plus size={24} strokeWidth={2.2} />
      </Link>
    </>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 px-4">
      <div
        className="w-16 h-16 rounded-[20px] flex items-center justify-center"
        style={{ background: 'var(--fill-tertiary)' }}
      >
        <ClipboardList size={28} style={{ color: 'var(--label-tertiary)' }} />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>
          Нет задач
        </p>
        <p className="text-[13px] mt-1" style={{ color: 'var(--label-tertiary)' }}>
          Создайте первую задачу
        </p>
      </div>
    </div>
  );
}

function TaskList({ tasks, isLoading }: { tasks: Task[]; isLoading?: boolean }) {
  if (isLoading) return <Spinner />;
  if (tasks.length === 0) return <EmptyState />;

  return (
    <div className="px-4 pt-3 pb-6 flex flex-col gap-3">
      {tasks.map((t) => (
        <Link key={t.id} href={`/tasks/${t.id}`}>
          <TaskCard task={t} />
        </Link>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priority = task.priority as TaskPriority;
  const status = task.status as TaskStatus;

  return (
    <article
      className="squircle-card overflow-hidden press-scale"
      style={{
        background: 'var(--bg-elevated)',
        border: '0.5px solid var(--separator)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{ background: PRIORITY_COLORS[priority] }}
      />
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold flex-1 min-w-0 truncate" style={{ color: 'var(--label-primary)' }}>
            {task.title}
          </p>
          <Badge variant={STATUS_BADGE[status]} size="sm">
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-[12px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: `color-mix(in srgb, ${PRIORITY_COLORS[priority]} 15%, transparent)`, color: PRIORITY_COLORS[priority] }}
          >
            {PRIORITY_LABELS[priority]}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
            {formatDueDate(task.due_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

function TaskKanban({ tasks, isLoading }: { tasks: Task[]; isLoading?: boolean }) {
  const updateTask = useUpdateTask();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    updateTask.mutate({ id: task.id, data: { status: over.id as TaskStatus } });
  }

  if (isLoading) return <Spinner />;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pt-3 pb-6">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.value);
          const dotColor = KANBAN_DOT_COLORS[col.value] ?? 'var(--label-tertiary)';
          return (
            <div key={col.value} className="flex-shrink-0 w-60">
              <div
                className="squircle-card p-3 mb-2 flex items-center justify-between"
                style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                  <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                    {col.label}
                  </span>
                </div>
                <span
                  className="text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--fill-secondary)', color: 'var(--label-tertiary)' }}
                >
                  {colTasks.length}
                </span>
              </div>

              <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
                id={col.value}
              >
                <div className="flex flex-col gap-2">
                  {colTasks.map((task) => {
                    const priority = task.priority as TaskPriority;
                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <article
                          className="squircle-card p-3 cursor-grab active:cursor-grabbing press-scale"
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '0.5px solid var(--separator)',
                            boxShadow: 'var(--shadow-card)',
                          }}
                        >
                          <div
                            className="w-1 h-full rounded-full float-left mr-2.5"
                            style={{ background: PRIORITY_COLORS[priority], width: 3, minHeight: 32 }}
                          />
                          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                            {task.title}
                          </p>
                          <p className="text-[11px] mt-1" style={{ color: 'var(--label-tertiary)' }}>
                            {formatDueDate(task.due_at)}
                          </p>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}

function TaskCalendar({ tasks, isLoading }: { tasks: Task[]; isLoading?: boolean }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first: 0=Mon, 6=Sun
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Build a map: day -> tasks
  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (const t of tasks) {
      const d = new Date(t.due_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    }
    return map;
  }, [tasks, year, month]);

  const selectedTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  if (isLoading) return <Spinner />;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-4 pt-3 pb-32">
      {/* Month navigation */}
      <div
        className="squircle-card p-4 mb-4"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ background: 'var(--fill-tertiary)', color: 'var(--label-primary)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
            style={{ background: 'var(--fill-tertiary)', color: 'var(--label-primary)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold py-1" style={{ color: 'var(--label-tertiary)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const isSelected = day === selectedDay;
            const hasTasks = (tasksByDay[day]?.length ?? 0) > 0;
            const taskCount = tasksByDay[day]?.length ?? 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className="flex flex-col items-center py-1 rounded-lg press-scale"
                style={{
                  background: isSelected
                    ? 'var(--ios-blue)'
                    : isToday
                    ? 'color-mix(in srgb, var(--ios-blue) 15%, transparent)'
                    : 'transparent',
                }}
              >
                <span
                  className="text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full"
                  style={{
                    color: isSelected
                      ? '#fff'
                      : isToday
                      ? 'var(--ios-blue)'
                      : 'var(--label-primary)',
                    fontWeight: isToday || isSelected ? 700 : 400,
                  }}
                >
                  {day}
                </span>
                {hasTasks && (
                  <div className="flex gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--ios-blue)' }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <div>
          <span className="section-label mb-3 block">
            Задачи на {selectedDay} {MONTH_NAMES[month].toLowerCase()}
          </span>
          {selectedTasks.length === 0 ? (
            <p className="text-[14px] text-center py-6" style={{ color: 'var(--label-tertiary)' }}>
              Нет задач на этот день
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedTasks.map((t) => (
                <Link key={t.id} href={`/tasks/${t.id}`}>
                  <TaskCard task={t} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
