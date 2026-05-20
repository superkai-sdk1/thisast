'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Sun, Moon, Monitor, ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store/useAppStore';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Дашборд',
  '/properties': 'Объекты',
  '/demand':     'Клиенты',
  '/deals':      'Сделки',
  '/admin':      'Управление',
  '/settings':   'Настройки',
};

export function AppHeader() {
  const pathname          = usePathname();
  const router            = useRouter();
  const { theme, setTheme } = useTheme();
  const { user }          = useAppStore();

  const segments = pathname.split('/').filter(Boolean);
  const rootPath = '/' + (segments[0] ?? '');
  const title    = PAGE_TITLES[rootPath] ?? 'Эста CRM';
  const isDetail = segments.length > 1;

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  function cycleTheme() {
    if (theme === 'dark')   setTheme('light');
    else if (theme === 'light') setTheme('system');
    else                    setTheme('dark');
  }

  const ThemeIcon = theme === 'dark' ? Sun : theme === 'light' ? Moon : Monitor;

  return (
    <header
      className="hidden md:flex items-center gap-3 h-[52px] px-5 flex-shrink-0 sticky top-0 z-20 glass-nav"
    >
      {/* Back or title */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isDetail && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 press-scale mr-1"
            style={{ color: 'var(--neon-blue)' }}
          >
            <ChevronLeft size={18} strokeWidth={2} />
            <span className="text-[14px] font-medium">Назад</span>
          </button>
        )}
        <h1
          className="text-[15px] font-semibold truncate"
          style={{ color: 'var(--label-primary)', letterSpacing: '-0.2px' }}
        >
          {title}
        </h1>
      </div>

      {/* Search hint */}
      <button
        className="flex items-center gap-2 px-3 h-8 rounded-[10px] press-scale"
        style={{ background: 'var(--fill-tertiary)', color: 'var(--label-tertiary)' }}
      >
        <Search size={13} strokeWidth={2} />
        <span className="text-[12px] font-medium">Поиск</span>
        <span
          className="text-[11px] px-1.5 py-0.5 rounded-[5px] font-medium"
          style={{ background: 'var(--fill-secondary)', color: 'var(--label-quaternary)' }}
        >
          ⌘K
        </span>
      </button>

      {/* Notifications */}
      <button
        className="relative w-8 h-8 rounded-full flex items-center justify-center press-scale"
        style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}
      >
        <Bell size={14} strokeWidth={1.8} />
        <span
          className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full pulse-neon"
          style={{ background: 'var(--neon-blue)' }}
        />
      </button>

      {/* Theme cycle */}
      <button
        onClick={cycleTheme}
        className="w-8 h-8 rounded-full flex items-center justify-center press-scale"
        style={{ background: 'var(--fill-tertiary)', color: 'var(--label-secondary)' }}
        title={`Тема: ${theme}`}
      >
        <ThemeIcon size={14} strokeWidth={1.8} />
      </button>

      {/* User avatar */}
      <div
        className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, var(--neon-blue) 0%, #7C3AED 100%)' }}
        title={user?.full_name}
      >
        {initials}
      </div>
    </header>
  );
}
