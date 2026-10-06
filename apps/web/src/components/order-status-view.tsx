'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, MessageCircle } from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import type { OrderStatus, OrderTracking } from '@/lib/types';
import { useSessionValue } from '@/hooks/use-session-value';
import { useCartStore } from '@/store/cart';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Order placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PREPARING', label: 'Preparing' },
  { status: 'OUT_FOR_DELIVERY', label: 'On the way' },
  { status: 'DELIVERED', label: 'Delivered' },
];

function Banner({ tone, title, children }: { tone: 'green' | 'amber' | 'red'; title: string; children?: React.ReactNode }) {
  const styles = {
    green: 'border-green-200 bg-green-50 text-green-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
  }[tone];
  return (
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <p className="font-bold">{title}</p>
      {children && <div className="mt-1 text-sm">{children}</div>}
    </div>
  );
}

export function OrderStatusView({ orderNumber }: { orderNumber: string }) {
  const searchParams = useSearchParams();
  const cancelledFlag = searchParams.get('cancelled') === '1';
  const fromPayhere = searchParams.get('from') === 'payhere';

  const clearCart = useCartStore((s) => s.clear);
  const whatsappUrl = useSessionValue(`mealrush-wa-${orderNumber}`);

  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Coming back from PayHere means the payment attempt is over: empty the cart
  useEffect(() => {
    if (fromPayhere) clearCart();
  }, [fromPayhere, clearCart]);

  // Load the order, and keep checking while an online payment is waiting for PayHere's confirmation
  useEffect(() => {
    let done = false;

    async function load() {
      try {
        const data = await apiFetch<OrderTracking>(`/orders/track/${encodeURIComponent(orderNumber)}`);
        setOrder(data);
        setError(null);
        const waitingForPayment = data.paymentMethod === 'PAYHERE' && data.paymentStatus === 'PENDING' && !cancelledFlag;
        if (!waitingForPayment) done = true;
      } catch (err) {
        setError(
          err instanceof ApiError && err.status === 404
            ? 'We could not find this order. Please check the link.'
            : 'We could not load your order right now. Please refresh in a moment.',
        );
        done = true;
      }
    }

    load();
    const timer = setInterval(() => {
      if (!done) load();
    }, 5000);
    return () => clearInterval(timer);
  }, [orderNumber, cancelledFlag]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">😕</p>
        <p className="mt-4 text-stone-700">{error}</p>
        <Link href="/menu" className="mt-6 inline-block font-semibold text-orange-600 hover:underline">
          Back to menu
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">Loading your order…</div>;
  }

  const cancelled = order.orderStatus === 'CANCELLED';
  const activeIndex = STEPS.findIndex((s) => s.status === order.orderStatus);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-sm text-stone-500">Order number</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{order.orderNumber}</h1>
        <p className="mt-1 text-xs text-stone-500">Save this number to check your order any time.</p>
      </div>

      {/* Status banner */}
      {cancelled ? (
        <Banner tone="red" title="This order was cancelled">
          If you were charged, please contact us and we&apos;ll sort it out.
        </Banner>
      ) : order.paymentMethod === 'WHATSAPP' ? (
        <Banner tone="green" title="Order received! One last step.">
          <p>Send your order to us on WhatsApp so we can confirm it. You&apos;ll pay on delivery.</p>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              <MessageCircle size={18} /> Send order on WhatsApp
            </a>
          ) : (
            <p className="mt-2 text-xs">Message us on WhatsApp with your order number to confirm.</p>
          )}
        </Banner>
      ) : order.paymentStatus === 'PAID' ? (
        <Banner tone="green" title="Payment received. Thank you!">
          Your order is confirmed and we&apos;re getting started.
        </Banner>
      ) : cancelledFlag || order.paymentStatus === 'CANCELLED' ? (
        <Banner tone="amber" title="Payment was cancelled">
          Your order has not been paid. You can go back to your cart and try again.
          <div>
            <Link href="/cart" className="mt-2 inline-block font-semibold underline">
              Return to cart
            </Link>
          </div>
        </Banner>
      ) : order.paymentStatus === 'FAILED' ? (
        <Banner tone="red" title="Payment failed">
          Your payment did not go through. Please try placing the order again.
        </Banner>
      ) : (
        <Banner tone="amber" title="Confirming your payment…">
          This usually takes a few seconds. This page updates automatically.
        </Banner>
      )}

      {/* Progress timeline */}
      {!cancelled && (
        <ol className="grid grid-cols-5 gap-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          {STEPS.map((step, index) => {
            const reached = index <= activeIndex;
            return (
              <li key={step.status} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    reached ? 'bg-orange-600 text-white' : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {reached ? <Check size={16} /> : index + 1}
                </span>
                <span className={`text-[11px] leading-tight sm:text-xs ${reached ? 'font-semibold' : 'text-stone-500'}`}>
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Items and totals */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Your items</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {item.productName} <span className="text-stone-500">× {item.quantity}</span>
              </span>
              <span className="font-medium">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Delivery</span>
            <span>{Number(order.deliveryFee) === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      <Link href="/menu" className="inline-block font-semibold text-orange-600 hover:underline">
        ← Continue browsing
      </Link>
    </div>
  );
}