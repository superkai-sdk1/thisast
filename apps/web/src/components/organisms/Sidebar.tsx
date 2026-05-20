'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Handshake, Settings,
  Shield, Eye, EyeOff, LogOut,
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
  admin:      'Администратор',
  agent:      'Агент',
};

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, refreshToken, clientSafeMode, toggleClientSafeMode, clearAuth } = useAppStore();

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    if (refreshToken) { try { await authApi.logout(refreshToken); } catch {} }
    clearAuth();
    router.replace('/login');
  }

  return (
    <aside
      className="sidebar-wrapper hidden md:flex flex-col sticky top-0 h-screen flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #0D1221 0%, #0F1629 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Brand ─────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-[14px] pt-6 pb-5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--neon-blue) 0%, #7C3AED 100%)',
            boxShadow: '0 0 18px rgba(79,117,255,0.60)',
          }}
        >
          <Building2 size={17} color="white" strokeWidth={2} />
        </div>
        <div className="sidebar-label">
          <p className="text-[14px] font-bold text-white leading-tight tracking-tight">Эста</p>
          <p className="text-[11px] font-medium" style={{ color: 'rgba(210,220,255,0.38)' }}>
            Недвижимость
          </p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 px-[10px] py-4 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, Icon, label }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 pl-[13px] pr-3 py-[10px] rounded-[12px] transition-colors duration-150 relative"
              style={{
                background: active ? 'rgba(79,117,255,0.16)' : 'transparent',
                color:      active ? 'white' : 'rgba(210,220,255,0.46)',
              }}
              onMouseEnter={e => {
                if (!active)
                  (e.currentTarget as HTMLAnchorElement).style.background =
                    'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={e => {
                if (!active)
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              {/* Neon left bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{
                    background: 'var(--neon-blue)',
                    boxShadow:  '0 0 10px var(--neon-blue), 0 0 22px rgba(79,117,255,0.45)',
                  }}
                />
              )}
              {/* Icon */}
              <span className="flex-shrink-0 w-[22px] flex items-center justify-center">
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.7}
                  style={{
                    color:  active ? 'var(--neon-blue)' : 'inherit',
                    filter: active
                      ? 'drop-shadow(0 0 5px rgba(79,117,255,0.80))'
                      : 'none',
                  }}
                />
              </span>
              {/* Label */}
              <span
                className="sidebar-label text-[14px] font-medium"
                style={{
                  color: active ? 'rgba(230,234,255,0.95)' : 'rgba(210,220,255,0.55)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Client-safe mode toggle ────────────────────── */}
      <div
        className="px-[10px] py-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={toggleClientSafeMode}
          className="w-full flex items-center gap-3 pl-[13px] pr-3 py-[10px] rounded-[12px] transition-colors duration-150"
          style={{
            background: clientSafeMode ? 'rgba(255,149,0,0.14)' : 'transparent',
            color:      clientSafeMode ? '#FF9500' : 'rgba(210,220,255,0.35)',
          }}
          onMouseEnter={e => {
            if (!clientSafeMode)
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
          }}
          onMouseLeave={e => {
            if (!clientSafeMode)
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <span className="flex-shrink-0 w-[22px] flex items-center justify-center">
            {clientSafeMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </span>
          <span className="sidebar-label text-[13px] font-medium">
            {clientSafeMode ? 'Режим клиента вкл.' : 'Режим клиента'}
          </span>
        </button>
      </div>

      {/* ── User profile ──────────────────────────────── */}
      {user && (
        <div className="px-[10px] pb-5 flex-shrink-0 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--neon-blue) 0%, #7C3AED 100%)' }}
          >
            {initials}
          </div>
          <div className="sidebar-label flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">
              {user.full_name}
            </p>
            <p className="text-[11px] truncate leading-tight" style={{ color: 'rgba(210,220,255,0.38)' }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-label w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-500/20"
            style={{ color: 'rgba(210,220,255,0.30)' }}
            title="Выйти"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
