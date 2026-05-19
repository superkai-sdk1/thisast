'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, Users, Handshake, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/dashboard',  Icon: Home,       label: 'Главная'  },
  { href: '/properties', Icon: Building2,  label: 'Объекты'  },
  { href: '/demand',     Icon: Users,      label: 'Клиенты'  },
  { href: '/deals',      Icon: Handshake,  label: 'Сделки'   },
  { href: '/settings',   Icon: Settings,   label: 'Профиль'  },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 glass-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-[56px]">
        {TABS.map(({ href, Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative"
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute top-[9px] w-1 h-1 rounded-full"
                  style={{ background: 'var(--ios-blue)', opacity: 0 }}
                />
              )}

              <span
                className={cn(
                  'flex items-center justify-center transition-all duration-150',
                  active ? 'scale-110' : 'scale-100',
                )}
              >
                <Icon
                  size={24}
                  strokeWidth={active ? 2.4 : 1.7}
                  className={cn(
                    'transition-colors duration-150',
                    active ? 'text-[var(--ios-blue)]' : 'text-[var(--label-tertiary)]',
                  )}
                />
              </span>

              <span
                className={cn(
                  'text-[10px] transition-all duration-150 leading-none',
                  active
                    ? 'font-semibold text-[var(--ios-blue)]'
                    : 'font-medium text-[var(--label-tertiary)]',
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
