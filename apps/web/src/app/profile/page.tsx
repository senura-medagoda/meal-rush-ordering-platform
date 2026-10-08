'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApiData } from '@/hooks/use-api-data';
import { formatPrice } from '@/lib/format';
import type { OrderTracking } from '@/lib/types';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/admin/status-badge';
import { ErrorBox, Loading } from '@/components/admin/ui';
import { useAuthStore } from '@/store/auth';

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

function ProfileView() {
  const profile = useApiData<ProfileUser>('/auth/me');
  const orders = useApiData<OrderTracking[]>('/orders/my');

  if (profile.error) return <ErrorBox message={profile.error} />;
  if (profile.loading || !profile.data) return <Loading text="Loading your profile…" />;
  const user = profile.data;

  return (
    <div className="space-y-8">
      {/* Details */}
      <section className="flex flex-wrap items-center gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 text-2xl font-extrabold text-white">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-stone-600">{user.email}</p>
          <p className="mt-1 text-xs text-stone-500">
            Member since{' '}
            {new Date(user.createdAt).toLocaleDateString('en-LK', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="rounded-2xl bg-orange-50 px-5 py-3 text-center">
          <p className="text-2xl font-extrabold text-orange-600">{orders.data?.length ?? '–'}</p>
          <p className="text-xs text-stone-600">Orders</p>
        </div>
      </section>

      {/* Order history */}
      <section>
        <h2 className="text-xl font-bold">Order history</h2>
        {orders.error && <ErrorBox message={orders.error} />}
        {orders.loading && !orders.data && <Loading />}

        {orders.data && orders.data.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <p className="text-4xl">🍽️</p>
            <p className="mt-3 font-semibold">No orders yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Orders you place while logged in will appear here.
            </p>
            <Link
              href="/menu"
              className="mt-5 inline-block rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
            >
              Browse menu
            </Link>
          </div>
        )}

        <ul className="mt-4 space-y-4">
          {orders.data?.map((order) => (
            <li key={order.orderNumber} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/order/${order.orderNumber}`}
                    className="font-bold text-orange-600 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {new Date(order.createdAt).toLocaleString('en-LK', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OrderStatusBadge status={order.orderStatus} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-stone-600">
                {order.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="text-sm text-stone-500">
                  {order.paymentMethod === 'PAYHERE' ? 'Paid online' : 'WhatsApp order'}
                </span>
                <span className="font-bold">{formatPrice(order.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) return;
    if (!user) router.replace('/login');
    else if (user.role === 'ADMIN') router.replace('/admin');
  }, [loaded, user, router]);

  if (!loaded) return <div className="px-4 py-16 text-center text-stone-500">Loading…</div>;
  if (!user || user.role === 'ADMIN') return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ProfileView />
    </div>
  );
}