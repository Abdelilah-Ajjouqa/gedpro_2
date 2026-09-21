export type StageCategory =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | string;
export type PersonRef = { id: number; firstName: string; lastName: string };
export type ApplicationStage = {
  id: number;
  name: string;
  category: StageCategory;
  position: number;
  archived: boolean;
  terminal: boolean;
};
export type ApplicationSummary = {
  id: number;
  version: number;
  candidate: PersonRef & { email?: string | null };
  job: { id: number; title: string };
  owner?: PersonRef | null;
  currentStage: ApplicationStage;
  source?: string | null;
  terminal: boolean;
  reopenEligible: boolean;
  allowedActions: string[];
  allowedTransitions: {
    stage: ApplicationStage;
    requiresRejectionReason: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
};
export type ApplicationDetail = ApplicationSummary & {
  rejectionReason?: string | null;
  history: {
    id: number;
    kind: 'created' | 'transitioned' | 'reopened';
    previousStage?: ApplicationStage | null;
    newStage: ApplicationStage;
    comment?: string | null;
    rejectionReason?: string | null;
    actor?: PersonRef | null;
    changedAt: string;
  }[];
};
export type ApplicationListParams = {
  q: string;
  jobId?: number;
  candidateId?: number;
  stageCategory?: string;
  terminal: 'active' | 'terminal' | 'all';
  sort: 'createdAt' | 'updatedAt' | 'candidate' | 'job' | 'stage';
  direction: 'asc' | 'desc';
  page: number;
  limit: number;
};
export type ApplicationListResponse = {
  data: ApplicationSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
