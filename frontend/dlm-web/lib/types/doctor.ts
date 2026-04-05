// ── Enums ─────────────────────────────────────────────────────────────────────

export enum DoctorStatus {
  Active    = 'Active',
  Expired   = 'Expired',
  Suspended = 'Suspended',
}

// ── Response Types ────────────────────────────────────────────────────────────

export interface Doctor {
  id:                string;
  fullName:          string;
  email:             string;
  specialization:    string;
  licenseNumber:     string;
  licenseExpiryDate: string;   // ISO datetime string
  status:            DoctorStatus;
  statusName:        string;
  isExpired:         boolean;
  createdDate:       string;
  updatedDate:       string | null;
}

export interface PagedResult<T> {
  items:          T[];
  totalCount:     number;
  pageNumber:     number;
  pageSize:       number;
  totalPages:     number;
  hasNextPage:    boolean;
  hasPreviousPage: boolean;
}

// ── Request Types ─────────────────────────────────────────────────────────────

export interface CreateDoctorRequest {
  fullName:          string;
  email:             string;
  specialization:    string;
  licenseNumber:     string;
  licenseExpiryDate: string;   // ISO datetime string
  status:            DoctorStatus;
}

export interface UpdateDoctorRequest extends CreateDoctorRequest {}

export interface UpdateStatusRequest {
  status: DoctorStatus;
}

export interface DoctorQueryParams {
  search?:     string;
  status?:     DoctorStatus | '';
  pageNumber?: number;
  pageSize?:   number;
}
