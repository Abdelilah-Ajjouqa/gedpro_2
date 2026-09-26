export type ReportFilters = { from?: string; to?: string; jobId?: number; section?: string };
export type ReportBoundaries = { from: string; toExclusive: string };
export type ReportSummary = {
  boundaries: ReportBoundaries;
  funnel: Array<{ stageId: number; name: string; category: string; count: number; conversionFromFirstStage: number }>;
  timeInStage: Array<{ stageId: number; name: string; avgHours: number | null }>;
  totals: { applications: number; hired: number; avgHoursToFirstReview: number | null; avgDaysToHire: number | null };
  rejectionReasons: Array<{ reason: string; count: number }>;
  sources: Array<{ source: string; applications: number; hired: number }>;
  recruiters: Array<{ id: number; recruiter: string; applications: number }>;
  interviewers: Array<{ id: number; interviewer: string; interviews: number; pendingScorecards: number }>;
  jobs: Array<{ id: number; title: string; applications: number; hired: number }>;
};
export type ReportExportFormat = 'csv' | 'xlsx';
export type ReportExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
export type ReportExportListItem = { id: string; format: ReportExportFormat; status: ReportExportStatus; filters: ReportFilters; size: number | null; error: string | null; expiresAt: string; createdAt: string; completedAt: string | null; requester: string };
export type JobOption = { id: number; title: string };
