import axios from 'axios';
import type { PlatformTokenResponse, TenantSummary } from '@/lib/types/platform';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nibrasgroups.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('dlm_platform_auth');
      if (raw) {
        const auth = JSON.parse(raw) as { token?: string };
        if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`;
      }
    } catch { /* ignore */ }
  }
  return config;
});

export const platformService = {
  setup: async (payload: {
    email: string; fullName: string; password: string; setupKey: string;
  }): Promise<PlatformTokenResponse> => {
    const { data } = await api.post<PlatformTokenResponse>('/api/platform/auth/setup', payload);
    return data;
  },

  login: async (email: string, password: string): Promise<PlatformTokenResponse> => {
    const { data } = await api.post<PlatformTokenResponse>('/api/platform/auth/login', { email, password });
    return data;
  },

  getTenants: async (): Promise<TenantSummary[]> => {
    const { data } = await api.get<TenantSummary[]>('/api/platform/tenants');
    return data;
  },

  suspendTenant: async (id: string): Promise<TenantSummary> => {
    const { data } = await api.patch<TenantSummary>(`/api/platform/tenants/${id}/suspend`);
    return data;
  },

  reactivateTenant: async (id: string): Promise<TenantSummary> => {
    const { data } = await api.patch<TenantSummary>(`/api/platform/tenants/${id}/reactivate`);
    return data;
  },

  changePlan: async (id: string, planSlug: string): Promise<TenantSummary> => {
    const { data } = await api.patch<TenantSummary>(`/api/platform/tenants/${id}/plan`, { planSlug });
    return data;
  },
};
