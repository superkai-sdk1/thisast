'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, Handshake, Settings } from 'lucide-react';

const TABS = [
  { href: '/dashboard',  Icon: LayoutDashboard, label: 'Главная'  },
  { href: '/properties', Icon: Building2,        label: 'Объекты'  },
  { href: '/demand',     Icon: Users,            label: 'Клиенты'  },
  { href: '/deals',      Icon: Handshake,        label: 'Сделки'   },
  { href: '/settings',   Icon: Settings,         label: 'Профиль'  },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-30 glass-nav"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', borderTop: '0.5px solid var(--separator)' }}
    >
      <div className="flex h-[56px]">
        {TABS.map(({ href, Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative press-scale"
            >
              {active && (
                <span
                  className="absolute top-[6px] w-8 h-[3px] rounded-full"
                  style={{ background: 'var(--ios-blue)', opacity: 0.9 }}
                />
              )}
              <span className="flex items-center justify-center mt-1" style={{ transform: active ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
                <Icon
                  size={23}
                  strokeWidth={active ? 2.2 : 1.6}
                  style={{ color: active ? 'var(--ios-blue)' : 'var(--label-tertiary)' }}
                />
              </span>
              <span
                className="text-[10px] leading-none"
                style={{ color: active ? 'var(--ios-blue)' : 'var(--label-tertiary)', fontWeight: active ? 600 : 500 }}
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
