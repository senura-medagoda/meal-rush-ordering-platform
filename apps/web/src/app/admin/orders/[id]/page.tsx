'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { useApiData } from '@/hooks/use-api-data';
import { formatPrice } from '@/lib/format';
import type { AdminOrderDetail, OrderStatus, PaymentStatus } from '@/lib/types';
import { OrderStatusBadge, PaymentStatusBadge, prettyStatus } from '@/components/admin/status-badge';
import { ErrorBox, Loading } from '@/components/admin/ui';

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

// 0771234567 -> 94771234567 (for wa.me links)
function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('0') ? `94${digits.slice(1)}` : digits;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, error, loading, refetch } = useApiData<AdminOrderDetail>(`/admin/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function update(body: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus }, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setActionError(null);
    try {
      await apiFetch(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorBox message={error} />;
  if (loading || !order) return <Loading />;

  const nextStatuses = NEXT_STATUSES[order.orderStatus];

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="text-sm font-medium text-stone-600 hover:text-orange-600">
        ← Back to orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-extrabold">{order.orderNumber}</h2>
        <OrderStatusBadge status={order.orderStatus} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>
      <p className="-mt-3 text-sm text-stone-500">
        Placed {new Date(order.createdAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
        {order.paymentMethod === 'PAYHERE' ? 'Paid online (PayHere)' : 'WhatsApp order, pay on delivery'}
      </p>

      {/* Actions */}
      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold">Update order</h3>
        {actionError && <ErrorBox message={actionError} />}

        <div className="flex flex-wrap gap-2">
          {nextStatuses.length === 0 && <p className="text-sm text-stone-500">This order is closed. No further changes.</p>}
          {nextStatuses.map((s) => (
            <button
              key={s}
              disabled={busy}
              onClick={() =>
                update(
                  { orderStatus: s },
                  s === 'CANCELLED' ? 'Cancel this order? Items will be returned to stock.' : undefined,
                )
              }
              className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                s === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {s === 'CANCELLED' ? 'Cancel order' : `Mark as ${prettyStatus(s)}`}
            </button>
          ))}
        </div>

        {order.paymentMethod === 'WHATSAPP' && order.orderStatus !== 'CANCELLED' && (
          <div className="border-t border-stone-100 pt-3">
            <button
              disabled={busy}
              onClick={() => update({ paymentStatus: order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID' })}
              className="rounded-full border border-stone-300 bg-white px-5 py-2 text-sm font-semibold hover:border-orange-400 disabled:opacity-50"
            >
              {order.paymentStatus === 'PAID' ? 'Mark as unpaid' : 'Mark as paid (cash received)'}
            </button>
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-2 rounded-2xl border border-stone-200 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-bold">Customer</h3>
          <p className="font-medium">{order.customerName}</p>
          <p>{order.customerPhone}</p>
          {order.customerEmail && <p>{order.customerEmail}</p>}
          <p className="text-stone-600">
            {order.deliveryAddress}, {order.deliveryCity}
          </p>
          {order.notes && (
            <p className="rounded-lg bg-amber-50 p-2 text-amber-900">
              <span className="font-semibold">Note:</span> {order.notes}
            </p>
          )}
          <a
            href={`https://wa.me/${toWhatsAppNumber(order.customerPhone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block pt-1 font-semibold text-green-700 hover:underline"
          >
            Message on WhatsApp
          </a>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-bold">Items</h3>
          <ul className="mt-3 space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.productName} <span className="text-stone-500">× {item.quantity}</span>
                </span>
                <span className="font-medium">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-stone-200 pt-3">
            <div className="flex justify-between">
              <span className="text-stone-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Delivery</span>
              <span>{Number(order.deliveryFee) === 0 ? 'Free' : formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>
      </div>

      {order.paymentLogs.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm shadow-sm">
          <h3 className="font-bold">PayHere payment log</h3>
          <ul className="mt-3 divide-y divide-stone-100">
            {order.paymentLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  Status code <span className="font-semibold">{log.statusCode}</span> · {log.payload.status_message ?? '—'}
                </span>
                <span className="text-xs text-stone-500">
                  {log.payherePaymentId} · {new Date(log.createdAt).toLocaleString('en-LK')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}