import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-5xl">🍽️</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-stone-600">That dish or page doesn&apos;t exist (or is no longer available).</p>
      <Link
        href="/menu"
        className="mt-6 inline-block rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
      >
        Back to menu
      </Link>
    </div>
  );
}