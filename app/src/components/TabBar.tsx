'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/plan', label: 'Week' },
  { href: '/list', label: 'List' },
  { href: '/today', label: 'Today' },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tab-bar" aria-label="Main">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={pathname === t.href ? 'active' : ''}>
          <span className="tab-dot" />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
