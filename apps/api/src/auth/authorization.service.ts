import { Injectable } from '@nestjs/common';
import { Role } from '../users/enums/role.enum';

export const CAPABILITIES = {
  DASHBOARD_VIEW: 'dashboard:view',
  CANDIDATES_READ: 'candidates:read',
  CANDIDATES_WRITE: 'candidates:write',
  JOBS_READ: 'jobs:read',
  JOBS_WRITE: 'jobs:write',
  APPLICATIONS_READ: 'applications:read',
  APPLICATIONS_WRITE: 'applications:write',
  INTERVIEWS_READ: 'interviews:read',
  INTERVIEWS_MANAGE: 'interviews:manage',
  INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD: 'interviews:submit-assigned-scorecard',
  DOCUMENTS_READ: 'documents:read',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

const capabilitiesByRole: Record<Role, readonly Capability[]> = {
  [Role.ADMIN]: Object.values(CAPABILITIES),
  [Role.RH]: [
    CAPABILITIES.DASHBOARD_VIEW,
    CAPABILITIES.CANDIDATES_READ,
    CAPABILITIES.CANDIDATES_WRITE,
    CAPABILITIES.JOBS_READ,
    CAPABILITIES.JOBS_WRITE,
    CAPABILITIES.APPLICATIONS_READ,
    CAPABILITIES.APPLICATIONS_WRITE,
    CAPABILITIES.INTERVIEWS_READ,
    CAPABILITIES.INTERVIEWS_MANAGE,
    CAPABILITIES.INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD,
    CAPABILITIES.DOCUMENTS_READ,
    CAPABILITIES.USERS_READ,
  ],
  [Role.MANAGER]: [
    CAPABILITIES.DASHBOARD_VIEW,
    CAPABILITIES.CANDIDATES_READ,
    CAPABILITIES.JOBS_READ,
    CAPABILITIES.APPLICATIONS_READ,
    CAPABILITIES.INTERVIEWS_READ,
    CAPABILITIES.INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD,
    CAPABILITIES.DOCUMENTS_READ,
  ],
  [Role.CANDIDATE]: [CAPABILITIES.DOCUMENTS_READ],
};

@Injectable()
export class AuthorizationService {
  static capabilitiesFor(role: Role): Capability[] {
    return [...(capabilitiesByRole[role] ?? [])];
  }

  static hasEvery(role: Role, required: readonly string[]): boolean {
    const granted = new Set<string>(this.capabilitiesFor(role));
    return required.every((capability) => granted.has(capability));
  }

  capabilitiesFor(role: Role): Capability[] {
    return AuthorizationService.capabilitiesFor(role);
  }

  hasEvery(role: Role, required: readonly string[]): boolean {
    return AuthorizationService.hasEvery(role, required);
  }
}
