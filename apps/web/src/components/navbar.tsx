'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogOut, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useMounted } from '@/hooks/use-mounted';

export function Navbar() {
  const router = useRouter();
  const mounted = useMounted();
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Meal<span className="text-orange-600">Rush</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link href="/" className="hidden hover:text-orange-600 sm:inline">
            Home
          </Link>
          <Link href="/menu" className="hover:text-orange-600">
            Menu
          </Link>

          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="hover:text-orange-600">
              Admin
            </Link>
          )}

          {loaded &&
            (user ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-stone-600 hover:text-orange-600"
                title="Log out"
              >
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
                <LogOut size={18} />
              </button>
            ) : (
              <Link href="/login" className="hover:text-orange-600">
                Log in
              </Link>
            ))}

          <Link href="/cart" className="relative rounded-full p-2 hover:bg-stone-100" aria-label="Cart">
            <ShoppingBag size={22} />
            {mounted && count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}