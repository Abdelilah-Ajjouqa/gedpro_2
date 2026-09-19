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
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  rating: number;
  appliedAt: string;
  status: CandidateStatus;
};

type PipelineStage = {
  id: CandidateStatus;
  label: string;
  candidates: Candidate[];
};

type StatusDefinition = {
  label: string;
  tone: StatusTone;
  icon?: LucideIcon;
};

export type {
  Candidate,
  CandidateStatus,
  DashboardData,
  DashboardMetric,
  MetricTone,
  Person,
  PipelineStage,
  StatusDefinition,
  StatusTone,
};
