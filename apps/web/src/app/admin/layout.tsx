'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (loaded && !isAdmin) router.replace(user ? '/' : '/login');
  }, [loaded, isAdmin, user, router]);

  if (!loaded) return <div className="px-4 py-16 text-center text-stone-500">Checking access…</div>;
  if (!isAdmin) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold">Admin panel</h1>

      <nav className="mt-4 flex gap-2 overflow-x-auto border-b border-stone-200 pb-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                active ? 'bg-orange-600 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}