import { Suspense } from 'react';
import { MenuFilters } from '@/components/menu-filters';
import { Pagination } from '@/components/pagination';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';
import type { Category, Paginated, Product } from '@/lib/types';

export const metadata = { title: 'Menu' };

type SearchParams = Record<string, string | undefined>;

export default async function MenuPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  // Only pass through values we understand (never trust the URL blindly)
  const filters: Record<string, string> = {};
  if (sp.search) filters.search = sp.search.slice(0, 60);
  if (sp.category) filters.category = sp.category;
  if (sp.isVeg === 'true') filters.isVeg = 'true';

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const query = new URLSearchParams({ ...filters, page: String(page), limit: '12' });

  const [categories, result] = await Promise.all([
    apiFetch<Category[]>('/categories'),
    apiFetch<Paginated<Product>>(`/products?${query.toString()}`),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Our menu</h1>
      <p className="mt-1 text-stone-600">Freshly prepared, ready to order.</p>

      <div className="mt-6">
        <Suspense fallback={null}>
          <MenuFilters categories={categories} />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-stone-500">
        {result.meta.total} {result.meta.total === 1 ? 'item' : 'items'} found
      </p>

      {result.data.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 font-semibold">No dishes match your search</p>
          <p className="mt-1 text-sm text-stone-500">Try a different keyword or clear the filters.</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {result.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <Pagination page={result.meta.page} totalPages={result.meta.totalPages} params={filters} />
    </div>
  );
}