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

export type { DashboardData, DashboardMetric, MetricTone, Person };
