'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { useApiData } from '@/hooks/use-api-data';
import { formatPrice } from '@/lib/format';
import type { Paginated, Product } from '@/lib/types';
import { ErrorBox, Loading } from '@/components/admin/ui';

export default function AdminProductsPage() {
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const qs = new URLSearchParams({ page: String(page), limit: '10' });
  if (search) qs.set('search', search);
  const { data, error, loading, refetch } = useApiData<Paginated<Product>>(`/admin/products?${qs.toString()}`);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(term.trim());
    setPage(1);
  }

  async function toggleAvailability(p: Product) {
    setActionError(null);
    try {
      await apiFetch(`/admin/products/${p.id}`, { method: 'PATCH', body: JSON.stringify({ isAvailable: !p.isAvailable }) });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  async function remove(p: Product) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone. Past orders keep their history.`)) return;
    setActionError(null);
    try {
      await apiFetch(`/admin/products/${p.id}`, { method: 'DELETE' });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={onSearch} className="flex gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products"
            maxLength={60}
            className="w-56 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
          />
          <button className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Search</button>
        </form>
        <Link href="/admin/products/new" className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700">
          + New product
        </Link>
      </div>

      {(error || actionError) && <ErrorBox message={(error ?? actionError)!} />}
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.data.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <Image src={p.imageUrl} alt="" width={48} height={36} unoptimized className="h-9 w-12 rounded object-cover" />
                        ) : (
                          <span className="flex h-9 w-12 items-center justify-center rounded bg-stone-100">🍽️</span>
                        )}
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.category.name}</td>
                    <td className="px-4 py-3">{formatPrice(p.price)}</td>
                    <td className={`px-4 py-3 font-semibold ${p.stock <= 5 ? 'text-red-600' : ''}`}>{p.stock}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(p)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          p.isAvailable ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {p.isAvailable ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td className="space-x-3 px-4 py-3 text-right">
                      <Link href={`/admin/products/${p.id}`} className="font-semibold text-orange-600 hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => remove(p)} className="font-semibold text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-stone-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-stone-500">
              {data.meta.total} products · page {data.meta.page} of {Math.max(1, data.meta.totalPages)}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((n) => n - 1)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((n) => n + 1)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}