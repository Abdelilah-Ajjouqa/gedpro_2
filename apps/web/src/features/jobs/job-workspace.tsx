'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { getJob, jobKeys, transitionJob } from './api';
const statusLabels = {
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
  archived: 'Archived',
};
export function JobWorkspace() {
  const id = Number(useParams<{ jobId: string }>().jobId);
  const router = useRouter();
  const client = useQueryClient();
  const { user, hasCapability } = useAuth();
  const scope = getApiScope(user?.id);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: jobKeys.detail(scope, id),
    queryFn: ({ signal }) => getJob(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30_000,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: ({
      action,
      version,
    }: {
      action: 'publish' | 'close' | 'reopen' | 'archive';
      version: number;
    }) => transitionJob(id, version, action),
    onSuccess: (job, values) => {
      client.setQueryData(jobKeys.detail(scope, id), job);
      void client.invalidateQueries({ queryKey: jobKeys.lists(scope) });
      setNotice(
        `Job ${values.action === 'publish' ? 'published' : values.action === 'close' ? 'closed' : values.action === 'reopen' ? 'reopened' : 'archived'}.`,
      );
    },
  });
  if (!Number.isInteger(id) || id < 1)
    return (
      <PageShell>
        <AsyncState kind="not-found" title="Job not found" />
      </PageShell>
    );
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState label="Loading job" />
      </PageShell>
    );
  if (query.isError)
    return (
      <PageShell>
        <AsyncState
          kind="not-found"
          title="Job not found"
          description="The job does not exist or is outside your access."
        />
      </PageShell>
    );
  const job = query.data;
  const can = (action: string, capability: string) =>
    job.allowedActions.includes(action) && hasCapability(capability);
  const run = (action: 'publish' | 'close' | 'reopen' | 'archive') => {
    if (
      window.confirm(
        `${action[0].toUpperCase()}${action.slice(1)} “${job.title}”?`,
      )
    )
      mutation.mutate({ action, version: job.version });
  };
  return (
    <PageShell>
      <Breadcrumbs
        items={[{ label: 'Jobs', href: '/jobs' }, { label: job.title }]}
      />
      <PageHeader
        title={job.title}
        description={`${statusLabels[job.status]} · ${job.department || 'No department'}`}
        actions={
          <>
            {can('update', 'jobs:update') ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/jobs/${id}/edit`)}
              >
                Edit
              </Button>
            ) : null}
            {can('publish', 'jobs:publish') ? (
              <Button onClick={() => run('publish')}>Publish</Button>
            ) : null}
            {can('close', 'jobs:close') ? (
              <Button onClick={() => run('close')}>Close</Button>
            ) : null}
            {can('reopen', 'jobs:reopen') ? (
              <Button onClick={() => run('reopen')}>Reopen</Button>
            ) : null}
            {can('archive', 'jobs:archive') ? (
              <Button variant="outline" onClick={() => run('archive')}>
                Archive
              </Button>
            ) : null}
          </>
        }
      />
      {notice ? (
        <p role="status" className="mb-4 rounded-md border p-3 text-sm">
          {notice}
        </p>
      ) : null}
      {mutation.error ? (
        <p
          role="alert"
          className="mb-4 rounded-md border border-destructive p-3 text-sm"
        >
          {mutation.error instanceof ApiError && mutation.error.kind === 'stale'
            ? 'This job changed elsewhere. Refresh and review before trying again.'
            : mutation.error instanceof ApiError
              ? mutation.error.message
              : 'The action failed.'}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6">
            {job.description}
          </p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd>{job.location || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Employment type</dt>
              <dd>
                {job.employmentType?.replace('_', ' ') || 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Owner</dt>
              <dd>
                {job.owner.firstName} {job.owner.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd>
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(job.updatedAt))}
              </dd>
            </div>
          </dl>
        </section>
        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Hiring pipeline</h2>
          <p className="mt-3 font-medium">{job.pipeline.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Candidate and application activity will appear in later phases.
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
