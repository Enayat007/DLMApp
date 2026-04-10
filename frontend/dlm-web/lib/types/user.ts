export type UserRole = 'Admin' | 'Viewer';

export interface WorkspaceUser {
  id:          string;
  fullName:    string;
  email:       string;
  role:        UserRole;
  isActive:    boolean;
  createdDate: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  role:      UserRole;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}
