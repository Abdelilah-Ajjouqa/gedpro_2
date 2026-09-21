'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { ApiError, getApiScope } from '@/lib/api-client';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { candidateKeys, createCandidate } from './api';
import { CandidateForm } from './candidate-form';
export function CandidateCreatePage() {
  const router = useRouter(),
    client = useQueryClient();
  const { user } = useAuth();
  const scope = getApiScope(user?.id);
  const mutation = useMutation({
    mutationFn: createCandidate,
    onSuccess: (c) => {
      client.setQueryData(candidateKeys.detail(scope, c.id), c);
      void client.invalidateQueries({ queryKey: candidateKeys.lists(scope) });
      router.push(`/candidates/${c.id}`);
    },
  });
  return (
    <PageShell className="max-w-4xl">
      <Breadcrumbs
        items={[{ label: 'Candidates', href: '/candidates' }, { label: 'New' }]}
      />
      <PageHeader
        title="Create candidate"
        description="Add a candidate profile. Applications are managed separately."
      />
      <CandidateForm
        submitLabel="Create candidate"
        pending={mutation.isPending}
        error={
          mutation.error instanceof ApiError
            ? mutation.error.kind === 'conflict'
              ? 'A candidate with that email or phone already exists. Your entries have been kept.'
              : mutation.error.message
            : undefined
        }
        onCancel={() => router.push('/candidates')}
        onSubmit={(v) => mutation.mutate(v)}
      />
    </PageShell>
  );
}
