'use client';

import clsx from 'clsx';

interface PaginationProps {
  pageNumber:  number;
  totalPages:  number;
  totalCount:  number;
  pageSize:    number;
  onPageChange: (page: number) => void;
}

export function Pagination({ pageNumber, totalPages, totalCount, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (pageNumber - 1) * pageSize + 1;
  const to   = Math.min(pageNumber * pageSize, totalCount);

  const pages = buildPageNumbers(pageNumber, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700">{totalCount}</span> doctors
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={pageNumber === 1}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(Number(p))}
              className={clsx(
                'min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors',
                p === pageNumber
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={pageNumber === totalPages}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Returns page numbers with ellipsis for long ranges */
function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | '...')[] = [1];

  if (current > 3)  result.push('...');

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);

  for (let p = start; p <= end; p++) result.push(p);

  if (current < total - 2) result.push('...');

  result.push(total);
  return result;
}
