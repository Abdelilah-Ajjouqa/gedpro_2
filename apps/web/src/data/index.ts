import { BriefcaseBusiness, CalendarDays, Sparkles, UsersRound } from 'lucide-react';

import type { DashboardData } from '@/types';

const dashboardFixture: DashboardData = {
  manager: {
    id: 'manager-alex-morgan',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'Hiring manager',
  },
  dateLabel: 'Saturday, September 19',
  greeting: 'Good afternoon',
  metrics: [
    {
      id: 'candidates',
      label: 'Total candidates',
      value: 248,
      icon: UsersRound,
      helperText: 'Across all active roles',
      tone: 'neutral',
    },
    {
      id: 'jobs',
      label: 'Open jobs',
      value: 12,
      icon: BriefcaseBusiness,
      helperText: '4 closing this month',
      tone: 'primary',
    },
    {
      id: 'interviews',
      label: 'Interviews',
      value: 8,
      icon: CalendarDays,
      helperText: 'Scheduled this week',
      tone: 'warning',
    },
    {
      id: 'new-today',
      label: 'New today',
      value: 16,
      icon: Sparkles,
      helperText: 'Candidate applications',
      tone: 'success',
    },
  ],
};

async function getDashboardData(): Promise<DashboardData> {
  return dashboardFixture;
}

export { getDashboardData };
