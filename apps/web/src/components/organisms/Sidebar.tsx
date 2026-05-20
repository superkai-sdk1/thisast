'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Handshake, Settings,
  Shield, Eye, EyeOff, LogOut, ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { authApi } from '@/lib/api/auth';

const NAV = [
  { href: '/dashboard',  Icon: LayoutDashboard, label: 'Дашборд'    },
  { href: '/properties', Icon: Building2,        label: 'Объекты'    },
  { href: '/demand',     Icon: Users,            label: 'Клиенты'    },
  { href: '/deals',      Icon: Handshake,        label: 'Сделки'     },
  { href: '/admin',      Icon: Shield,           label: 'Управление' },
  { href: '/settings',   Icon: Settings,         label: 'Настройки'  },
] as const;

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Суперадмин',
  admin: 'Администратор',
  agent: 'Агент',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshToken, clientSafeMode, toggleClientSafeMode, clearAuth } = useAppStore();

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch {}
    }
    clearAuth();
    router.replace('/login');
  }

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 sticky top-0 h-screen overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #0f0f1e 0%, #131326 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
            <Building2 size={18} color="white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white leading-tight">Эста</p>
            <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Недвижимость</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/')) || (href === '/dashboard' && pathname === href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-150 group relative"
              style={{
                background: active ? 'rgba(0,122,255,0.18)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: '#007AFF' }} />
              )}
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[14px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Client-safe mode toggle */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={toggleClientSafeMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all duration-150"
          style={{
            background: clientSafeMode ? 'rgba(255,149,0,0.15)' : 'rgba(255,255,255,0.04)',
            color: clientSafeMode ? '#FF9500' : 'rgba(255,255,255,0.45)',
          }}
        >
          {clientSafeMode ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="text-[13px] font-medium flex-1 text-left">
            {clientSafeMode ? 'Режим клиента вкл.' : 'Режим клиента'}
          </span>
          <div className="w-8 h-5 rounded-full flex items-center transition-all"
            style={{ background: clientSafeMode ? '#FF9500' : 'rgba(255,255,255,0.15)', padding: '2px' }}>
            <span className="w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: clientSafeMode ? 'translateX(12px)' : 'translateX(0)' }} />
          </div>
        </button>
      </div>

      {/* User profile */}
      {user && (
        <div className="px-3 pb-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-3 rounded-[12px]"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 hover:bg-red-500/20 transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              title="Выйти"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
