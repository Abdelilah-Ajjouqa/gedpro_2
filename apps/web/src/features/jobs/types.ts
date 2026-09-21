export const jobStatuses = ['draft', 'published', 'closed', 'archived'] as const;
export type JobStatus = (typeof jobStatuses)[number];
export type JobListItem = { id: number; title: string; status: JobStatus; department?: string | null; location?: string | null; employmentType?: string | null; owner: { id: number; firstName: string; lastName: string }; pipeline: { id: number; name: string }; updatedAt: string; version: number; allowedActions: string[] };
export type JobDetailModel = JobListItem & { description: string; createdAt: string; publishedAt?: string | null; closedAt?: string | null; reopenedAt?: string | null };
export type JobListResponse = { data: JobListItem[]; total: number; page: number; limit: number; totalPages: number };
export type JobListParams = { q: string; status?: JobStatus; ownerId?: number; sort: 'createdAt' | 'updatedAt' | 'title' | 'status'; direction: 'asc' | 'desc'; page: number; limit: number };
