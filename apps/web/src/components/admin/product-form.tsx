'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { useApiData } from '@/hooks/use-api-data';
import type { Category, Product } from '@/lib/types';
import { ErrorBox } from './ui';

const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const categories = useApiData<Category[]>('/categories');
  const fileInput = useRef<HTMLInputElement>(null);

  const [v, setV] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product ? String(Number(product.price)) : '',
    stock: product ? String(product.stock) : '0',
    categoryId: product ? String(product.categoryId) : '',
    imageUrl: product?.imageUrl ?? '',
    isVeg: product?.isVeg ?? false,
    isAvailable: product?.isAvailable ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the admin pick the same file again later
    if (!file) return;

    setError(null);
    // Quick feedback only. The server checks everything again.
    if (!ALLOWED_TYPES.includes(file.type)) return setError('Please choose a JPG, PNG or WebP image');
    if (file.size > MAX_IMAGE_BYTES) return setError('The image must be 2 MB or smaller');

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await apiFetch<{ url: string }>('/admin/uploads/image', { method: 'POST', body });
      setV((prev) => ({ ...prev, imageUrl: res.url }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(v.price);
    const stock = Number(v.stock);
    const categoryId = Number(v.categoryId);

    if (v.name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (!v.description.trim()) return setError('Please add a description');
    if (!(price > 0) || Math.round(price * 100) / 100 !== price) return setError('Enter a valid price (max 2 decimals)');
    if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a whole number, 0 or more');
    if (!categoryId) return setError('Please choose a category');

    const imageUrl = v.imageUrl.trim();
    const payload = {
      name: v.name.trim(),
      description: v.description.trim(),
      price,
      stock,
      categoryId,
      isVeg: v.isVeg,
      isAvailable: v.isAvailable,
      // on create: leave out when empty. on edit: null clears the image
      ...(imageUrl ? { imageUrl } : product ? { imageUrl: null } : {}),
    };

    setSaving(true);
    try {
      await apiFetch(product ? `/admin/products/${product.id}` : '/admin/products', {
        method: product ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the product');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <Field label="Name">
        <input className={inputClass} value={v.name} maxLength={80} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </Field>

      <Field label="Description">
        <textarea
          className={inputClass}
          rows={3}
          maxLength={500}
          value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price (Rs.)">
          <input className={inputClass} inputMode="decimal" value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} />
        </Field>
        <Field label="Stock">
          <input className={inputClass} inputMode="numeric" value={v.stock} onChange={(e) => setV({ ...v, stock: e.target.value })} />
        </Field>
        <Field label="Category">
          <select className={inputClass} value={v.categoryId} onChange={(e) => setV({ ...v, categoryId: e.target.value })}>
            <option value="">Select…</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Product image" hint="JPG, PNG or WebP, up to 2 MB.">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-28 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-stone-50">
            {v.imageUrl ? (
              <Image
                src={v.imageUrl}
                alt="Product preview"
                width={160}
                height={112}
                unoptimized
                className="h-28 w-40 object-cover"
              />
            ) : (
              <span className="text-xs text-stone-400">No image</span>
            )}
          </div>

          <div className="space-y-2">
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
              className="block rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold hover:border-orange-400 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : v.imageUrl ? 'Replace image' : 'Upload image'}
            </button>
            {v.imageUrl && !uploading && (
              <button
                type="button"
                onClick={() => setV({ ...v, imageUrl: '' })}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Remove image
              </button>
            )}
          </div>
        </div>
      </Field>

      <div className="flex flex-wrap gap-6 text-sm font-medium">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={v.isVeg} onChange={(e) => setV({ ...v, isVeg: e.target.checked })} />
          Vegetarian
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={v.isAvailable} onChange={(e) => setV({ ...v, isAvailable: e.target.checked })} />
          Available on the menu
        </label>
      </div>

      {error && <ErrorBox message={error} />}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold hover:border-orange-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}