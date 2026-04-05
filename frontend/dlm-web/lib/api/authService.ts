import axios from 'axios';
import type { LoginRequest, RegisterRequest, TokenResponse } from '@/lib/types/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://api.nibrasgroups.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

export interface ApiError {
  message: string;
  code?:   string;
  errors?: Record<string, string[]>;
  status:  number;
}

function normalise(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data   = err.response?.data as { message?: string; code?: string; errors?: Record<string, string[]>; title?: string } | undefined;
    return {
      message: data?.message ?? data?.title ?? err.message,
      code:    data?.code,
      errors:  data?.errors,
      status:  err.response?.status ?? 0,
    };
  }
  return { message: String(err), status: 0 };
}

export const authService = {
  async register(dto: RegisterRequest): Promise<TokenResponse> {
    try {
      const { data } = await api.post<TokenResponse>('/api/auth/register', dto);
      return data;
    } catch (err) { throw normalise(err); }
  },

  async login(dto: LoginRequest): Promise<TokenResponse> {
    try {
      const { data } = await api.post<TokenResponse>('/api/auth/login', dto);
      return data;
    } catch (err) { throw normalise(err); }
  },
};

export const planApiService = {
  async getAll() {
    const { data } = await api.get('/api/plans');
    return data;
  }
};
