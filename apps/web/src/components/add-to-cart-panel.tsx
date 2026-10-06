'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { AddToCartButton } from './add-to-cart-button';
import type { Product } from '@/lib/types';

export function AddToCartPanel({ product }: { product: Product }) {
  const maxQty = Math.max(1, Math.min(product.stock, 20));
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="inline-flex items-center rounded-full border border-stone-300 bg-white">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="p-3 hover:text-orange-600"
        >
          <Minus size={16} />
        </button>
        <span className="w-8 text-center font-semibold">{quantity}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
          className="p-3 hover:text-orange-600"
        >
          <Plus size={16} />
        </button>
      </div>
      <AddToCartButton product={product} quantity={quantity} className="px-6 py-3" />
    </div>
  );
}