'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { ProductImage } from '@/components/product-image';
import { useMounted } from '@/hooks/use-mounted';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/store/cart';

export default function CartPage() {
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);

  if (!mounted) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-stone-500">Loading your cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-stone-600">Add something tasty from the menu to get started.</p>
        <Link
          href="/menu"
          className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
        >
          Browse menu
        </Link>
      </div>
    );
  }

  // Display only. The server recalculates the real total at checkout.
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Your cart</h1>
        <button onClick={clear} className="text-sm font-medium text-stone-500 hover:text-red-600">
          Clear cart
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-32">
                <ProductImage src={item.imageUrl} alt={item.name} sizes="128px" />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/menu/${item.slug}`} className="font-semibold hover:text-orange-600">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center rounded-full border border-stone-300">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="p-2 hover:text-orange-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      className="p-2 hover:text-orange-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-stone-600">Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">Delivery fee is calculated at checkout.</p>
          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-orange-600 py-3 text-center font-semibold text-white hover:bg-orange-700"
          >
            Proceed to checkout
          </Link>
          <Link href="/menu" className="mt-3 block text-center text-sm font-medium text-stone-600 hover:text-orange-600">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}