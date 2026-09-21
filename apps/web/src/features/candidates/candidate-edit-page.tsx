'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { ApiError, getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { candidateKeys, getCandidate, updateCandidate } from './api';
import { CandidateForm } from './candidate-form';
import type { CandidateFormValues } from './types';
export function CandidateEditPage() {
  const id = Number(useParams<{ candidateId: string }>().candidateId),
    router = useRouter(),
    client = useQueryClient();
  const { user } = useAuth(),
    scope = getApiScope(user?.id);
  const query = useQuery({
    queryKey: candidateKeys.detail(scope, id),
    queryFn: ({ signal }) => getCandidate(id, signal),
    enabled: id > 0,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (v: CandidateFormValues) =>
      updateCandidate(id, query.data!.version, v),
    onSuccess: (c) => {
      client.setQueryData(candidateKeys.detail(scope, id), c);
      void client.invalidateQueries({ queryKey: candidateKeys.lists(scope) });
      router.push(`/candidates/${id}`);
    },
  });
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  if (query.isError || query.data.disposition !== 'active')
    return (
      <PageShell>
        <AsyncState
          kind="not-found"
          title="Candidate cannot be edited"
          description="This candidate is unavailable or read-only."
        />
      </PageShell>
    );
  const c = query.data;
  return (
    <PageShell className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: 'Candidates', href: '/candidates' },
          { label: `${c.firstName} ${c.lastName}`, href: `/candidates/${id}` },
          { label: 'Edit' },
        ]}
      />
      <PageHeader
        title="Edit candidate"
        description={`Version ${c.version} · Changes use conflict protection.`}
      />
      <CandidateForm
        initial={{
          ...c,
          phone: c.phone ?? undefined,
          source: c.source ?? undefined,
          privacyConsent: c.privacy?.consent,
          retentionUntil: c.privacy?.retentionUntil ?? undefined,
        }}
        pending={mutation.isPending}
        error={
          mutation.error instanceof ApiError
            ? mutation.error.kind === 'stale'
              ? 'This candidate changed elsewhere. Your edits are preserved; refresh and review before resubmitting.'
              : mutation.error.message
            : undefined
        }
        onCancel={() => router.push(`/candidates/${id}`)}
        onSubmit={(v) => mutation.mutate(v)}
      />
    </PageShell>
  );
}
