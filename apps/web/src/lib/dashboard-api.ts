import { BriefcaseBusiness, CalendarDays, Sparkles, UsersRound } from 'lucide-react';

import { apiRequest } from '@/lib/api-client';
import type { ActivityEvent, Candidate, CandidateStatus, DashboardData, Interview, Person, PipelineStage } from '@/types';

type Page<T> = { data: T[]; total: number; page: number; limit: number };
type ApiPerson = { id: number; firstName: string; lastName: string; role?: string; createdAt?: string };
type ApiStage = { id: number; name: string; category: string; position: number; archived: boolean };
type ApiPipeline = { id: number; stages: ApiStage[] };
type ApiApplication = { id: number; candidate: ApiPerson; job: { id: number; title: string }; currentStage: ApiStage; createdAt: string };
type ApiInterview = { id: number; candidate: ApiPerson; application?: { job?: { title?: string } }; date: string; location?: string | null; calendarProvider?: string | null };
type ApiReport = { totals?: { applications?: number }; };

export type DashboardFilters = {
  jobId?: number;
  search?: string;
  sortBy: 'createdAt' | 'updatedAt' | 'lastName' | 'email';
  sortOrder: 'ASC' | 'DESC';
  page: number;
  limit: number;
};

const statusByCategory: Record<string, CandidateStatus> = {
  applied: 'new', screening: 'reviewing', interview: 'interview', offer: 'offer', hired: 'hired', rejected: 'rejected', withdrawn: 'rejected',
};

function params(values: Record<string, string | number | undefined>) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== '') result.set(key, String(value));
  return result.toString();
}

export async function getDashboardMetrics(filters: DashboardFilters, signal?: AbortSignal): Promise<DashboardData> {
  const query = params({ jobId: filters.jobId });
  const [profile, report, candidates, jobs, interviews] = await Promise.all([
    apiRequest<ApiPerson>('/users/profile', { signal }),
    apiRequest<ApiReport>(`/reports/summary${query ? `?${query}` : ''}`, { signal }),
    apiRequest<Page<ApiPerson>>('/candidates?limit=1', { signal }),
    apiRequest<Page<unknown>>('/jobs?status=published&limit=1', { signal }),
    apiRequest<ApiInterview[]>('/interviews', { signal }),
  ]);
  const today = new Date();
  const newToday = report.totals?.applications ?? 0;
  return {
    manager: { id: String(profile.id), firstName: profile.firstName, lastName: profile.lastName, role: profile.role ?? 'Hiring manager' },
    dateLabel: new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(today),
    greeting: today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening',
    metrics: [
      { id: 'candidates', label: 'Total candidates', value: candidates.total, icon: UsersRound, helperText: 'Across all active roles', tone: 'neutral' },
      { id: 'jobs', label: 'Open jobs', value: jobs.total, icon: BriefcaseBusiness, helperText: 'Published positions', tone: 'primary' },
      { id: 'interviews', label: 'Interviews', value: interviews.filter((item) => new Date(item.date) >= today).length, icon: CalendarDays, helperText: 'Upcoming schedule', tone: 'warning' },
      { id: 'new-today', label: 'Applications', value: newToday, icon: Sparkles, helperText: 'In the selected period', tone: 'success' },
    ],
  };
}

export async function getPipeline(filters: DashboardFilters, signal?: AbortSignal): Promise<PipelineStage[]> {
  const [pipelines, applications, candidatePage] = await Promise.all([
    apiRequest<ApiPipeline[]>('/pipelines', { signal }),
    apiRequest<Page<ApiApplication>>(`/applications?${params({ jobId: filters.jobId, page: filters.page, limit: filters.limit })}`, { signal }),
    filters.search ? getCandidates(filters, signal) : Promise.resolve(undefined),
  ]);
  const visibleCandidateIds = candidatePage ? new Set(candidatePage.data.map((candidate) => candidate.id)) : undefined;
  const stages = pipelines.flatMap((pipeline) => pipeline.stages).filter((stage) => !stage.archived).sort((a, b) => a.position - b.position);
  return stages.map((stage) => ({
    id: String(stage.id), stageId: stage.id, label: stage.name, status: statusByCategory[stage.category] ?? 'reviewing',
    candidates: applications.data.filter((application) => application.currentStage.id === stage.id && (!visibleCandidateIds || visibleCandidateIds.has(application.candidate.id))).map((application): Candidate => ({
      id: String(application.candidate.id), applicationId: application.id, stageId: stage.id,
      firstName: application.candidate.firstName, lastName: application.candidate.lastName,
      role: application.job.title, rating: 0, appliedAt: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(application.createdAt)),
      status: statusByCategory[stage.category] ?? 'reviewing',
    })),
  }));
}

export async function getCandidates(filters: DashboardFilters, signal?: AbortSignal) {
  return apiRequest<Page<ApiPerson>>(`/candidates?${params({ search: filters.search, sortBy: filters.sortBy, sortOrder: filters.sortOrder, page: filters.page, limit: filters.limit })}`, { signal });
}

export async function getUpcomingInterviews(_filters: DashboardFilters, signal?: AbortSignal): Promise<Interview[]> {
  const now = new Date();
  const rows = await apiRequest<ApiInterview[]>('/interviews', { signal });
  return rows.filter((row) => new Date(row.date) >= now).slice(0, 5).map((row) => {
    const date = new Date(row.date);
    const candidate: Person = { id: String(row.candidate.id), firstName: row.candidate.firstName, lastName: row.candidate.lastName, role: row.application?.job?.title ?? 'Candidate' };
    return { id: String(row.id), candidate, scheduledFor: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date), timeLabel: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date), meetingType: row.location ? 'onsite' : row.calendarProvider ? 'video' : 'phone' };
  });
}

export async function getRecentActivity(filters: DashboardFilters, signal?: AbortSignal): Promise<ActivityEvent[]> {
  const rows = await apiRequest<Page<ApiApplication>>(`/applications?${params({ jobId: filters.jobId, page: 1, limit: 5 })}`, { signal });
  return rows.data.map((row) => ({ id: `application-${row.id}`, description: `${row.candidate.firstName} ${row.candidate.lastName} entered ${row.currentStage.name}`, timestamp: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(row.createdAt)), type: row.currentStage.category === 'hired' ? 'candidate-hired' : 'candidate-added', tone: row.currentStage.category === 'hired' ? 'success' : 'neutral' }));
}

export function moveCandidate(applicationId: number, stageId: number) {
  return apiRequest<ApiApplication>(`/applications/${applicationId}/stage`, { method: 'PATCH', body: JSON.stringify({ stageId }) });
}
