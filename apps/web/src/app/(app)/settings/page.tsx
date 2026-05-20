'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Monitor, Eye, EyeOff, ChevronRight, Fingerprint, Trash2, Plus, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { authApi } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { Button } from '@/components/atoms/Button';
import {
  startRegistration,
} from '@simplewebauthn/browser';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  admin: 'Администратор',
  agent: 'Агент',
};

interface PasskeyCred {
  id: string;
  credential_id: string;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshToken, clientSafeMode, toggleClientSafeMode, clearAuth } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [passkeys, setPasskeys] = useState<PasskeyCred[]>([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyAdding, setPasskeyAdding] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    apiClient.get<{ data: PasskeyCred[] }>('/auth/passkey/credentials')
      .then(r => setPasskeys(r.data.data ?? []))
      .catch(() => {});
  }, []);

  async function addPasskey() {
    setPasskeyAdding(true);
    setPasskeyError('');
    try {
      const optRes = await apiClient.get<unknown>('/auth/passkey/register-options');
      const options = (optRes.data as { data: unknown }).data ?? optRes.data;
      const response = await startRegistration({ optionsJSON: options as never });
      await apiClient.post('/auth/passkey/register', {
        response,
        deviceName: deviceName || undefined,
      });
      const updated = await apiClient.get<{ data: PasskeyCred[] }>('/auth/passkey/credentials');
      setPasskeys(updated.data.data ?? []);
      setDeviceName('');
    } catch (e: unknown) {
      const msg = (e as Error).message ?? '';
      if (!msg.includes('cancelled') && !msg.includes('abort')) {
        setPasskeyError('Не удалось добавить Passkey');
      }
    } finally {
      setPasskeyAdding(false);
    }
  }

  async function deletePasskey(id: string) {
    setPasskeyLoading(true);
    try {
      await apiClient.delete(`/auth/passkey/credentials/${id}`);
      setPasskeys(prev => prev.filter(p => p.id !== id));
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function handleLogout() {
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch {}
    }
    clearAuth();
    router.replace('/login');
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <GlassNavBar title="Профиль" />

      <div className="gradient-mesh min-h-full">
        <div className="px-4 pt-3 pb-6 flex flex-col gap-4">

          {/* Profile hero card */}
          {user && (
            <div
              className="squircle-card-lg p-5"
              style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-elevated)' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-[18px] flex items-center justify-center text-white text-[20px] font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--ios-blue), var(--ios-indigo))' }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                    {user.full_name}
                  </p>
                  <p className="text-[14px] mt-0.5 truncate" style={{ color: 'var(--label-secondary)' }}>
                    {user.email}
                  </p>
                  <span
                    className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-[8px]"
                    style={{ background: 'rgba(0,122,255,0.12)', color: 'var(--ios-blue)' }}
                  >
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Client-safe mode */}
          <section>
            <p className="section-label px-1">Демонстрация</p>
            <div
              className="squircle-card p-4"
              style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold" style={{ color: 'var(--label-primary)' }}>
                    Режим клиента
                  </p>
                  <p className="text-[13px] mt-0.5" style={{ color: 'var(--label-secondary)' }}>
                    Скрывает контакты, адреса и финансовые данные
                  </p>
                </div>
                <button
                  onClick={toggleClientSafeMode}
                  className="relative w-[51px] h-[31px] rounded-full flex-shrink-0 transition-colors duration-200"
                  style={{ background: clientSafeMode ? 'var(--ios-orange)' : 'var(--fill-primary)' }}
                >
                  <span
                    className="absolute top-[3px] w-[25px] h-[25px] rounded-full bg-white transition-transform duration-200"
                    style={{
                      left: '3px',
                      transform: clientSafeMode ? 'translateX(20px)' : 'translateX(0)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
                    }}
                  />
                </button>
              </div>

              {clientSafeMode && (
                <div
                  className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[12px]"
                  style={{ background: 'rgba(255,149,0,0.10)' }}
                >
                  <EyeOff size={14} style={{ color: 'var(--ios-orange)', flexShrink: 0 }} />
                  <span className="text-[12px] font-medium" style={{ color: 'var(--ios-orange)' }}>
                    Режим демонстрации активен — данные скрыты
                  </span>
                </div>
              )}
              {!clientSafeMode && (
                <div className="flex items-center gap-2 mt-3">
                  <Eye size={14} style={{ color: 'var(--label-tertiary)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--label-tertiary)' }}>
                    Все данные видны
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Appearance */}
          <section>
            <p className="section-label px-1">Оформление</p>
            <div
              className="squircle-card p-4"
              style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex gap-2">
                {([
                  { value: 'light',  icon: Sun,     label: 'Светлая' },
                  { value: 'dark',   icon: Moon,    label: 'Тёмная'  },
                  { value: 'system', icon: Monitor, label: 'Авто'    },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[14px] text-[13px] font-medium press-scale transition-colors"
                    style={{
                      background: theme === value ? 'var(--ios-blue)' : 'var(--fill-tertiary)',
                      color: theme === value ? 'white' : 'var(--label-primary)',
                    }}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* App info */}
          <div
            className="squircle-card overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}
          >
            <div className="list-row">
              <span className="text-[15px] flex-1" style={{ color: 'var(--label-primary)' }}>Версия приложения</span>
              <span className="text-[15px]" style={{ color: 'var(--label-tertiary)' }}>1.0.0</span>
            </div>
            <div className="list-row border-0">
              <span className="text-[15px] flex-1" style={{ color: 'var(--label-primary)' }}>Эста CRM</span>
              <ChevronRight size={16} style={{ color: 'var(--label-quaternary)' }} />
            </div>
          </div>

          {/* Passkey */}
          <section>
            <p className="section-label px-1">Passkey — быстрый вход</p>
            <div className="squircle-card"
              style={{ background: 'var(--bg-elevated)', border: '0.5px solid var(--separator)', boxShadow: 'var(--shadow-card)' }}>

              {passkeys.length === 0 && (
                <div className="px-4 pt-4 pb-1">
                  <p className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>
                    Добавьте Passkey для входа без пароля — через Face ID, Touch ID или ключ безопасности.
                  </p>
                </div>
              )}

              {passkeys.map(pk => (
                <div key={pk.id} className="list-row">
                  <Fingerprint size={16} style={{ color: 'var(--ios-blue)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate" style={{ color: 'var(--label-primary)' }}>
                      {pk.device_name ?? 'Passkey'}
                    </p>
                    {pk.last_used_at && (
                      <p className="text-[11px]" style={{ color: 'var(--label-tertiary)' }}>
                        Использовался {new Date(pk.last_used_at).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deletePasskey(pk.id)}
                    disabled={passkeyLoading}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 press-scale"
                    style={{ background: 'rgba(255,59,48,0.10)', color: 'var(--ios-red)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {/* Add new passkey */}
              <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: passkeys.length > 0 ? '0.5px solid var(--separator)' : undefined }}>
                <input
                  className="input-field text-[13px]"
                  placeholder='Название устройства (напр. «iPhone 15»)'
                  value={deviceName}
                  onChange={e => setDeviceName(e.target.value)}
                />
                <button
                  onClick={addPasskey}
                  disabled={passkeyAdding}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-[12px] text-[13px] font-semibold press-scale self-start"
                  style={{ background: 'rgba(0,122,255,0.12)', color: 'var(--ios-blue)' }}
                >
                  {passkeyAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {passkeyAdding ? 'Добавление...' : 'Добавить Passkey'}
                </button>
                {passkeyError && (
                  <p className="text-[12px]" style={{ color: 'var(--ios-red)' }}>{passkeyError}</p>
                )}
              </div>
            </div>
          </section>

          {/* Logout */}
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut size={16} />
            Выйти из аккаунта
          </Button>

        </div>
      </div>
    </>
  );
}
