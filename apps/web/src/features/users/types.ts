export type UserRole = 'admin' | 'rh' | 'manager' | 'candidate';
export type AdminUserListItem = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};
export type AdminUserDetail = AdminUserListItem & {
  emailVerified: boolean;
  updatedAt: string;
};
export type UserDirectoryFilters = {
  q?: string;
  role?: UserRole;
  active?: boolean;
  page: number;
  limit: number;
};
export const roles: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: 'Administrator',
    description: 'Manages product access and administration.',
  },
  rh: { label: 'Recruiter', description: 'Manages recruitment operations.' },
  manager: {
    label: 'Manager',
    description: 'Has job-scoped operational visibility.',
  },
  candidate: {
    label: 'Candidate',
    description: 'Uses candidate-facing and self-service features.',
  },
};
