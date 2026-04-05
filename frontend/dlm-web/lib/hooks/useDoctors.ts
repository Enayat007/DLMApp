'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { doctorService } from '@/lib/api/doctorService';
import type { Doctor, DoctorQueryParams, PagedResult } from '@/lib/types/doctor';

interface UseDoctorsState {
  data:       PagedResult<Doctor> | null;
  isLoading:  boolean;
  error:      string | null;
}

export function useDoctors(initialParams: DoctorQueryParams = {}) {
  const [params, setParams]   = useState<DoctorQueryParams>(initialParams);
  const [state, setState]     = useState<UseDoctorsState>({
    data:      null,
    isLoading: true,
    error:     null,
  });

  // Abort controller to cancel in-flight requests when params change
  const abortRef = useRef<AbortController | null>(null);

  const fetchDoctors = useCallback(async (queryParams: DoctorQueryParams) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await doctorService.getAll(queryParams);
      setState({ data: result, isLoading: false, error: null });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to load doctors.';
      setState(prev => ({ ...prev, isLoading: false, error: msg }));
    }
  }, []);

  useEffect(() => {
    fetchDoctors(params);
    return () => abortRef.current?.abort();
  }, [params, fetchDoctors]);

  const refresh = useCallback(() => fetchDoctors(params), [params, fetchDoctors]);

  return {
    ...state,
    params,
    setParams,
    refresh,
  };
}
