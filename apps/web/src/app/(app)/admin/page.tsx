'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAppStore } from '@/lib/store/useAppStore';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';
import { PermissionGate } from '@/components/molecules/PermissionGate';
import { usePendingSharingRequests, useApproveSharing, useDenySharing } from '@/lib/hooks/queries/useSharing';
import { formatDate } from '@/lib/utils/format';
import type { User } from '@crm/shared-types';

interface AuditLog {
  id: string;
  actor_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  created_at: string;
  actor?: { full_name: string };
}

function useUsers() {
  return useQuery<User[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => apiClient.get<{ data: User[] }>('/users').then(r => r.data.data),
  });
}

function useAuditLogs() {
  return useQuery<AuditLog[]>({
    queryKey: ['admin', 'audit'],
    queryFn: () => apiClient.get<{ data: AuditLog[] }>('/audit-log').then(r => r.data.data),
  });
}

export default function AdminPage() {
  const currentUser = useAppStore(s => s.user);
  const isSuperadmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuperadmin;

  if (!isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-[var(--label-secondary)]">Нет доступа</p>
      </div>
    );
  }

  return (
    <>
      <GlassNavBar title="Управление" />

      <div className="px-4 py-6 flex flex-col gap-8">
        <UsersSection isSuperadmin={isSuperadmin} />
        <SharingRequestsSection />
        {isSuperadmin && <AuditSection />}
      </div>
    </>
  );
}

function UsersSection({ isSuperadmin }: { isSuperadmin: boolean }) {
  const { data: users = [] } = useUsers();
  const [editUser, setEditUser] = useState<User | null>(null);

  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
        Сотрудники ({users.length})
      </h2>
      <div className="flex flex-col gap-3">
        {users.map(u => (
          <div key={u.id} className="glass-card squircle-card p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--label-primary)]">{u.full_name}</p>
              <p className="text-xs text-[var(--label-secondary)]">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.role === 'superadmin' ? 'destructive' : 'default'} className="text-xs">
                {u.role}
              </Badge>
              {isSuperadmin && (
                <button
                  onClick={() => setEditUser(u)}
                  className="text-xs text-[var(--ios-blue)] font-medium px-2 py-1 rounded-[8px] bg-[var(--ios-blue)]/10"
                >
                  Права
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editUser && (
        <PermissionsSheet user={editUser} onClose={() => setEditUser(null)} />
      )}
    </section>
  );
}

const PERMISSION_LABELS: Record<string, string> = {
  can_view_global_database: 'Видеть общую базу',
  can_export_data:          'Экспортировать данные',
  can_see_financials:       'Видеть финансы',
  can_delete_records:       'Удалять записи',
};

function PermissionsSheet({ user, onClose }: { user: User; onClose: () => void }) {
  const qc = useQueryClient();
  const [flags, setFlags] = useState(user.permission_flags ?? {});

  const saveMutation = useMutation({
    mutationFn: () => apiClient.patch(`/users/${user.id}/permissions`, flags),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  return (
    <BottomSheet isOpen onClose={onClose} title={`Права: ${user.full_name}`}>
      <div className="flex flex-col gap-4 py-2">
        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between">
            <span className="text-sm text-[var(--label-primary)]">{label}</span>
            <input
              type="checkbox"
              className="w-5 h-5 accent-[var(--ios-blue)]"
              checked={Boolean((flags as unknown as Record<string, boolean>)[key])}
              onChange={e => setFlags(f => ({ ...f, [key]: e.target.checked }))}
            />
          </label>
        ))}
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} className="w-full mt-2">
          Сохранить
        </Button>
      </div>
    </BottomSheet>
  );
}

function SharingRequestsSection() {
  const { data: requests = [] } = usePendingSharingRequests();
  const approve = useApproveSharing();
  const deny = useDenySharing();

  if (requests.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
        Запросы доступа ({requests.length})
      </h2>
      <div className="flex flex-col gap-2">
        {requests.map(req => (
          <div key={req.id} className="glass-card squircle-card p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--label-primary)]">
                Объект #{req.property_id.slice(0, 8)}
              </p>
              <p className="text-xs text-[var(--label-secondary)] mt-0.5">
                {formatDate(req.created_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => deny.mutate(req.id)}
                loading={deny.isPending}
              >
                Отклонить
              </Button>
              <Button
                size="sm"
                onClick={() => approve.mutate(req.id)}
                loading={approve.isPending}
              >
                Разрешить
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditSection() {
  const { data: logs = [] } = useAuditLogs();

  return (
    <section>
      <h2 className="text-sm font-semibold text-[var(--label-secondary)] uppercase tracking-wide mb-3">
        Журнал аудита
      </h2>
      <div className="flex flex-col gap-2">
        {logs.slice(0, 50).map(log => (
          <div key={log.id} className="glass-card squircle-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--label-primary)]">{log.action_type}</span>
              <span className="text-xs text-[var(--label-tertiary)]">{formatDate(log.created_at)}</span>
            </div>
            <p className="text-xs text-[var(--label-secondary)] mt-0.5">
              {log.actor?.full_name ?? log.actor_id} → {log.target_type}
            </p>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-[var(--label-tertiary)] text-center py-6">Нет записей</p>
        )}
      </div>
    </section>
  );
}
