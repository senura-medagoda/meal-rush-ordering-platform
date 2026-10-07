'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApiData } from '@/hooks/use-api-data';
import { formatPrice } from '@/lib/format';
import type { AdminOrderListItem, Paginated } from '@/lib/types';
import { OrderStatusBadge, PaymentStatusBadge, prettyStatus } from '@/components/admin/status-badge';
import { ErrorBox, Loading } from '@/components/admin/ui';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

const selectClass = 'rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500';

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const qs = new URLSearchParams({ page: String(page), limit: '15' });
  if (status) qs.set('status', status);
  if (method) qs.set('paymentMethod', method);
  if (search) qs.set('search', search);

  const { data, error, loading } = useApiData<Paginated<AdminOrderListItem>>(`/admin/orders?${qs.toString()}`);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(term.trim());
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={onSearch} className="flex gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Order no, name or phone"
            maxLength={60}
            className={`${selectClass} w-56`}
          />
          <button className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            Search
          </button>
        </form>

        <select
          className={selectClass}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {prettyStatus(s)}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All payment methods</option>
          <option value="PAYHERE">PayHere</option>
          <option value="WHATSAPP">WhatsApp</option>
        </select>
      </div>

      {error && <ErrorBox message={error} />}
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.data.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-semibold">
                      <Link href={`/admin/orders/${o.id}`} className="text-orange-600 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{o.customerName}</p>
                      <p className="text-xs text-stone-500">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">{o._count.items}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(o.total)}</td>
                    <td className="space-y-1 px-4 py-3">
                      <p className="text-xs text-stone-500">{o.paymentMethod === 'PAYHERE' ? 'PayHere' : 'WhatsApp'}</p>
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {new Date(o.createdAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
                {data.data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-stone-500">
                      No orders match these filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-stone-500">
              {data.meta.total} orders · page {data.meta.page} of {Math.max(1, data.meta.totalPages)}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}