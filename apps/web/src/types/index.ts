import type { LucideIcon } from 'lucide-react';

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
};

type MetricTone = 'neutral' | 'primary' | 'success' | 'warning';

type DashboardMetric = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  helperText: string;
  tone: MetricTone;
};

type DashboardData = {
  manager: Person;
  dateLabel: string;
  greeting: string;
  metrics: DashboardMetric[];
};

type CandidateStatus = 'new' | 'reviewing' | 'interview' | 'offer' | 'hired' | 'rejected';

type StatusTone = 'neutral' | 'warning' | 'success' | 'danger';

type Candidate = {
  id: string;
  applicationId?: number;
  stageId?: number;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  rating: number;
  appliedAt: string;
  status: CandidateStatus;
};

type PipelineStage = {
  id: string;
  stageId?: number;
  status: CandidateStatus;
  label: string;
  candidates: Candidate[];
};

type Interview = {
  id: string;
  candidate: Person;
  scheduledFor: string;
  timeLabel: string;
  meetingType: 'video' | 'phone' | 'onsite';
};

type ActivityTone = 'neutral' | 'warning' | 'success' | 'danger';

type ActivityEvent = {
  id: string;
  description: string;
  timestamp: string;
  type: 'candidate-added' | 'interview-scheduled' | 'offer-sent' | 'candidate-hired';
  tone: ActivityTone;
};

type DashboardPanelsData = {
  interviews: Interview[];
  activity: ActivityEvent[];
};

type StatusDefinition = {
  label: string;
  tone: StatusTone;
  icon?: LucideIcon;
};

export type {
  Candidate,
  CandidateStatus,
  ActivityEvent,
  ActivityTone,
  DashboardData,
  DashboardPanelsData,
  DashboardMetric,
  MetricTone,
  Interview,
  Person,
  PipelineStage,
  StatusDefinition,
  StatusTone,
};
