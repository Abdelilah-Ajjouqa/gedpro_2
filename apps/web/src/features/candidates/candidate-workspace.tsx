'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import {
  candidateKeys,
  eraseCandidate,
  exportCandidate,
  getCandidate,
  lifecycleCandidate,
  requestCandidateDeletion,
  updateCandidateState,
} from './api';
import { stateLabels, type CandidateState } from './types';
export function CandidateWorkspace() {
  const id = Number(useParams<{ candidateId: string }>().candidateId),
    router = useRouter(),
    client = useQueryClient();
  const { user, hasCapability } = useAuth();
  const scope = getApiScope(user?.id);
  const [notice, setNotice] = useState('');
  const query = useQuery({
    queryKey: candidateKeys.detail(scope, id),
    queryFn: ({ signal }) => getCandidate(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30_000,
    retry: false,
  });
  const refresh = (c: NonNullable<typeof query.data>, message: string) => {
    client.setQueryData(candidateKeys.detail(scope, id), c);
    void client.invalidateQueries({ queryKey: candidateKeys.lists(scope) });
    setNotice(message);
  };
  const lifecycle = useMutation({
    mutationFn: (a: 'archive' | 'restore') =>
      lifecycleCandidate(id, query.data!.version, a),
    onSuccess: (c, a) => refresh(c, `Candidate ${a}d.`),
  });
  const state = useMutation({
      mutationFn: (v: CandidateState) =>
        updateCandidateState(id, query.data!.version, v),
      onSuccess: (c) => refresh(c, 'Candidate state updated.'),
    }),
    deletion = useMutation({
      mutationFn: () => requestCandidateDeletion(id, query.data!.version),
      onSuccess: () => {
        void query.refetch();
        setNotice(
          'Deletion request recorded. This does not erase the candidate.',
        );
      },
    }),
    erasure = useMutation({
      mutationFn: () => eraseCandidate(id, query.data!.version),
      onSuccess: (c) => refresh(c, 'Candidate personal data erased.'),
    });
  if (!Number.isInteger(id) || id < 1)
    return (
      <PageShell>
        <AsyncState kind="not-found" title="Candidate not found" />
      </PageShell>
    );
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState label="Loading candidate" />
      </PageShell>
    );
  if (query.isError)
    return (
      <PageShell>
        <AsyncState
          kind="not-found"
          title="Candidate not found"
          description="The candidate does not exist or is outside your access."
        />
      </PageShell>
    );
  const c = query.data;
  const mutateError =
    lifecycle.error || state.error || deletion.error || erasure.error;
  const confirm = (message: string, run: () => void) => {
    if (window.confirm(message)) run();
  };
  const download = async () => {
    try {
      const blob = await exportCandidate(id);
      const url = URL.createObjectURL(blob),
        a = document.createElement('a');
      a.href = url;
      a.download = `candidate-${id}-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(
        'Privacy export downloaded. The file is now outside application control.',
      );
    } catch {
      setNotice('Privacy export could not be downloaded.');
    }
  };
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Candidates', href: '/candidates' },
          { label: `${c.firstName} ${c.lastName}` },
        ]}
      />
      {c.disposition !== 'active' ? (
        <div className="mb-4 rounded-lg border p-4" role="status">
          <strong className="capitalize">{c.disposition} candidate.</strong>{' '}
          {c.disposition === 'merged' && c.mergedInto ? (
            <span>
              {' '}
              This profile was merged into{' '}
              <Link
                className="underline"
                href={`/candidates/${c.mergedInto.id}`}
              >
                {c.mergedInto.displayName}
              </Link>
              .
            </span>
          ) : (
            <span> This profile is read-only.</span>
          )}
        </div>
      ) : null}
      <PageHeader
        title={`${c.firstName} ${c.lastName}`}
        description={`${stateLabels[c.state]} · ${c.disposition} · Updated ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(c.updatedAt))}`}
        actions={
          <>
            {c.disposition === 'active' &&
            hasCapability('candidates:update') ? (
              <Button
                variant="outline"
                onClick={() => router.push(`/candidates/${id}/edit`)}
              >
                Edit
              </Button>
            ) : null}
            {c.disposition === 'active' &&
            hasCapability('candidates:archive') ? (
              <Button
                variant="outline"
                onClick={() =>
                  confirm(
                    `Archive ${c.firstName} ${c.lastName}? Applications and history remain.`,
                    () => lifecycle.mutate('archive'),
                  )
                }
              >
                Archive
              </Button>
            ) : null}
            {c.disposition === 'archived' &&
            hasCapability('candidates:restore') ? (
              <Button onClick={() => lifecycle.mutate('restore')}>
                Restore
              </Button>
            ) : null}
          </>
        }
      />
      {notice ? (
        <p className="mb-4 rounded-md border p-3 text-sm" role="status">
          {notice}
        </p>
      ) : null}
      {mutateError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {mutateError instanceof ApiError && mutateError.kind === 'stale'
            ? 'This candidate changed elsewhere. Refresh and review before trying again.'
            : mutateError instanceof Error
              ? mutateError.message
              : 'The action failed.'}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">
              Contact and classification
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>
                  {c.email ? (
                    <a className="underline" href={`mailto:${c.email}`}>
                      {c.email}
                    </a>
                  ) : (
                    'Not available'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{c.phone || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Skills</dt>
                <dd>{c.skills.join(', ') || 'None'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tags</dt>
                <dd>{c.tags.join(', ') || 'None'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd>{c.source || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Owner</dt>
                <dd>
                  {c.owner
                    ? `${c.owner.firstName} ${c.owner.lastName}`
                    : 'Unassigned'}
                </dd>
              </div>
            </dl>
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Applications</h2>
            <p className="mt-3 text-sm">
              {c.applicationCount} application
              {c.applicationCount === 1 ? '' : 's'}. Application workflow is
              managed separately.
            </p>
          </section>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-lg font-semibold">Documents and activity</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Document operations and the complete activity feed will be
              available in later phases.
            </p>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold">Candidate state</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Changing candidate state does not change application stages.
            </p>
            {c.disposition === 'active' && hasCapability('candidates:state') ? (
              <select
                className="mt-3 h-10 w-full rounded-md border bg-background px-3"
                value={c.state}
                onChange={(e) => state.mutate(e.target.value as CandidateState)}
                disabled={state.isPending}
              >
                {Object.entries(stateLabels).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-3">{stateLabels[c.state]}</p>
            )}
          </section>
          {c.privacy ? (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">Privacy and retention</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Consent</dt>
                  <dd>{c.privacy.consent ? 'Recorded' : 'Not recorded'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Deletion request</dt>
                  <dd>
                    {c.privacy.deletionRequestedAt
                      ? 'Requested'
                      : 'Not requested'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Retention</dt>
                  <dd>
                    {c.privacy.retentionUntil
                      ? new Intl.DateTimeFormat().format(
                          new Date(c.privacy.retentionUntil),
                        )
                      : 'No active date'}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                {hasCapability('candidates:privacy:export') &&
                c.disposition !== 'erased' ? (
                  <Button variant="outline" onClick={() => void download()}>
                    Download export
                  </Button>
                ) : null}
                {hasCapability('candidates:privacy:request-deletion') &&
                !c.privacy.deletionRequestedAt &&
                c.disposition !== 'erased' ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      confirm(
                        'Record a deletion request? This does not erase data.',
                        () => deletion.mutate(),
                      )
                    }
                  >
                    Request deletion
                  </Button>
                ) : null}
                {hasCapability('candidates:privacy:erase') &&
                c.disposition !== 'erased' ? (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive"
                    disabled={c.privacy.erasureBlocked}
                    onClick={() =>
                      confirm(
                        `Permanently anonymize ${c.firstName} ${c.lastName}? Recruitment history will remain.`,
                        () => erasure.mutate(),
                      )
                    }
                  >
                    Erase personal data
                  </Button>
                ) : null}
              </div>
              {c.privacy.erasureBlocked ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Erasure is blocked by the active retention period.
                </p>
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
