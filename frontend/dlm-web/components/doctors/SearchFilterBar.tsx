'use client';

import { useRef, useState } from 'react';
import { DoctorStatus, type DoctorQueryParams } from '@/lib/types/doctor';
import { Input, Select } from '@/components/ui/Input';

interface SearchFilterBarProps {
  params:   DoctorQueryParams;
  onChange: (params: DoctorQueryParams) => void;
}

export function SearchFilterBar({ params, onChange }: SearchFilterBarProps) {
  const [search, setSearch] = useState(params.search ?? '');
  const debounceRef         = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search: fire after 400 ms idle
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...params, search: value || undefined, pageNumber: 1 });
    }, 400);
  };

  const handleStatusChange = (value: string) => {
    onChange({
      ...params,
      status:     (value as DoctorStatus) || undefined,
      pageNumber: 1,
    });
  };

  const handleClear = () => {
    setSearch('');
    onChange({ pageNumber: 1, pageSize: params.pageSize });
  };

  const hasFilters = search || params.status;

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or license number…"
          className="input pl-10 pr-4"
        />
      </div>

      {/* Status filter */}
      <div className="sm:w-52">
        <select
          value={params.status ?? ''}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="input cursor-pointer"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value={DoctorStatus.Active}>Active</option>
          <option value={DoctorStatus.Expired}>Expired</option>
          <option value={DoctorStatus.Suspended}>Suspended</option>
        </select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={handleClear}
          className="btn-ghost whitespace-nowrap"
          title="Clear all filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
