'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Leaf, Search, X } from 'lucide-react';
import type { Category } from '@/lib/types';

export function MenuFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category') ?? '';
  const vegOnly = searchParams.get('isVeg') === 'true';
  const [term, setTerm] = useState(searchParams.get('search') ?? '');

  // Builds a URL from the current filters with some values changed.
  function buildHref(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete('page'); // any filter change goes back to page 1
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push(buildHref({ search: term.trim() || null }), { scroll: false });
  }

  function clearSearch() {
    setTerm('');
    router.push(buildHref({ search: null }), { scroll: false });
  }

  const pill = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
      active
        ? 'border-orange-600 bg-orange-600 text-white'
        : 'border-stone-300 bg-white text-stone-700 hover:border-orange-400'
    }`;

  return (
    <div className="space-y-4">
      <form onSubmit={onSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search dishes, e.g. kottu"
            maxLength={60}
            className="w-full rounded-full border border-stone-300 bg-white py-3 pl-10 pr-10 text-sm outline-none focus:border-orange-500"
          />
          {term && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Search
        </button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={buildHref({ category: null })} className={pill(activeCategory === '')}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildHref({ category: c.slug })}
            className={pill(activeCategory === c.slug)}
          >
            {c.name}
          </Link>
        ))}
        <Link
          href={buildHref({ isVeg: vegOnly ? null : 'true' })}
          className={`${pill(vegOnly)} inline-flex items-center gap-1`}
        >
          <Leaf size={14} /> Veg only
        </Link>
      </div>
    </div>
  );
}