'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAppStore } from '@/lib/store/useAppStore';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { BottomSheet } from '@/components/molecules/BottomSheet';
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

const ROLE_CONFIG: Record<string, { label: string; badge: 'default' | 'warning' | 'destructive' | 'info' }> = {
  superadmin: { label: 'Суперадмин', badge: 'destructive' },
  admin:      { label: 'Администратор', badge: 'warning' },
  agent:      { label: 'Агент', badge: 'default' },
};

const ACTION_CONFIG: Record<string, { icon: string; badge: 'default' | 'warning' | 'destructive' | 'info' }> = {
  VIEW_CONTACT:      { icon: '👁', badge: 'default' },
  DOWNLOAD_PDF:      { icon: '📄', badge: 'info' },
  CHANGE_VISIBILITY: { icon: '🔓', badge: 'warning' },
  DELETE_RECORD:     { icon: '🗑', badge: 'destructive' },
  EXPORT_DATA:       { icon: '📤', badge: 'warning' },
};

export default function AdminPage() {
  const currentUser = useAppStore(s => s.user);
  const isSuperadmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuperadmin;

  if (!isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center flex-col gap-3">
        <Shield size={40} style={{ color: 'var(--label-quaternary)' }} />
        <p className="text-[15px]" style={{ color: 'var(--label-secondary)' }}>Нет доступа</p>
      </div>
    );
  }

  return (
    <>
      <GlassNavBar title="Управление" />

      <div className="gradient-mesh min-h-full">
        <div className="px-4 pt-3 pb-6 flex flex-col gap-5">
          <UsersSection isSuperadmin={isSuperadmin} />
          <SharingRequestsSection />
          {isSuperadmin && <AuditSection />}
        </div>
      </div>
    </>
  );
}

function UsersSection({ isSuperadmin }: { isSuperadmin: boolean }) {
  const { data: users = [] } = useUsers();
  const [editUser, setEditUser] = useState<User | null>(null);

  return (
    <section>
      <p className="section-label px-1">Сотрудники ({users.length})</p>
      <div
        className="squircle-card overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
      >
        {users.map((u, idx) => {
          const roleConf = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.agent;
          const initials = u.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: idx < users.length - 1 ? '0.5px solid var(--separator)' : 'none' }}
            >
              <div
                className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                style={{ background: u.role === 'superadmin' ? 'var(--ios-red)' : u.role === 'admin' ? 'var(--ios-orange)' : 'var(--ios-blue)' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--label-primary)' }}>
                  {u.full_name}
                </p>
                <p className="text-[12px] truncate" style={{ color: 'var(--label-secondary)' }}>{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={roleConf.badge} size="sm">{roleConf.label}</Badge>
                {isSuperadmin && (
                  <button
                    onClick={() => setEditUser(u)}
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-[8px] press-scale"
                    style={{ background: 'rgba(0,122,255,0.10)', color: 'var(--ios-blue)' }}
                  >
                    Права
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editUser && (
        <PermissionsSheet user={editUser} onClose={() => setEditUser(null)} />
      )}
    </section>
  );
}

const PERMISSION_LABELS: Record<string, { label: string; desc: string }> = {
  can_view_global_database: { label: 'Общая база',     desc: 'Видеть объекты всех агентов' },
  can_export_data:          { label: 'Экспорт данных', desc: 'Скачивать базу и отчёты' },
  can_see_financials:       { label: 'Финансы',        desc: 'Видеть комиссии и суммы сделок' },
  can_delete_records:       { label: 'Удаление',       desc: 'Удалять объекты и клиентов' },
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
        {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>{label}</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>{desc}</p>
            </div>
            <button
              onClick={() => setFlags(f => ({ ...f, [key]: !(f as unknown as Record<string, boolean>)[key] }))}
              className="relative w-[51px] h-[31px] rounded-full flex-shrink-0 transition-colors duration-200"
              style={{ background: (flags as unknown as Record<string, boolean>)[key] ? 'var(--ios-blue)' : 'var(--fill-primary)' }}
            >
              <span
                className="absolute top-[3px] w-[25px] h-[25px] rounded-full bg-white transition-transform duration-200"
                style={{
                  left: '3px',
                  transform: (flags as unknown as Record<string, boolean>)[key] ? 'translateX(20px)' : 'translateX(0)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
                }}
              />
            </button>
          </div>
        ))}
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} className="w-full mt-2">
          Сохранить изменения
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
      <p className="section-label px-1">Запросы доступа ({requests.length})</p>
      <div className="flex flex-col gap-2">
        {requests.map(req => (
          <div
            key={req.id}
            className="squircle-card p-4 flex items-center gap-3"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,149,0,0.12)' }}>
              <Users size={18} style={{ color: 'var(--ios-orange)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                Объект #{req.property_id.slice(0, 8)}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                {formatDate(req.created_at)}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => deny.mutate(req.id)}
                disabled={deny.isPending}
                className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
                style={{ background: 'rgba(255,59,48,0.12)', color: 'var(--ios-red)' }}
              >
                <XCircle size={16} />
              </button>
              <button
                onClick={() => approve.mutate(req.id)}
                disabled={approve.isPending}
                className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
                style={{ background: 'rgba(52,199,89,0.12)', color: 'var(--ios-green)' }}
              >
                <CheckCircle size={16} />
              </button>
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
      <p className="section-label px-1">Журнал аудита</p>
      <div
        className="squircle-card overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
      >
        {logs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Clock size={24} style={{ color: 'var(--label-quaternary)' }} />
            <p className="text-[13px]" style={{ color: 'var(--label-tertiary)' }}>Нет записей</p>
          </div>
        )}
        {logs.slice(0, 50).map((log, idx) => {
          const cfg = ACTION_CONFIG[log.action_type];
          return (
            <div
              key={log.id}
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: idx < Math.min(logs.length, 50) - 1 ? '0.5px solid var(--separator)' : 'none' }}
            >
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[16px]"
                style={{ background: 'var(--fill-tertiary)' }}>
                {cfg?.icon ?? '📋'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={cfg?.badge ?? 'default'} size="sm">{log.action_type}</Badge>
                </div>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--label-secondary)' }}>
                  {log.actor?.full_name ?? log.actor_id} → {log.target_type}
                </p>
              </div>
              <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--label-tertiary)' }}>
                {formatDate(log.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
