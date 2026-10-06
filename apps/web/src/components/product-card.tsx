import Link from 'next/link';
import { ProductImage } from './product-image';
import { VegBadge } from './veg-badge';
import { AddToCartButton } from './add-to-cart-button';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/menu/${product.slug}`} className="relative block">
        <ProductImage src={product.imageUrl} alt={product.name} />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-stone-900/80 px-3 py-1 text-xs font-semibold text-white">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/menu/${product.slug}`} className="font-semibold leading-snug hover:text-orange-600">
            {product.name}
          </Link>
          <VegBadge isVeg={product.isVeg} />
        </div>
        <p className="text-xs text-stone-500">{product.category.name}</p>
        <p className="line-clamp-2 flex-1 text-sm text-stone-600">{product.description}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}