import { Suspense } from 'react';
import { OrderStatusView } from '@/components/order-status-view';

export const metadata = { title: 'Your order' };

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">Loading…</div>}>
      <OrderStatusView orderNumber={orderNumber} />
    </Suspense>
  );
}