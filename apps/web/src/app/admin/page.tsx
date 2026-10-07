'use client';

import Link from 'next/link';
import { useApiData } from '@/hooks/use-api-data';
import { formatPrice } from '@/lib/format';
import type { AdminOrderListItem, DashboardStats, Paginated } from '@/lib/types';
import { OrderStatusBadge } from '@/components/admin/status-badge';
import { ErrorBox, Loading } from '@/components/admin/ui';

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const stats = useApiData<DashboardStats>('/admin/stats');
  const recent = useApiData<Paginated<AdminOrderListItem>>('/admin/orders?limit=5');

  if (stats.error) return <ErrorBox message={stats.error} />;
  if (stats.loading || !stats.data) return <Loading />;
  const s = stats.data;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders today" value={s.ordersToday} />
        <StatCard label="Revenue today" value={formatPrice(s.revenueToday)} hint="Paid orders only" />
        <StatCard label="Pending orders" value={s.pendingOrders} hint="Waiting to be confirmed" />
        <StatCard label="Menu items" value={s.totalProducts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-orange-600 hover:underline">
              View all
            </Link>
          </div>
          {recent.error && <ErrorBox message={recent.error} />}
          <ul className="mt-4 divide-y divide-stone-100">
            {recent.data?.data.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-stone-50">
                  <div>
                    <p className="text-sm font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-stone-500">
                      {o.customerName} · {formatPrice(o.total)}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.orderStatus} />
                </Link>
              </li>
            ))}
            {recent.data?.data.length === 0 && <li className="py-6 text-center text-sm text-stone-500">No orders yet</li>}
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Low stock (5 or fewer)</h2>
          <ul className="mt-4 divide-y divide-stone-100">
            {s.lowStock.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between py-3 text-sm hover:bg-stone-50">
                  <span>{p.name}</span>
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </Link>
              </li>
            ))}
            {s.lowStock.length === 0 && (
              <li className="py-6 text-center text-sm text-stone-500">All items are well stocked 🎉</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}