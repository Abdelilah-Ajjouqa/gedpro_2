import { BriefcaseBusiness, CalendarDays, Sparkles, UsersRound } from 'lucide-react';

import type { DashboardData, DashboardPanelsData, PipelineStage } from '@/types';

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

const pipelineFixture: PipelineStage[] = [
  {
    id: 'new',
    label: 'New',
    candidates: [
      { id: 'candidate-maya-chen', firstName: 'Maya', lastName: 'Chen', role: 'Senior Product Designer', rating: 4.8, appliedAt: 'Sep 19', status: 'new' },
      { id: 'candidate-ethan-walker', firstName: 'Ethan', lastName: 'Walker', role: 'Frontend Engineer', rating: 4.5, appliedAt: 'Sep 18', status: 'new' },
    ],
  },
  {
    id: 'reviewing',
    label: 'Reviewing',
    candidates: [
      { id: 'candidate-sofia-martinez', firstName: 'Sofia', lastName: 'Martinez', role: 'Product Manager', rating: 4.9, appliedAt: 'Sep 17', status: 'reviewing' },
      { id: 'candidate-noah-williams', firstName: 'Noah', lastName: 'Williams', role: 'UX Researcher', rating: 4.3, appliedAt: 'Sep 15', status: 'reviewing' },
    ],
  },
  {
    id: 'interview',
    label: 'Interview',
    candidates: [
      { id: 'candidate-olivia-brown', firstName: 'Olivia', lastName: 'Brown', role: 'Backend Engineer', rating: 4.7, appliedAt: 'Sep 12', status: 'interview' },
      { id: 'candidate-liam-davis', firstName: 'Liam', lastName: 'Davis', role: 'Data Analyst', rating: 4.4, appliedAt: 'Sep 11', status: 'interview' },
    ],
  },
  {
    id: 'offer',
    label: 'Offer',
    candidates: [
      { id: 'candidate-ava-thompson', firstName: 'Ava', lastName: 'Thompson', role: 'Marketing Lead', rating: 4.9, appliedAt: 'Sep 8', status: 'offer' },
    ],
  },
  {
    id: 'hired',
    label: 'Hired',
    candidates: [
      { id: 'candidate-james-wilson', firstName: 'James', lastName: 'Wilson', role: 'Staff Engineer', rating: 5, appliedAt: 'Sep 3', status: 'hired' },
    ],
  },
];

async function getPipelineData(): Promise<PipelineStage[]> {
  return pipelineFixture;
}

const dashboardPanelsFixture: DashboardPanelsData = {
  interviews: [
    {
      id: 'interview-olivia-brown',
      candidate: { id: 'candidate-olivia-brown', firstName: 'Olivia', lastName: 'Brown', role: 'Backend Engineer' },
      scheduledFor: 'Today',
      timeLabel: '10:30 AM',
      meetingType: 'video',
    },
    {
      id: 'interview-liam-davis',
      candidate: { id: 'candidate-liam-davis', firstName: 'Liam', lastName: 'Davis', role: 'Data Analyst' },
      scheduledFor: 'Today',
      timeLabel: '2:00 PM',
      meetingType: 'video',
    },
    {
      id: 'interview-sofia-martinez',
      candidate: { id: 'candidate-sofia-martinez', firstName: 'Sofia', lastName: 'Martinez', role: 'Product Manager' },
      scheduledFor: 'Tomorrow',
      timeLabel: '11:00 AM',
      meetingType: 'onsite',
    },
  ],
  activity: [
    { id: 'activity-hired', description: 'James Wilson was moved to Hired', timestamp: '12 min ago', type: 'candidate-hired', tone: 'success' },
    { id: 'activity-offer', description: 'An offer was sent to Ava Thompson', timestamp: '48 min ago', type: 'offer-sent', tone: 'success' },
    { id: 'activity-interview', description: 'Interview scheduled with Olivia Brown', timestamp: '2 hr ago', type: 'interview-scheduled', tone: 'warning' },
    { id: 'activity-added', description: 'Maya Chen was added to the pipeline', timestamp: '4 hr ago', type: 'candidate-added', tone: 'neutral' },
  ],
};

async function getDashboardPanelsData(): Promise<DashboardPanelsData> {
  return dashboardPanelsFixture;
}

export { getDashboardData, getDashboardPanelsData, getPipelineData };
