export type TimelineCategory =
  | 'system'
  | 'candidate'
  | 'application'
  | 'stage'
  | 'interview'
  | 'document'
  | 'form'
  | 'communication'
  | 'note';
export type TimelineEvent = {
  id: string;
  type: string;
  category: TimelineCategory;
  occurredAt: string;
  visibility: 'internal' | 'candidate';
  actor: {
    kind: 'user' | 'candidate' | 'system' | 'former' | 'unknown';
    name: string | null;
  };
  candidateId: number;
  applicationId: number | null;
  targetType: 'candidate' | 'application';
  targetId: number;
  payload: {
    text: string | null;
    jobId: number | null;
    jobTitle: string | null;
    previousStageName: string | null;
    newStageName: string | null;
    comment: string | null;
    rejectionReason: string | null;
    summary: string | null;
  };
};
export type TimelinePage = { data: TimelineEvent[]; nextCursor: string | null };
