export type CandidateState =
  | 'new'
  | 'preselected'
  | 'interview_scheduled'
  | 'in_interview'
  | 'accepted'
  | 'rejected';
export type CandidateDisposition = 'active' | 'archived' | 'merged' | 'erased';
export type CandidateOwner = {
  id: number;
  firstName: string;
  lastName: string;
};
export type CandidateListItem = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  tags: string[];
  skills: string[];
  source: string | null;
  owner: CandidateOwner | null;
  state: CandidateState;
  disposition: CandidateDisposition;
  createdAt: string;
  updatedAt: string;
  version: number;
};
export type CandidatePrivacyStatus = {
  consent: boolean;
  consentAt: string | null;
  retentionUntil: string | null;
  deletionRequestedAt: string | null;
  erasedAt: string | null;
  erasureBlocked: boolean;
  allowedActions: string[];
};
export type CandidateProfile = CandidateListItem & {
  stateHistory: {
    id: number;
    previousState: CandidateState;
    newState: CandidateState;
    comment: string | null;
    changedAt: string;
    changedBy: CandidateOwner | null;
  }[];
  mergedInto: { id: number; displayName: string } | null;
  privacy: CandidatePrivacyStatus | null;
  applicationCount: number;
  allowedActions: string[];
};
export type CandidateListParams = {
  q: string;
  tag?: string;
  skill?: string;
  source?: string;
  ownerId?: number;
  disposition: 'active' | 'archived' | 'all';
  state?: CandidateState;
  sort: 'createdAt' | 'updatedAt' | 'lastName' | 'email';
  direction: 'asc' | 'desc';
  page: number;
  limit: 10 | 20 | 50 | 100;
};
export type CandidateListResponse = {
  data: CandidateListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
export type CandidateFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  skills?: string[];
  source?: string;
  ownerId?: number;
  privacyConsent?: boolean;
  retentionUntil?: string;
};
export const stateLabels: Record<CandidateState, string> = {
  new: 'New',
  preselected: 'Preselected',
  interview_scheduled: 'Interview scheduled',
  in_interview: 'In interview',
  accepted: 'Accepted',
  rejected: 'Rejected',
};
