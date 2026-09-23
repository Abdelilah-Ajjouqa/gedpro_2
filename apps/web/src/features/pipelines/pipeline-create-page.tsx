'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { createPipeline, pipelineKeys, type StageCategory } from './api';
const categories = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
] as const;
const schema = z.object({
  name: z.string().trim().min(1, 'Enter a pipeline name').max(160),
  description: z.string().trim(),
  stages: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Enter a stage name').max(100),
        category: z.enum(categories),
      }),
    )
    .min(1),
});
type Values = z.infer<typeof schema>;
export function PipelineCreatePage() {
  const router = useRouter();
  const client = useQueryClient();
  const { user } = useAuth();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      stages: [
        { name: 'Applied', category: 'applied' },
        { name: 'Hired', category: 'hired' },
      ],
    },
  });
  const stages = useFieldArray({ control: form.control, name: 'stages' });
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      createPipeline({
        name: values.name,
        description: values.description || undefined,
        isTemplate: true,
        stages: values.stages.map((stage, index) => ({
          ...stage,
          category: stage.category as StageCategory,
          position: index + 1,
        })),
      }),
    onSuccess: (pipeline) => {
      void client.invalidateQueries({
        queryKey: pipelineKeys.lists(getApiScope(user?.id)),
      });
      router.push(`/settings/pipelines/${pipeline.id}`);
    },
  });
  return (
    <PageShell className="max-w-3xl">
      <Breadcrumbs
        items={[
          { label: 'Settings' },
          { label: 'Pipelines', href: '/settings/pipelines' },
          { label: 'New' },
        ]}
      />
      <PageHeader
        title="Create pipeline"
        description="Start with ordered stages. Configure transitions in the workspace after creation."
      />
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <div className="grid gap-4 rounded-xl border bg-card p-5">
          <label className="grid gap-1 text-sm">
            <span>Name</span>
            <input
              className="h-9 rounded-md border bg-background px-3"
              {...form.register('name')}
              aria-invalid={!!form.formState.errors.name}
            />
            {form.formState.errors.name ? (
              <span className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>
          <label className="grid gap-1 text-sm">
            <span>Description</span>
            <textarea
              className="min-h-24 rounded-md border bg-background p-3"
              {...form.register('description')}
            />
          </label>
        </div>
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Initial stages</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => stages.append({ name: '', category: 'screening' })}
            >
              Add stage
            </Button>
          </div>
          <div className="space-y-3">
            {stages.fields.map((field, index) => (
              <div
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_12rem_auto]"
                key={field.id}
              >
                <label className="grid gap-1 text-sm">
                  <span>Stage {index + 1} name</span>
                  <input
                    className="h-9 rounded-md border bg-background px-3"
                    {...form.register(`stages.${index}.name`)}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Category</span>
                  <select
                    className="h-9 rounded-md border bg-background px-3"
                    {...form.register(`stages.${index}.category`)}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  className="self-end"
                  type="button"
                  variant="ghost"
                  disabled={stages.fields.length === 1}
                  onClick={() => stages.remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
        {mutation.error ? (
          <p
            role="alert"
            className="rounded-md border border-destructive p-3 text-sm"
          >
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : 'Pipeline could not be created.'}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/settings/pipelines')}
          >
            Cancel
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            {mutation.isPending ? 'Creating…' : 'Create pipeline'}
          </Button>
        </div>
      </form>
    </PageShell>
  );
}
