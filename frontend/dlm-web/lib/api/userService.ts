import axios from 'axios';
import type { WorkspaceUser, CreateUserRequest, UpdateUserRoleRequest } from '@/lib/types/user';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://api.nibrasgroups.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

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

export const userService = {
  getAll: async (): Promise<WorkspaceUser[]> => {
    const { data } = await api.get<WorkspaceUser[]>('/api/users');
    return data;
  },

  create: async (dto: CreateUserRequest): Promise<WorkspaceUser> => {
    const { data } = await api.post<WorkspaceUser>('/api/users', dto);
    return data;
  },

  updateRole: async (id: string, dto: UpdateUserRoleRequest): Promise<WorkspaceUser> => {
    const { data } = await api.patch<WorkspaceUser>(`/api/users/${id}/role`, dto);
    return data;
  },

  deactivate: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};
