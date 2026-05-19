'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Users, Handshake, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/dashboard',  icon: Home,       label: 'Главная'    },
  { href: '/properties', icon: Building2,  label: 'Объекты'    },
  { href: '/demand',     icon: Users,      label: 'Клиенты'    },
  { href: '/deals',      icon: Handshake,  label: 'Сделки'     },
  { href: '/settings',   icon: Settings,   label: 'Профиль'    },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30',
        'glass-nav',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <div className="flex h-14">
        {TABS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'transition-colors',
                active ? 'text-[var(--ios-blue)]' : 'text-[var(--label-tertiary)]',
              )}
            >
              <Icon
                className={cn('w-6 h-6 transition-transform', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn('text-[10px] font-medium', active && 'font-semibold')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
