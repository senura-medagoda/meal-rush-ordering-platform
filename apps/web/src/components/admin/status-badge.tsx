import type { OrderStatus, PaymentStatus } from '@/lib/types';

const ORDER_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-stone-200 text-stone-700',
};

export const prettyStatus = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const base = 'inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${base} ${ORDER_STYLES[status]}`}>{prettyStatus(status)}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`${base} ${PAYMENT_STYLES[status]}`}>{prettyStatus(status)}</span>;
}