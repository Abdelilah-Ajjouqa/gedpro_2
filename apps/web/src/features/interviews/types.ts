export type PersonRef = { id: number; firstName: string; lastName: string };
export type InterviewStatus =
  | 'SCHEDULED'
  | 'RESCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | string;
export type InterviewType = 'HR' | 'TECHNICAL' | 'FINAL' | string;
export type InterviewListParams = {
  view: 'list' | 'agenda';
  from: string;
  to: string;
  status: string;
  type: string;
  applicationId?: number;
  interviewerId: string;
  feedback: string;
  sort: 'date' | 'updatedAt';
  direction: 'asc' | 'desc';
  page: number;
  limit: number;
  tz: string;
};
export type InterviewListItem = {
  id: number;
  version: number;
  date: string;
  duration: number;
  timezone: string;
  status: InterviewStatus;
  type: InterviewType;
  round: number;
  title?: string | null;
  location?: string | null;
  candidate: PersonRef;
  application?: { id: number } | null;
  job?: { id: number; title: string } | null;
  leadInterviewer: PersonRef;
  participantCount: number;
  feedback: { total: number; submitted: number };
  syncStatus: string;
  allowedActions: string[];
  createdAt: string;
  updatedAt: string;
};
export type Criterion = {
  key: string;
  label: string;
  description?: string;
  minRating: number;
  maxRating: number;
  required: boolean;
};
export type Scorecard = {
  id: number;
  version: number;
  reviewer: PersonRef;
  template: { id: number; name: string; criteria: Criterion[] };
  submittedAt?: string | null;
  state: 'notSubmitted' | 'submittedVisible' | 'submittedWithheld';
  ratings?: Record<string, number> | null;
  recommendation?: string | null;
  privateNotes?: string | null;
  allowedActions: string[];
};
export type InterviewDetail = InterviewListItem & {
  notes?: string | null;
  outcomeReason?: string | null;
  feedbackDeadline?: string | null;
  hideFeedbackUntilComplete: boolean;
  attendees: PersonRef[];
  scorecards: Scorecard[];
};
export type InterviewPage = {
  data: InterviewListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
export type Template = {
  id: number;
  name: string;
  description?: string | null;
  criteria: Criterion[];
  job?: { id: number; title: string } | null;
  stage?: { id: number; name: string } | null;
  archived: boolean;
};
export type DecisionSummary = {
  applicationId: number;
  complete: number;
  missing: {
    scorecardId: number;
    interviewId: number;
    reviewer: PersonRef;
    deadline?: string | null;
    overdue: boolean;
  }[];
  scorecards: Array<Scorecard & { interviewId: number }>;
};
