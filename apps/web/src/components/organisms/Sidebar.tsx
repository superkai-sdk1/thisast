'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, Handshake, Settings,
  Shield, Eye, EyeOff, LogOut, ChevronLeft,
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

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    if (refreshToken) { try { await authApi.logout(refreshToken); } catch {} }
    clearAuth();
    router.replace('/login');
  }

  const w = collapsed ? 'w-[80px]' : 'w-[260px]';

  return (
    <aside
      className={`hidden md:flex flex-col sticky top-0 h-screen flex-shrink-0 sidebar-transition relative ${w}`}
      style={{
        background:              'var(--sidebar-bg)',
        backdropFilter:          'blur(20px) saturate(160%)',
        WebkitBackdropFilter:    'blur(20px) saturate(160%)',
        borderRight:             '1px solid var(--sidebar-border)',
      }}
    >
      {/* ── Collapse toggle button ──────────────────── */}
      <button
        onClick={toggle}
        className="absolute -right-[13px] top-[72px] w-[26px] h-[26px] rounded-full flex items-center justify-center z-10 transition-transform duration-300"
        style={{
          background: 'var(--neon-blue)',
          boxShadow:  '0 0 12px rgba(99,102,241,0.55), 0 2px 6px rgba(0,0,0,0.25)',
        }}
        aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
      >
        <ChevronLeft
          size={13}
          color="white"
          strokeWidth={2.5}
          style={{
            transform:  collapsed ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.30s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </button>

      {/* ── Brand ─────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--separator)' }}
      >
        <div
          className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)',
            boxShadow:  '0 0 18px rgba(99,102,241,0.55)',
          }}
        >
          <Building2 size={17} color="white" strokeWidth={2} />
        </div>
        <div
          className="sidebar-label"
          style={{ maxWidth: collapsed ? 0 : 200, opacity: collapsed ? 0 : 1 }}
        >
          <p className="text-[14px] font-bold leading-tight tracking-tight" style={{ color: 'var(--label-primary)' }}>
            Nexus
          </p>
          <p className="text-[11px] font-medium" style={{ color: 'var(--label-tertiary)' }}>
            CRM
          </p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, Icon, label }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-[10px] rounded-[12px] transition-colors duration-150 relative"
              style={{
                background: active ? 'rgba(99,102,241,0.14)' : 'transparent',
                color:      active ? 'var(--label-primary)' : 'var(--label-tertiary)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.07)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              }}
            >
              {/* Indigo left bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{
                    background: 'var(--neon-blue)',
                    boxShadow:  '0 0 10px var(--neon-blue), 0 0 22px rgba(99,102,241,0.45)',
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
                    filter: active ? 'drop-shadow(0 0 5px rgba(99,102,241,0.80))' : 'none',
                  }}
                />
              </span>
              {/* Label */}
              <span
                className="sidebar-label text-[14px] font-medium"
                style={{
                  maxWidth: collapsed ? 0 : 200,
                  opacity:  collapsed ? 0 : 1,
                  color:    active ? 'var(--label-primary)' : 'var(--label-secondary)',
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Client-safe mode toggle ────────────────── */}
      <div
        className="px-3 py-2 flex-shrink-0"
        style={{ borderTop: '1px solid var(--separator)' }}
      >
        <button
          onClick={toggleClientSafeMode}
          className="w-full flex items-center gap-3 px-3 py-[10px] rounded-[12px] transition-colors duration-150"
          style={{
            background: clientSafeMode ? 'rgba(245,158,11,0.12)' : 'transparent',
            color:      clientSafeMode ? '#F59E0B' : 'var(--label-quaternary)',
          }}
          onMouseEnter={e => {
            if (!clientSafeMode)
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.07)';
          }}
          onMouseLeave={e => {
            if (!clientSafeMode)
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <span className="flex-shrink-0 w-[22px] flex items-center justify-center">
            {clientSafeMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </span>
          <span
            className="sidebar-label text-[13px] font-medium"
            style={{ maxWidth: collapsed ? 0 : 200, opacity: collapsed ? 0 : 1 }}
          >
            {clientSafeMode ? 'Режим клиента вкл.' : 'Режим клиента'}
          </span>
        </button>
      </div>

      {/* ── User profile ──────────────────────────── */}
      {user && (
        <div className="px-3 pb-5 flex-shrink-0 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--neon-blue) 0%, var(--neon-purple) 100%)' }}
          >
            {initials}
          </div>
          <div
            className="sidebar-label flex-1 min-w-0"
            style={{ maxWidth: collapsed ? 0 : 200, opacity: collapsed ? 0 : 1 }}
          >
            <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: 'var(--label-primary)' }}>
              {user.full_name}
            </p>
            <p className="text-[11px] truncate leading-tight" style={{ color: 'var(--label-tertiary)' }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-500/20"
            style={{
              color:    'var(--label-quaternary)',
              opacity:  collapsed ? 0 : 1,
              maxWidth: collapsed ? 0 : 28,
              overflow: 'hidden',
              transition: 'opacity 0.20s ease, max-width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title="Выйти"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}
