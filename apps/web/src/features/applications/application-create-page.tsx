'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, apiRequest, getApiScope } from '@/lib/api-client';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import type { CandidateListResponse } from '@/features/candidates/types';
import type { JobListResponse } from '@/features/jobs/types';
import { applicationKeys, createApplication } from './api';
export function ApplicationCreatePage() {
  const search = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const scope = getApiScope(user?.id);
  const initialCandidate = Number(search.get('candidateId')) || 0;
  const initialJob = Number(search.get('jobId')) || 0;
  const [candidateId, setCandidateId] = useState(initialCandidate);
  const [jobId, setJobId] = useState(initialJob);
  const [source, setSource] = useState('');
  const [duplicateId, setDuplicateId] = useState<number>();
  const [error, setError] = useState('');
  const candidates = useQuery({
    queryKey: ['application-lookups', scope, 'candidates'],
    queryFn: ({ signal }) =>
      apiRequest<CandidateListResponse>(
        '/candidates?page=1&limit=100&disposition=active&sortBy=lastName&sortOrder=ASC',
        { signal },
      ),
    staleTime: 60_000,
  });
  const jobs = useQuery({
    queryKey: ['application-lookups', scope, 'jobs'],
    queryFn: ({ signal }) =>
      apiRequest<JobListResponse>(
        '/jobs?page=1&limit=100&status=published&sort=title&direction=asc',
        { signal },
      ),
    staleTime: 60_000,
  });
  const mutation = useMutation({
    mutationFn: () =>
      createApplication({
        candidateId,
        jobId,
        source: source.trim() || undefined,
      }),
    onSuccess: async (value) => {
      client.setQueryData(applicationKeys.detail(scope, value.id), value);
      await client.invalidateQueries({ queryKey: applicationKeys.all(scope) });
      router.push(`/applications/${value.id}`);
    },
    onError: (e) => {
      const api = e instanceof ApiError ? e : undefined;
      const existing =
        api?.payload && 'applicationId' in api.payload
          ? Number((api.payload as Record<string, unknown>).applicationId)
          : undefined;
      setDuplicateId(
        api?.payload?.code === 'DUPLICATE_APPLICATION' && existing
          ? existing
          : undefined,
      );
      setError(
        e instanceof Error ? e.message : 'Application could not be opened.',
      );
    },
  });
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Applications', href: '/applications' },
          { label: 'Open application' },
        ]}
      />
      <PageHeader
        title="Open application"
        description="Connect an eligible candidate to a published job. The server chooses the initial stage."
      />
      <form
        className="max-w-2xl space-y-5 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          setDuplicateId(undefined);
          mutation.mutate();
        }}
      >
        <label className="grid gap-1 text-sm">
          <span>Candidate</span>
          <select
            required
            className="h-10 rounded-md border bg-background px-3"
            value={candidateId || ''}
            onChange={(e) => setCandidateId(Number(e.target.value))}
          >
            <option value="">Choose a candidate</option>
            {candidates.data?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} · {c.email}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted-foreground">
          Need a new profile?{' '}
          <Link
            className="underline"
            href={`/candidates/new?returnTo=${encodeURIComponent(`/applications/new${jobId ? `?jobId=${jobId}` : ''}`)}`}
          >
            Create a candidate
          </Link>
          , then return here to submit the application.
        </p>
        <label className="grid gap-1 text-sm">
          <span>Published job</span>
          <select
            required
            className="h-10 rounded-md border bg-background px-3"
            value={jobId || ''}
            onChange={(e) => setJobId(Number(e.target.value))}
          >
            <option value="">Choose a job</option>
            {jobs.data?.data.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Source (optional)</span>
          <input
            className="h-10 rounded-md border bg-background px-3"
            maxLength={120}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        {error ? (
          <div
            className="rounded-md border border-destructive/40 p-3 text-sm"
            role="alert"
          >
            <p>{error}</p>
            {duplicateId ? (
              <Link
                className="mt-2 inline-block underline"
                href={`/applications/${duplicateId}`}
              >
                Open existing application
              </Link>
            ) : null}
          </div>
        ) : null}
        <Button
          disabled={
            mutation.isPending || candidates.isPending || jobs.isPending
          }
        >
          Open application
        </Button>
      </form>
    </PageShell>
  );
}
