'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import {
  applicationKeys,
  getApplication,
  reopenApplication,
  transitionApplication,
} from './api';
import { TimelinePanel } from '@/features/timeline/timeline-panel';
import { timelineKeys } from '@/features/timeline/api';
export function ApplicationWorkspace({ id }: { id: number }) {
  const { user } = useAuth();
  const scope = getApiScope(user?.id);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: applicationKeys.detail(scope, id),
    queryFn: ({ signal }) => getApplication(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 20_000,
    retry: false,
  });
  const [stageId, setStageId] = useState('');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const reconcile = async (
    value: Awaited<ReturnType<typeof getApplication>>,
  ) => {
    client.setQueryData(applicationKeys.detail(scope, id), value);
    await client.invalidateQueries({ queryKey: applicationKeys.all(scope) });
    await client.invalidateQueries({
      queryKey: timelineKeys.application(scope, id),
    });
    await client.invalidateQueries({
      queryKey: timelineKeys.candidate(scope, value.candidate.id),
    });
  };
  const move = useMutation({
    mutationFn: () =>
      transitionApplication(id, query.data!.version, {
        stageId: Number(stageId),
        comment: comment || undefined,
        rejectionReason: reason || undefined,
      }),
    onSuccess: async (v) => {
      await reconcile(v);
      setStageId('');
      setComment('');
      setReason('');
      setFeedback('Application moved.');
    },
    onError: (e) => {
      setFeedback(
        e instanceof ApiError && e.kind === 'stale'
          ? 'This application changed. The latest version is being loaded; review it before retrying.'
          : e instanceof Error
            ? e.message
            : 'The application could not be moved.',
      );
      void query.refetch();
    },
  });
  const reopen = useMutation({
    mutationFn: () =>
      reopenApplication(id, query.data!.version, comment || undefined),
    onSuccess: async (v) => {
      await reconcile(v);
      setComment('');
      setFeedback('Application reopened.');
    },
    onError: (e) => {
      setFeedback(
        e instanceof Error
          ? e.message
          : 'The application could not be reopened.',
      );
      void query.refetch();
    },
  });
  if (!Number.isInteger(id) || id <= 0)
    return (
      <PageShell>
        <AsyncState kind="not-found" title="Application not found" />
      </PageShell>
    );
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState label="Loading application" />
      </PageShell>
    );
  if (query.isError)
    return (
      <PageShell>
        <AsyncState
          kind="not-found"
          title="Application not found"
          description="It may not exist or may be outside your scope."
        />
      </PageShell>
    );
  const a = query.data;
  const selected = a.allowedTransitions.find(
    (x) => x.stage.id === Number(stageId),
  );
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Applications', href: '/applications' },
          { label: `${a.candidate.firstName} ${a.candidate.lastName}` },
        ]}
      />
      <PageHeader
        title={`${a.candidate.firstName} ${a.candidate.lastName}`}
        description={`${a.job.title} · ${a.currentStage.name}`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Application context</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Candidate</dt>
              <dd>
                <Link
                  className="hover:underline"
                  href={`/candidates/${a.candidate.id}`}
                >
                  {a.candidate.firstName} {a.candidate.lastName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Job</dt>
              <dd>
                <Link className="hover:underline" href={`/jobs/${a.job.id}`}>
                  {a.job.title}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Stage</dt>
              <dd>
                {a.currentStage.name}
                {a.terminal ? ' (terminal)' : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Owner</dt>
              <dd>
                {a.owner
                  ? `${a.owner.firstName} ${a.owner.lastName}`
                  : 'Unassigned'}
              </dd>
            </div>
          </dl>
        </section>
        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Actions</h2>
          {a.allowedTransitions.length ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                move.mutate();
              }}
            >
              <label className="grid gap-1 text-sm">
                <span>Next stage</span>
                <select
                  required
                  className="h-10 rounded-md border bg-background px-3"
                  value={stageId}
                  onChange={(e) => {
                    setStageId(e.target.value);
                    setReason('');
                  }}
                >
                  <option value="">Choose a stage</option>
                  {a.allowedTransitions.map((t) => (
                    <option key={t.stage.id} value={t.stage.id}>
                      {t.stage.name}
                    </option>
                  ))}
                </select>
              </label>
              {selected?.requiresRejectionReason ? (
                <label className="grid gap-1 text-sm">
                  <span>Rejection reason</span>
                  <textarea
                    required
                    maxLength={500}
                    className="rounded-md border bg-background p-3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              ) : null}
              <label className="grid gap-1 text-sm">
                <span>Comment (optional)</span>
                <textarea
                  maxLength={1000}
                  className="rounded-md border bg-background p-3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <Button disabled={move.isPending}>Move application</Button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No regular transitions are available.
            </p>
          )}
          {a.allowedActions.includes('reopen') ? (
            <Button
              className="mt-4"
              variant="outline"
              disabled={reopen.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    'Reopen this application? Historical outcome evidence will remain.',
                  )
                )
                  reopen.mutate();
              }}
            >
              Reopen application
            </Button>
          ) : null}
          <p className="mt-3 text-sm" role="status" aria-live="polite">
            {feedback}
          </p>
          <div className="mt-5 grid gap-2 border-t pt-5">
            <Link className="text-sm font-medium hover:underline" href={`/interviews?applicationId=${a.id}`}>View interviews</Link>
            <Link className="text-sm font-medium hover:underline" href={`/interviews/new?applicationId=${a.id}&candidateId=${a.candidate.id}`}>Schedule interview</Link>
            <Link className="text-sm font-medium hover:underline" href={`/applications/${a.id}/decision`}>Decision summary</Link>
          </div>
        </aside>
      </div>
      <div className="mt-6">
        <TimelinePanel
          target="application"
          id={id}
          candidateId={a.candidate.id}
        />
      </div>
    </PageShell>
  );
}
