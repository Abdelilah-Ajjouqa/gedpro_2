import { Injectable } from '@nestjs/common';
import { Role } from '../users/enums/role.enum';

export const CAPABILITIES = {
  DASHBOARD_VIEW: 'dashboard:view',
  CANDIDATES_READ: 'candidates:read',
  CANDIDATES_WRITE: 'candidates:write',
  CANDIDATES_CREATE: 'candidates:create',
  CANDIDATES_UPDATE: 'candidates:update',
  CANDIDATES_STATE: 'candidates:state',
  CANDIDATES_ARCHIVE: 'candidates:archive',
  CANDIDATES_RESTORE: 'candidates:restore',
  CANDIDATES_DUPLICATES_READ: 'candidates:duplicates:read',
  CANDIDATES_MERGE: 'candidates:merge',
  CANDIDATES_PRIVACY_EXPORT: 'candidates:privacy:export',
  CANDIDATES_PRIVACY_REQUEST_DELETION: 'candidates:privacy:request-deletion',
  CANDIDATES_PRIVACY_ERASE: 'candidates:privacy:erase',
  JOBS_READ: 'jobs:read',
  JOBS_WRITE: 'jobs:write',
  JOBS_CREATE: 'jobs:create',
  JOBS_UPDATE: 'jobs:update',
  JOBS_PUBLISH: 'jobs:publish',
  JOBS_CLOSE: 'jobs:close',
  JOBS_REOPEN: 'jobs:reopen',
  JOBS_ARCHIVE: 'jobs:archive',
  PIPELINES_READ: 'pipelines:read',
  PIPELINES_CONFIGURE: 'pipelines:configure',
  PIPELINES_ARCHIVE: 'pipelines:archive',
  APPLICATIONS_READ: 'applications:read',
  APPLICATIONS_WRITE: 'applications:write',
  APPLICATIONS_CREATE: 'applications:create',
  APPLICATIONS_TRANSITION: 'applications:transition',
  APPLICATIONS_REOPEN: 'applications:reopen',
  APPLICATIONS_BULK_MOVE: 'applications:bulk-move',
  INTERVIEWS_READ: 'interviews:read',
  INTERVIEWS_MANAGE: 'interviews:manage',
  INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD: 'interviews:submit-assigned-scorecard',
  DOCUMENTS_READ: 'documents:read',
  TIMELINE_CANDIDATE_READ: 'timeline:candidate:read',
  TIMELINE_APPLICATION_READ: 'timeline:application:read',
  TIMELINE_CANDIDATE_NOTE_CREATE: 'timeline:candidate:note:create',
  TIMELINE_APPLICATION_NOTE_CREATE: 'timeline:application:note:create',
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
    CAPABILITIES.CANDIDATES_CREATE,
    CAPABILITIES.CANDIDATES_UPDATE,
    CAPABILITIES.CANDIDATES_STATE,
    CAPABILITIES.CANDIDATES_ARCHIVE,
    CAPABILITIES.CANDIDATES_RESTORE,
    CAPABILITIES.CANDIDATES_DUPLICATES_READ,
    CAPABILITIES.CANDIDATES_MERGE,
    CAPABILITIES.CANDIDATES_PRIVACY_EXPORT,
    CAPABILITIES.CANDIDATES_PRIVACY_REQUEST_DELETION,
    CAPABILITIES.JOBS_READ,
    CAPABILITIES.JOBS_WRITE,
    CAPABILITIES.JOBS_CREATE,
    CAPABILITIES.JOBS_UPDATE,
    CAPABILITIES.JOBS_PUBLISH,
    CAPABILITIES.JOBS_CLOSE,
    CAPABILITIES.JOBS_REOPEN,
    CAPABILITIES.PIPELINES_READ,
    CAPABILITIES.PIPELINES_CONFIGURE,
    CAPABILITIES.PIPELINES_ARCHIVE,
    CAPABILITIES.APPLICATIONS_READ,
    CAPABILITIES.APPLICATIONS_WRITE,
    CAPABILITIES.APPLICATIONS_CREATE,
    CAPABILITIES.APPLICATIONS_TRANSITION,
    CAPABILITIES.APPLICATIONS_REOPEN,
    CAPABILITIES.APPLICATIONS_BULK_MOVE,
    CAPABILITIES.INTERVIEWS_READ,
    CAPABILITIES.INTERVIEWS_MANAGE,
    CAPABILITIES.INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD,
    CAPABILITIES.DOCUMENTS_READ,
    CAPABILITIES.TIMELINE_CANDIDATE_READ,
    CAPABILITIES.TIMELINE_APPLICATION_READ,
    CAPABILITIES.TIMELINE_CANDIDATE_NOTE_CREATE,
    CAPABILITIES.TIMELINE_APPLICATION_NOTE_CREATE,
    CAPABILITIES.USERS_READ,
  ],
  [Role.MANAGER]: [
    CAPABILITIES.DASHBOARD_VIEW,
    CAPABILITIES.CANDIDATES_READ,
    CAPABILITIES.JOBS_READ,
    CAPABILITIES.PIPELINES_READ,
    CAPABILITIES.APPLICATIONS_READ,
    CAPABILITIES.INTERVIEWS_READ,
    CAPABILITIES.INTERVIEWS_SUBMIT_ASSIGNED_SCORECARD,
    CAPABILITIES.DOCUMENTS_READ,
    CAPABILITIES.TIMELINE_CANDIDATE_READ,
    CAPABILITIES.TIMELINE_APPLICATION_READ,
    CAPABILITIES.TIMELINE_CANDIDATE_NOTE_CREATE,
    CAPABILITIES.TIMELINE_APPLICATION_NOTE_CREATE,
  ],
  [Role.CANDIDATE]: [
    CAPABILITIES.DOCUMENTS_READ,
    CAPABILITIES.TIMELINE_CANDIDATE_READ,
    CAPABILITIES.TIMELINE_APPLICATION_READ,
  ],
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
