'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-5xl">😕</p>
      <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-stone-600">We couldn&apos;t load this page. Please try again in a moment.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
      >
        Try again
      </button>
    </div>
  );
}