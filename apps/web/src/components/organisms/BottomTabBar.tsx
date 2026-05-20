'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, Handshake, Settings } from 'lucide-react';

const TABS = [
  { href: '/dashboard',  Icon: LayoutDashboard, label: 'Главная' },
  { href: '/properties', Icon: Building2,        label: 'Объекты' },
  { href: '/demand',     Icon: Users,            label: 'Клиенты' },
  { href: '/deals',      Icon: Handshake,        label: 'Сделки'  },
  { href: '/settings',   Icon: Settings,         label: 'Профиль' },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed z-30 glass-dock"
      style={{
        left:         '12px',
        right:        '12px',
        bottom:       'max(12px, env(safe-area-inset-bottom))',
        borderRadius: '26px',
      }}
    >
      <div className="flex h-[60px] items-center px-1">
        {TABS.map(({ href, Icon, label }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href + '/'));

          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] relative press-scale py-2"
            >
              {/* Icon */}
              <Icon
                size={22}
                strokeWidth={active ? 2.2 : 1.6}
                style={{
                  color:      active ? 'var(--neon-blue)' : 'var(--label-tertiary)',
                  filter:     active ? 'drop-shadow(0 0 5px rgba(79,117,255,0.70))' : 'none',
                  transition: 'color 0.15s, filter 0.15s',
                }}
              />

              {/* Label */}
              <span
                className="text-[9.5px] leading-none font-medium"
                style={{
                  color:      active ? 'var(--neon-blue)' : 'var(--label-tertiary)',
                  transition: 'color 0.15s',
                }}
              >
                {label}
              </span>

              {/* Active neon line indicator */}
              {active && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                  style={{
                    background: 'var(--neon-blue)',
                    boxShadow:  '0 0 8px var(--neon-blue), 0 0 16px rgba(79,117,255,0.55)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
