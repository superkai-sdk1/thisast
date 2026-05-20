'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Monitor, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { authApi } from '@/lib/api/auth';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { Button } from '@/components/atoms/Button';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  admin: 'Администратор',
  agent: 'Агент',
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, refreshToken, clientSafeMode, toggleClientSafeMode, clearAuth } = useAppStore();
  const { theme, setTheme } = useTheme();

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
