import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  params: Record<string, string>; // current filters, without "page"
}

export function Pagination({ page, totalPages, params }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams(params);
    q.set('page', String(p));
    return `/menu?${q.toString()}`;
  };

  const base = 'inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${base} border-stone-300 bg-white hover:border-orange-400`} aria-label="Previous page">
          <ChevronLeft size={16} />
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`${base} ${
            p === page
              ? 'border-orange-600 bg-orange-600 text-white'
              : 'border-stone-300 bg-white hover:border-orange-400'
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className={`${base} border-stone-300 bg-white hover:border-orange-400`} aria-label="Next page">
          <ChevronRight size={16} />
        </Link>
      )}
    </nav>
  );
}