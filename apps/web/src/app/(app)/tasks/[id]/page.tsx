'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type Task, type TaskComment } from '@/lib/api/tasks';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';

interface Props {
  params: Promise<{ id: string }>;
}

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

const ALL_STATUSES: TaskStatus[] = ['new', 'in_progress', 'waiting', 'done', 'overdue', 'cancelled'];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`;
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b" style={{ borderColor: 'var(--separator)' }}>
      <span className="text-[13px] flex-shrink-0" style={{ color: 'var(--label-tertiary)' }}>{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function EntityChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}>
      <span
        className="text-[12px] px-2.5 py-1 rounded-full font-medium press-scale inline-block"
        style={{ background: 'rgba(0,122,255,0.12)', color: 'var(--ios-blue)' }}
      >
        {label}
      </span>
    </Link>
  );
}

export default function TaskDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: ['tasks', id],
    queryFn: () => tasksApi.detail(id),
  });

  const { data: rawComments } = useQuery<TaskComment[]>({
    queryKey: ['tasks', id, 'comments'],
    queryFn: () => tasksApi.getComments(id),
    enabled: !!task,
  });

  const comments: TaskComment[] = Array.isArray(rawComments) ? rawComments : [];

  const [statusOpen, setStatusOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setStatusOpen(false);
    },
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) => tasksApi.addComment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', id, 'comments'] });
      setCommentText('');
    },
  });

  if (taskLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--separator)', borderTopColor: 'var(--ios-blue)' }}
        />
      </div>
    );
  }

  if (!task) return null;

  const priority = task.priority as TaskPriority;
  const status = task.status as TaskStatus;

  const linkedEntities = [
    task.demand_id && { label: `Клиент: ${task.demand_id.slice(0, 8)}…`, href: `/demand/${task.demand_id}` },
    task.property_id && { label: `Объект: ${task.property_id.slice(0, 8)}…`, href: `/properties/${task.property_id}` },
    task.complex_id && { label: `ЖК: ${task.complex_id.slice(0, 8)}…`, href: `/complexes/${task.complex_id}` },
    task.deal_id && { label: `Сделка: ${task.deal_id.slice(0, 8)}…`, href: `/deals/${task.deal_id}` },
  ].filter(Boolean) as { label: string; href: string }[];

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
            Задача #{task.display_id}
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 pb-32 flex flex-col gap-4">

        {/* Title + description */}
        <div
          className="squircle-card p-4"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
        >
          <div
            className="h-0.5 w-full rounded-full mb-4"
            style={{ background: PRIORITY_COLORS[priority] }}
          />
          <h2 className="text-[18px] font-bold leading-snug" style={{ color: 'var(--label-primary)' }}>
            {task.title}
          </h2>
          {task.description && (
            <p className="text-[14px] mt-2 leading-relaxed" style={{ color: 'var(--label-secondary)' }}>
              {task.description}
            </p>
          )}
        </div>

        {/* Info rows */}
        <div
          className="squircle-card px-4"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
        >
          <InfoRow label="Срок">
            <span className="text-[14px] font-medium" style={{ color: 'var(--label-primary)' }}>
              {formatDateTime(task.due_at)}
            </span>
          </InfoRow>

          <InfoRow label="Приоритет">
            <span
              className="text-[13px] px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: `color-mix(in srgb, ${PRIORITY_COLORS[priority]} 15%, transparent)`,
                color: PRIORITY_COLORS[priority],
              }}
            >
              {PRIORITY_LABELS[priority]}
            </span>
          </InfoRow>

          <InfoRow label="Статус">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_BADGE[status]} size="sm">
                {STATUS_LABELS[status]}
              </Badge>
              <button
                onClick={() => setStatusOpen((o) => !o)}
                className="text-[12px] press-scale"
                style={{ color: 'var(--ios-blue)' }}
              >
                Изменить
              </button>
            </div>
          </InfoRow>

          <InfoRow label="Создана">
            <span className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
              {formatDateTime(task.created_at)}
            </span>
          </InfoRow>
        </div>

        {/* Status picker */}
        {statusOpen && (
          <div
            className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            <span className="section-label mb-3 block">Выберите статус</span>
            <div className="flex gap-2 flex-wrap">
              {ALL_STATUSES.map((s) => {
                const isActive = s === status;
                return (
                  <button
                    key={s}
                    onClick={() => updateMutation.mutate({ status: s })}
                    disabled={isActive || updateMutation.isPending}
                    className="press-scale px-3 py-1.5 rounded-full text-[13px] font-medium"
                    style={{
                      background: isActive ? 'var(--ios-blue)' : 'var(--fill-tertiary)',
                      color: isActive ? '#fff' : 'var(--label-secondary)',
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Linked entities */}
        {linkedEntities.length > 0 && (
          <div
            className="squircle-card p-4"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            <span className="section-label mb-3 block">Связанные объекты</span>
            <div className="flex gap-2 flex-wrap">
              {linkedEntities.map(({ label, href }) => (
                <EntityChip key={href} label={label} href={href} />
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div
          className="squircle-card p-4"
          style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
        >
          <span className="section-label mb-3 block">Комментарии ({comments.length})</span>

          {comments.length === 0 ? (
            <p className="text-[13px] text-center py-4" style={{ color: 'var(--label-tertiary)' }}>
              Пока нет комментариев
            </p>
          ) : (
            <div className="flex flex-col gap-3 mb-4">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl"
                  style={{ background: 'var(--fill-tertiary)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                      {c.author_name ?? 'Агент'}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>
                      {formatDateTime(c.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--label-secondary)' }}>
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2 items-end">
            <textarea
              className="input-field resize-none flex-1"
              rows={2}
              placeholder="Написать комментарий..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              onClick={() => {
                if (commentText.trim()) commentMutation.mutate(commentText.trim());
              }}
              disabled={!commentText.trim() || commentMutation.isPending}
              className="w-10 h-10 rounded-xl flex items-center justify-center press-scale flex-shrink-0"
              style={{
                background: commentText.trim() ? 'var(--ios-blue)' : 'var(--fill-tertiary)',
                color: commentText.trim() ? '#fff' : 'var(--label-tertiary)',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
