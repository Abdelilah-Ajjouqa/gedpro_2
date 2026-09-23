'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import {
  getInterview,
  interviewKeys,
  outcomeInterview,
  rescheduleInterview,
} from './api';
import { formatInterviewTime } from './url-state';
export function InterviewWorkspace({ id }: { id: number }) {
  const { user } = useAuth(),
    scope = getApiScope(user?.id),
    client = useQueryClient();
  const q = useQuery({
    queryKey: interviewKeys.detail(scope, id),
    queryFn: ({ signal }) => getInterview(id, signal),
    enabled: id > 0,
    staleTime: 15_000,
    retry: false,
  });
  const [date, setDate] = useState(''),
    [reason, setReason] = useState(''),
    [message, setMessage] = useState('');
  const settle = async (v: Awaited<ReturnType<typeof getInterview>>) => {
    client.setQueryData(interviewKeys.detail(scope, id), v);
    await client.invalidateQueries({ queryKey: interviewKeys.lists(scope) });
    setMessage(
      'Interview updated. Schedule state is saved; communications are queued separately.',
    );
  };
  const reschedule = useMutation({
    mutationFn: () =>
      rescheduleInterview(id, q.data!.version, {
        date: new Date(date).toISOString(),
        timezone: q.data!.timezone,
      }),
    onSuccess: settle,
    onError: (e) => {
      setMessage(e instanceof Error ? e.message : 'Could not reschedule.');
      void q.refetch();
    },
  });
  const outcome = useMutation({
    mutationFn: (status: string) =>
      outcomeInterview(id, q.data!.version, status, reason || undefined),
    onSuccess: settle,
    onError: (e) => {
      setMessage(e instanceof Error ? e.message : 'Could not update outcome.');
      void q.refetch();
    },
  });
  if (q.isPending)
    return (
      <PageShell>
        <LoadingState label="Loading interview" />
      </PageShell>
    );
  if (q.isError || !q.data)
    return (
      <PageShell>
        <AsyncState
          kind="not-found"
          title="Interview not found"
          description="It may not exist or may be outside your scope."
        />
      </PageShell>
    );
  const i = q.data;
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Interviews', href: '/interviews' },
          { label: i.title || `${i.type} interview` },
        ]}
      />
      <PageHeader
        title={i.title || `${i.type} interview`}
        description={`${i.candidate.firstName} ${i.candidate.lastName} · ${i.status}`}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="space-y-6">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Schedule</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="When">
                <time dateTime={i.date}>
                  {formatInterviewTime(i.date, i.timezone)}
                </time>{' '}
                ({i.timezone})
              </Info>
              <Info label="Duration">{i.duration} minutes</Info>
              <Info label="Candidate">
                <Link
                  className="hover:underline"
                  href={`/candidates/${i.candidate.id}`}
                >
                  {i.candidate.firstName} {i.candidate.lastName}
                </Link>
              </Info>
              <Info label="Job">
                {i.job ? (
                  <Link className="hover:underline" href={`/jobs/${i.job.id}`}>
                    {i.job.title}
                  </Link>
                ) : (
                  '—'
                )}
              </Info>
              <Info label="Lead interviewer">
                {i.leadInterviewer.firstName} {i.leadInterviewer.lastName}
              </Info>
              <Info label="Location">{i.location || 'Not specified'}</Info>
              <Info label="Calendar sync">
                {i.syncStatus === 'failed'
                  ? 'Interview saved; calendar sync failed.'
                  : i.syncStatus.replace('_', ' ')}
              </Info>
              <Info label="Feedback deadline">
                {i.feedbackDeadline
                  ? formatInterviewTime(i.feedbackDeadline, i.timezone)
                  : 'No deadline'}
              </Info>
            </dl>
            {i.outcomeReason ? (
              <p className="mt-4 text-sm">
                <strong>Outcome reason:</strong> {i.outcomeReason}
              </p>
            ) : null}
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Scorecards</h2>
            <ul className="mt-3 divide-y">
              {i.scorecards.length ? (
                i.scorecards.map((s) => (
                  <li
                    className="flex items-center justify-between gap-3 py-3"
                    key={s.id}
                  >
                    <div>
                      <p className="font-medium">{s.template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.reviewer.firstName} {s.reviewer.lastName} · {s.state}
                      </p>
                    </div>
                    {s.allowedActions.includes('submit') || s.submittedAt ? (
                      <Link
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                        })}
                        href={`/interviews/${id}/scorecards/${s.id}`}
                      >
                        {s.submittedAt ? 'View receipt' : 'Give feedback'}
                      </Link>
                    ) : null}
                  </li>
                ))
              ) : (
                <li className="py-6 text-sm text-muted-foreground">
                  No structured feedback was assigned.
                </li>
              )}
            </ul>
          </section>
        </main>
        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Actions</h2>
          {i.allowedActions.includes('reschedule') ? (
            <form
              className="mt-4 grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                reschedule.mutate();
              }}
            >
              <label className="grid gap-1 text-sm">
                <span>New start</span>
                <input
                  required
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 rounded-md border bg-background px-2"
                />
              </label>
              <Button disabled={reschedule.isPending}>Reschedule</Button>
            </form>
          ) : null}
          {i.allowedActions.includes('recordOutcome') ? (
            <div className="mt-5 grid gap-2">
              <label className="grid gap-1 text-sm">
                <span>Outcome reason (optional)</span>
                <textarea
                  maxLength={1000}
                  className="rounded-md border bg-background p-2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => outcome.mutate('COMPLETED')}>
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => outcome.mutate('NO_SHOW')}
                >
                  No-show
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.confirm('Cancel this interview?') &&
                    outcome.mutate('CANCELLED')
                  }
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
          {i.application && i.allowedActions.includes('viewDecisionSummary') ? (
            <Link
              className={`${buttonVariants({ variant: 'outline' })} mt-5 w-full`}
              href={`/applications/${i.application.id}/decision`}
            >
              Decision summary
            </Link>
          ) : null}
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        </aside>
      </div>
    </PageShell>
  );
}
function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
