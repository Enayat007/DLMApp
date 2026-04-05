import axios, { AxiosError } from 'axios';
import type {
  CreateDoctorRequest,
  Doctor,
  DoctorQueryParams,
  PagedResult,
  UpdateDoctorRequest,
  UpdateStatusRequest,
} from '@/lib/types/doctor';

// ── Axios instance ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://api.nibrasgroups.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Attach JWT + tenant subdomain from localStorage before every request
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('dlm_auth');
      if (raw) {
        const auth = JSON.parse(raw) as { token?: string; tenant?: { subdomain?: string } };
        if (auth.token)
          config.headers.Authorization = `Bearer ${auth.token}`;
        if (auth.tenant?.subdomain)
          config.headers['X-Tenant-Subdomain'] = auth.tenant.subdomain;
      }
    } catch { /* ignore */ }
  }
  return config;
});

// ── Error normalisation ────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  code?:   string;
  errors?: Record<string, string[]>;
  status:  number;
}

function normaliseError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{
      message?: string;
      code?: string;
      errors?: Record<string, string[]>;
      title?: string;
    }>;

    const data   = axiosErr.response?.data;
    const status = axiosErr.response?.status ?? 0;

    return {
      message: data?.message ?? data?.title ?? axiosErr.message,
      code:    data?.code,
      errors:  data?.errors,
      status,
    };
  }
  return { message: String(err), status: 0 };
}

// ── Service methods ────────────────────────────────────────────────────────────

export const doctorService = {
  /**
   * GET /api/doctors — uses sp_GetDoctors stored procedure on the backend.
   * Supports search, status filter, and pagination.
   */
  async getAll(params: DoctorQueryParams = {}): Promise<PagedResult<Doctor>> {
    try {
      const { data } = await api.get<PagedResult<Doctor>>('/api/doctors', {
        params: {
          search:     params.search     || undefined,
          status:     params.status     || undefined,
          pageNumber: params.pageNumber ?? 1,
          pageSize:   params.pageSize   ?? 10,
        },
      });
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** GET /api/doctors/:id */
  async getById(id: string): Promise<Doctor> {
    try {
      const { data } = await api.get<Doctor>(`/api/doctors/${id}`);
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** POST /api/doctors */
  async create(dto: CreateDoctorRequest): Promise<Doctor> {
    try {
      const { data } = await api.post<Doctor>('/api/doctors', dto);
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** PUT /api/doctors/:id */
  async update(id: string, dto: UpdateDoctorRequest): Promise<Doctor> {
    try {
      const { data } = await api.put<Doctor>(`/api/doctors/${id}`, dto);
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** PATCH /api/doctors/:id/status */
  async updateStatus(id: string, dto: UpdateStatusRequest): Promise<Doctor> {
    try {
      const { data } = await api.patch<Doctor>(`/api/doctors/${id}/status`, dto);
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** DELETE /api/doctors/:id */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/api/doctors/${id}`);
    } catch (err) {
      throw normaliseError(err);
    }
  },

  /** GET /api/doctors/expired (bonus endpoint) */
  async getExpired(): Promise<Doctor[]> {
    try {
      const { data } = await api.get<Doctor[]>('/api/doctors/expired');
      return data;
    } catch (err) {
      throw normaliseError(err);
    }
  },
};
