'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { getPipeline, pipelineKeys } from './api';
export function PipelineWorkspace() {
  const raw = useParams<{ pipelineId: string }>().pipelineId;
  const id = Number(raw);
  const { user } = useAuth();
  const query = useQuery({
    queryKey: pipelineKeys.detail(getApiScope(user?.id), id),
    queryFn: ({ signal }) => getPipeline(id, signal),
    enabled: Number.isInteger(id) && id > 0,
    staleTime: 30_000,
    retry: false,
  });
  if (!Number.isInteger(id) || id < 1)
    return (
      <PageShell>
        <AsyncState kind="not-found" title="Pipeline not found" />
      </PageShell>
    );
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState label="Loading pipeline" />
      </PageShell>
    );
  if (query.isError)
    return (
      <PageShell>
        <AsyncState
          kind="not-found"
          title="Pipeline not found"
          description="It may have been archived or you may not have access."
        />
      </PageShell>
    );
  const pipeline = query.data;
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Settings' },
          { label: 'Pipelines', href: '/settings/pipelines' },
          { label: pipeline.name },
        ]}
      />
      <PageHeader
        title={pipeline.name}
        description={pipeline.description || 'No description'}
      />
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Ordered stages</h2>
          <ol className="mt-4 space-y-3">
            {pipeline.stages
              .filter((stage) => !stage.archived)
              .sort((a, b) => a.position - b.position)
              .map((stage, index) => (
                <li
                  key={stage.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="mr-3 text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <span className="rounded-full border px-2 py-1 text-xs">
                    {stage.category}
                  </span>
                </li>
              ))}
          </ol>
        </section>
        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Publication readiness</h2>
          {pipeline.readiness ? (
            pipeline.readiness.ready ? (
              <p className="mt-3 text-sm">Ready to use for publication.</p>
            ) : (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {pipeline.readiness.issues.map((issue) => (
                  <li key={issue.code}>{issue.message}</li>
                ))}
              </ul>
            )
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Readiness is checked when publishing.
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Jobs</dt>
            <dd>{pipeline.jobCount ?? 0}</dd>
            <dt className="text-muted-foreground">Editable</dt>
            <dd>{pipeline.inUse ? 'Locked by use' : 'Yes'}</dd>
          </dl>
        </aside>
      </div>
    </PageShell>
  );
}
