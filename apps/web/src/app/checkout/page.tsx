'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { CreditCard, MessageCircle } from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { submitToPayhere } from '@/lib/payhere';
import type { CreateOrderResponse, PaymentMethod } from '@/lib/types';
import { useMounted } from '@/hooks/use-mounted';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

function validate(v: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const emailOk = /^\S+@\S+\.\S+$/.test(v.customerEmail.trim());

  if (v.customerName.trim().length < 2) errors.customerName = 'Please enter your full name';
  if (!/^\+?\d{9,15}$/.test(v.customerPhone.replace(/[\s-]/g, ''))) {
    errors.customerPhone = 'Enter a valid phone number, e.g. 0771234567';
  }
  if (v.paymentMethod === 'PAYHERE' && !emailOk) {
    errors.customerEmail = 'Email is required for online payment';
  } else if (v.customerEmail.trim() && !emailOk) {
    errors.customerEmail = 'Enter a valid email address';
  }
  if (v.deliveryAddress.trim().length < 10) errors.deliveryAddress = 'Please enter your full delivery address';
  if (v.deliveryCity.trim().length < 2) errors.deliveryCity = 'Please enter your city';
  return errors;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500';

export default function CheckoutPage() {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  // Only what the customer has typed. Name/email fall back to the logged-in user.
  const [form, setForm] = useState<Partial<FormState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const values: FormState = {
    customerName: form.customerName ?? user?.name ?? '',
    customerPhone: form.customerPhone ?? '',
    customerEmail: form.customerEmail ?? user?.email ?? '',
    deliveryAddress: form.deliveryAddress ?? '',
    deliveryCity: form.deliveryCity ?? '',
    notes: form.notes ?? '',
    paymentMethod: form.paymentMethod ?? 'PAYHERE',
  };

  const set =
    (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!mounted) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-stone-500">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <Link
          href="/menu"
          className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
        >
          Browse menu
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const res = await apiFetch<CreateOrderResponse>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: values.customerName.trim(),
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail.trim() || undefined,
          deliveryAddress: values.deliveryAddress.trim(),
          deliveryCity: values.deliveryCity.trim(),
          notes: values.notes.trim() || undefined,
          paymentMethod: values.paymentMethod,
          // Only IDs and quantities. The server decides the prices.
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });

      if (res.payhere) {
        submitToPayhere(res.payhere.action, res.payhere.fields);
        return; // the browser is now navigating to PayHere
      }

      if (res.whatsappUrl) {
        sessionStorage.setItem(`mealrush-wa-${res.order.orderNumber}`, res.whatsappUrl);
        clearCart();
        router.push(`/order/${res.order.orderNumber}`);
      }
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : 'Could not place your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const methodCard = (method: PaymentMethod, selected: boolean) =>
    `flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
      selected ? 'border-orange-600 bg-orange-50' : 'border-stone-300 bg-white hover:border-orange-300'
    }`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Checkout</h1>

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.customerName}>
                <input className={inputClass} value={values.customerName} onChange={set('customerName')} maxLength={80} />
              </Field>
              <Field label="Phone number" error={errors.customerPhone}>
                <input
                  className={inputClass}
                  type="tel"
                  value={values.customerPhone}
                  onChange={set('customerPhone')}
                  placeholder="0771234567"
                />
              </Field>
            </div>
            <Field
              label={values.paymentMethod === 'PAYHERE' ? 'Email' : 'Email (optional)'}
              error={errors.customerEmail}
            >
              <input className={inputClass} type="email" value={values.customerEmail} onChange={set('customerEmail')} />
            </Field>
            <Field label="Delivery address" error={errors.deliveryAddress}>
              <textarea
                className={inputClass}
                rows={2}
                value={values.deliveryAddress}
                onChange={set('deliveryAddress')}
                maxLength={250}
                placeholder="House no, street, area"
              />
            </Field>
            <Field label="City" error={errors.deliveryCity}>
              <input className={inputClass} value={values.deliveryCity} onChange={set('deliveryCity')} maxLength={60} />
            </Field>
            <Field label="Order notes (optional)">
              <textarea
                className={inputClass}
                rows={2}
                value={values.notes}
                onChange={set('notes')}
                maxLength={300}
                placeholder="Less spicy, no onions, etc."
              />
            </Field>
          </section>

          <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">How would you like to order?</h2>

            <label className={methodCard('PAYHERE', values.paymentMethod === 'PAYHERE')}>
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1"
                checked={values.paymentMethod === 'PAYHERE'}
                onChange={() => setForm((f) => ({ ...f, paymentMethod: 'PAYHERE' }))}
              />
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <CreditCard size={18} /> Pay online (PayHere)
                </p>
                <p className="text-sm text-stone-600">Secure card payment. Your order is confirmed automatically.</p>
              </div>
            </label>

            <label className={methodCard('WHATSAPP', values.paymentMethod === 'WHATSAPP')}>
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1"
                checked={values.paymentMethod === 'WHATSAPP'}
                onChange={() => setForm((f) => ({ ...f, paymentMethod: 'WHATSAPP' }))}
              />
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <MessageCircle size={18} /> Order via WhatsApp
                </p>
                <p className="text-sm text-stone-600">
                  Send your full order to us on WhatsApp. Pay on delivery.
                </p>
              </div>
            </label>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3">
                <span className="text-stone-700">
                  {i.name} <span className="text-stone-500">× {i.quantity}</span>
                </span>
                <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-1 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Delivery</span>
              <span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatPrice(subtotal + deliveryFee)}</span>
            </div>
          </div>

          {serverError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-orange-600 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting
              ? 'Placing order…'
              : values.paymentMethod === 'PAYHERE'
                ? 'Continue to payment'
                : 'Place order'}
          </button>
          <p className="text-center text-xs text-stone-500">
            The final total is confirmed by our server when you place the order.
          </p>
        </aside>
      </form>
    </div>
  );
}