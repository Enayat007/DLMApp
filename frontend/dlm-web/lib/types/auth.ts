// ── Auth Request Types ────────────────────────────────────────────────────────

export interface RegisterRequest {
  firstName:     string;
  lastName:      string;
  email:         string;
  password:      string;
  workspaceName: string;
  subdomain:     string;
  planSlug:      string;
}

export interface LoginRequest {
  email:     string;
  password:  string;
  subdomain: string;
}

// ── Auth Response Types ───────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'Viewer';

export interface UserProfile {
  id:       string;
  fullName: string;
  email:    string;
  role:     UserRole;
  roleName: string;
}

export interface TenantInfo {
  id:           string;
  name:         string;
  subdomain:    string;
  primaryColor: string | null;
  logoUrl:      string | null;
  planName:     string;
  maxDoctors:   number;
}

export interface TokenResponse {
  accessToken: string;
  expiresIn:   number;
  user:        UserProfile;
  tenant:      TenantInfo;
}

// ── Plan Types ────────────────────────────────────────────────────────────────

export interface Plan {
  id:           string;
  name:         string;
  slug:         string;
  priceMonthly: number;
  maxDoctors:   number;
  features:     string[];
  displayOrder: number;
  isPopular:    boolean;
  priceDisplay: string;
  doctorLimit:  string;
}
