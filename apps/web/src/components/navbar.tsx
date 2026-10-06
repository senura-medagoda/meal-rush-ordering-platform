'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useMounted } from '@/hooks/use-mounted';

export function Navbar() {
  const mounted = useMounted();
  const count = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          Meal<span className="text-orange-600">Rush</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-orange-600">
            Home
          </Link>
          <Link href="/menu" className="hover:text-orange-600">
            Menu
          </Link>
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