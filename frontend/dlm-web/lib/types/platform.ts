export interface PlatformTokenResponse {
  accessToken: string;
  expiresIn:   number;
  adminEmail:  string;
  adminName:   string;
}

export interface TenantSummary {
  id:          string;
  name:        string;
  subdomain:   string;
  isActive:    boolean;
  createdDate: string;
  planName:    string;
  userCount:   number;
  doctorCount: number;
}
