import Link from 'next/link';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';
import type { Category, Paginated, Product } from '@/lib/types';

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    apiFetch<Category[]>('/categories'),
    apiFetch<Paginated<Product>>('/products?limit=8'),
  ]);

  const steps = [
    { icon: '🍛', title: 'Pick your meal', text: 'Browse our menu and add your favourites to the cart.' },
    { icon: '💳', title: 'Pay or WhatsApp', text: 'Pay securely online, or send your order to us on WhatsApp.' },
    { icon: '🛵', title: 'Enjoy it hot', text: 'We prepare and deliver your food fresh to your door.' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-orange-50 to-stone-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Online food ordering</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
              Hot, fresh meals, <span className="text-orange-600">delivered fast.</span>
            </h1>
            <p className="mt-4 max-w-md text-stone-600">
              From rice &amp; curry to kottu and cold drinks. Order online in a minute and we&apos;ll handle the rest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
              >
                Order now
              </Link>
              <Link
                href="/menu?isVeg=true"
                className="rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold hover:border-orange-400"
              >
                Veg options
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center text-6xl sm:text-7xl" aria-hidden="true">
            <div className="rounded-3xl bg-white p-6 shadow-sm">🍛</div>
            <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">🍔</div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">🥤</div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">Browse by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/menu?category=${c.slug}`}
              className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm transition hover:border-orange-400 hover:shadow-md"
            >
              <p className="font-semibold">{c.name}</p>
              <p className="mt-1 text-xs text-stone-500">{c._count?.products ?? 0} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Popular picks</h2>
          <Link href="/menu" className="text-sm font-semibold text-orange-600 hover:underline">
            View full menu →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
              <p className="text-4xl">{s.icon}</p>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}