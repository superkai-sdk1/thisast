'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LogOut, Moon, Sun, Monitor, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { authApi } from '@/lib/api/auth';
import { GlassNavBar } from '@/components/organisms/GlassNavBar';
import { Button } from '@/components/atoms/Button';

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

  return (
    <>
      <GlassNavBar title="Профиль" />

      <div className="px-4 py-6 flex flex-col gap-6">
        {/* Profile card */}
        {user && (
          <div className="glass-card squircle-card p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--ios-blue)] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {user.full_name?.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-[var(--label-primary)]">{user.full_name}</p>
              <p className="text-sm text-[var(--label-secondary)]">{user.email}</p>
              <p className="text-xs text-[var(--label-tertiary)] mt-0.5 capitalize">{user.role}</p>
            </div>
          </div>
        )}

        {/* Client-safe mode */}
        <section className="glass-card squircle-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--label-primary)]">Режим клиента</p>
              <p className="text-xs text-[var(--label-secondary)] mt-0.5">
                Скрывает контакты, адреса и финансовые данные
              </p>
            </div>
            <button
              onClick={toggleClientSafeMode}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                clientSafeMode ? 'bg-[var(--ios-orange)]' : 'bg-[var(--fill-primary)]'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  clientSafeMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {clientSafeMode
              ? <EyeOff className="w-4 h-4 text-[var(--ios-orange)]" />
              : <Eye className="w-4 h-4 text-[var(--label-tertiary)]" />}
            <span className={`text-xs font-medium ${clientSafeMode ? 'text-[var(--ios-orange)]' : 'text-[var(--label-tertiary)]'}`}>
              {clientSafeMode ? 'Данные скрыты — режим демонстрации' : 'Все данные видны'}
            </span>
          </div>
        </section>

        {/* Appearance */}
        <section className="glass-card squircle-card p-4">
          <p className="text-sm font-semibold text-[var(--label-primary)] mb-3">Оформление</p>
          <div className="flex gap-2">
            {([
              { value: 'light',  icon: Sun,     label: 'Светлая' },
              { value: 'dark',   icon: Moon,    label: 'Тёмная'  },
              { value: 'system', icon: Monitor, label: 'Авто'    },
            ] as const).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[14px] text-xs font-medium transition-colors ${
                  theme === value
                    ? 'bg-[var(--ios-blue)] text-white'
                    : 'bg-[var(--fill-tertiary)] text-[var(--label-primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Logout */}
        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="w-4 h-4" />
          Выйти
        </Button>

        <p className="text-xs text-[var(--label-tertiary)] text-center">
          Эста CRM v1.0
        </p>
      </div>
    </>
  );
}
