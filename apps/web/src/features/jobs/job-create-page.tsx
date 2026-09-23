'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { listPipelines, pipelineKeys } from '@/features/pipelines/api';
import { createJob, jobKeys } from './api';
const schema = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(160),
  description: z.string().trim().min(1, 'Enter a description'),
  department: z.string().trim().max(120),
  location: z.string().trim().max(160),
  employmentType: z.enum([
    'full_time',
    'part_time',
    'contract',
    'temporary',
    'internship',
    'other',
  ]),
  pipelineId: z.number().int().positive('Select a pipeline'),
});
type Values = z.infer<typeof schema>;
export function JobCreatePage() {
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const scope = getApiScope(user?.id);
  const pipelines = useQuery({
    queryKey: pipelineKeys.list(scope, { page: 1, limit: 100, search: '' }),
    queryFn: ({ signal }) =>
      listPipelines({ page: 1, limit: 100, search: '' }, signal),
    staleTime: 60_000,
    retry: false,
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      department: '',
      location: '',
      employmentType: 'full_time',
      pipelineId: 0,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      createJob({
        ...values,
        department: values.department || undefined,
        location: values.location || undefined,
      }),
    onSuccess: (job) => {
      client.setQueryData(jobKeys.detail(scope, job.id), job);
      void client.invalidateQueries({ queryKey: jobKeys.lists(scope) });
      router.push(`/jobs/${job.id}`);
    },
  });
  return (
    <PageShell className="max-w-3xl">
      <Breadcrumbs
        items={[{ label: 'Jobs', href: '/jobs' }, { label: 'New' }]}
      />
      <PageHeader
        title="Create job"
        description="Create a draft against an active hiring pipeline."
      />
      {pipelines.isPending ? (
        <LoadingState />
      ) : pipelines.isError ? (
        <AsyncState
          kind="error"
          title="Pipelines could not be loaded"
          description="A valid pipeline is required before this job can be created."
          action={{ label: 'Retry', onClick: () => void pipelines.refetch() }}
        />
      ) : pipelines.data.data.length === 0 ? (
        <AsyncState
          kind="empty"
          title="Create a pipeline first"
          description="Jobs need a pipeline before they can be drafted."
          action={{
            label: 'Go to pipelines',
            onClick: () => router.push('/settings/pipelines/new'),
          }}
        />
      ) : (
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          {(
            [
              ['title', 'Title'],
              ['department', 'Department'],
              ['location', 'Location'],
            ] as const
          ).map(([name, label]) => (
            <label className="grid gap-1 text-sm" key={name}>
              <span>{label}</span>
              <input
                className="h-9 rounded-md border bg-background px-3"
                {...form.register(name)}
                aria-invalid={!!form.formState.errors[name]}
              />
              {form.formState.errors[name] ? (
                <span className="text-destructive">
                  {form.formState.errors[name]?.message}
                </span>
              ) : null}
            </label>
          ))}
          <label className="grid gap-1 text-sm">
            <span>Description</span>
            <textarea
              className="min-h-32 rounded-md border bg-background p-3"
              {...form.register('description')}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Employment type</span>
            <select
              className="h-9 rounded-md border bg-background px-3"
              {...form.register('employmentType')}
            >
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="temporary">Temporary</option>
              <option value="internship">Internship</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span>Pipeline</span>
            <select
              className="h-9 rounded-md border bg-background px-3"
              {...form.register('pipelineId', { valueAsNumber: true })}
            >
              <option value="0">Select a pipeline</option>
              {pipelines.data.data.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </label>
          {mutation.error ? (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Job could not be created.'}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/jobs')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create draft'}
            </Button>
          </div>
        </form>
      )}
    </PageShell>
  );
}
