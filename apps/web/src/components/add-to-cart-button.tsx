'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/lib/types';

interface Props {
  product: Product;
  quantity?: number;
  className?: string;
}

export function AddToCartButton({ product, quantity = 1, className = '' }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0 || !product.isAvailable;

  function handleClick() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl,
        maxQty: Math.min(product.stock, 20),
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={soldOut}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
        soldOut
          ? 'cursor-not-allowed bg-stone-300'
          : added
            ? 'bg-green-600'
            : 'bg-orange-600 hover:bg-orange-700'
      } ${className}`}
    >
      {soldOut ? (
        'Sold out'
      ) : added ? (
        <>
          <Check size={16} /> Added
        </>
      ) : (
        <>
          <Plus size={16} /> Add to cart
        </>
      )}
    </button>
  );
}