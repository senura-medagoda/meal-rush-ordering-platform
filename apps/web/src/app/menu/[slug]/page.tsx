import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { AddToCartPanel } from '@/components/add-to-cart-panel';
import { ProductImage } from '@/components/product-image';
import { VegBadge } from '@/components/veg-badge';
import { ApiError, apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err; // real errors go to error.tsx
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product ? product.name : 'Dish not found' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/menu" className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-orange-600">
        <ChevronLeft size={16} /> Back to menu
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <ProductImage src={product.imageUrl} alt={product.name} priority sizes="(min-width: 768px) 50vw, 100vw" />
        </div>

        <div>
          <Link
            href={`/menu?category=${product.category.slug}`}
            className="text-sm font-semibold uppercase tracking-wide text-orange-600 hover:underline"
          >
            {product.category.name}
          </Link>

          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-extrabold">{product.name}</h1>
            <VegBadge isVeg={product.isVeg} />
          </div>

          <p className="mt-4 text-3xl font-bold">{formatPrice(product.price)}</p>
          <p className="mt-4 leading-relaxed text-stone-600">{product.description}</p>

          <p className="mt-4 text-sm font-medium">
            {soldOut ? (
              <span className="text-red-600">Currently sold out</span>
            ) : lowStock ? (
              <span className="text-amber-600">Only {product.stock} left</span>
            ) : (
              <span className="text-green-700">In stock</span>
            )}
          </p>

          <div className="mt-8">
            {soldOut ? (
              <p className="rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
                This item is unavailable right now. Please check back soon.
              </p>
            ) : (
              <AddToCartPanel product={product} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}