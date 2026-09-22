'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { ArrowRight, FileText, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ApiError, getApiScope } from '@/lib/api-client';
import { createNote, getTimeline, timelineKeys } from './api';
import type { TimelineEvent } from './types';

const schema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Enter a note.')
    .max(2000, 'Notes can contain at most 2,000 characters.'),
});
type FormValues = z.infer<typeof schema>;

const labels: Record<string, string> = {
  'candidate.created': 'Candidate profile created',
  'candidate.profile_updated': 'Candidate profile updated',
  'candidate.archived': 'Candidate archived',
  'candidate.restored': 'Candidate restored',
  'candidate.merged': 'Candidate merged',
  'candidate.state_changed': 'Candidate state changed',
  'candidate.deletion_requested': 'Candidate deletion requested',
  'candidate.personal_data_erased': 'Candidate personal data erased',
  'candidate.privacy_exported': 'Candidate privacy export created',
  'application.created': 'Application opened',
  'application.stage_changed': 'Application stage changed',
  'application.reopened': 'Application reopened',
  'interview.scheduled': 'Interview scheduled',
  'scorecard.submitted': 'Scorecard submitted',
  'document.uploaded': 'Document added',
  'form.response_submitted': 'Form response submitted',
  'communication.queued': 'Communication queued',
  'note.created': 'Note added',
};
function summary(event: TimelineEvent) {
  if (event.type === 'note.created')
    return event.payload.text || 'Note content unavailable';
  if (event.type === 'application.created')
    return [event.payload.jobTitle, event.payload.newStageName]
      .filter(Boolean)
      .join(' · ');
  if (event.type === 'application.stage_changed')
    return `${event.payload.previousStageName ?? 'Previous stage'} → ${event.payload.newStageName ?? 'New stage'}`;
  if (event.type === 'application.reopened')
    return `Reopened to ${event.payload.newStageName ?? 'the initial stage'}`;
  return event.payload.summary || labels[event.type] || 'Activity recorded';
}
function sourceLink(event: TimelineEvent) {
  if (event.targetType === 'application')
    return {
      href: `/applications/${event.targetId}`,
      label: 'View application',
    };
  if (event.targetType === 'candidate')
    return { href: `/candidates/${event.targetId}`, label: 'View candidate' };
  return null;
}
function EventItem({ event }: { event: TimelineEvent }) {
  const link = sourceLink(event),
    date = new Date(event.occurredAt);
  return (
    <li className="relative border-l-2 border-border pb-6 pl-6 last:pb-0">
      <span
        className="absolute -left-3 top-0 flex size-6 items-center justify-center rounded-full border bg-background"
        aria-hidden="true"
      >
        {event.category === 'note' ? (
          <MessageSquareText className="size-3" />
        ) : (
          <FileText className="size-3" />
        )}
      </span>
      <h3 className="font-medium">
        {labels[event.type] || 'Activity recorded'}
      </h3>
      <p
        className={`mt-1 whitespace-pre-wrap break-words text-sm ${event.category === 'note' ? '' : 'text-muted-foreground'}`}
      >
        {summary(event)}
      </p>
      {event.payload.comment ? (
        <p className="mt-1 whitespace-pre-wrap text-sm">
          {event.payload.comment}
        </p>
      ) : null}
      {event.payload.rejectionReason ? (
        <p className="mt-1 text-sm">Reason: {event.payload.rejectionReason}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        <time dateTime={event.occurredAt}>
          {Number.isNaN(date.valueOf())
            ? 'Time unavailable'
            : new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'long',
              }).format(date)}
        </time>{' '}
        ·{' '}
        {event.actor.name ||
          (event.actor.kind === 'system'
            ? 'System'
            : 'Former or unavailable user')}{' '}
        ·{' '}
        {event.visibility === 'internal' ? 'Internal' : 'Visible to candidate'}
      </p>
      {link ? (
        <Link
          className="mt-2 inline-flex items-center gap-1 text-sm underline"
          href={link.href}
        >
          {link.label}
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      ) : null}
    </li>
  );
}
export function TimelinePanel({
  target,
  id,
  candidateId,
  readOnly = false,
}: {
  target: 'candidate' | 'application';
  id: number;
  candidateId?: number;
  readOnly?: boolean;
}) {
  const { user, hasCapability } = useAuth(),
    scope = getApiScope(user?.id),
    client = useQueryClient();
  const key =
    target === 'candidate'
      ? timelineKeys.candidate(scope, id)
      : timelineKeys.application(scope, id);
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      getTimeline(target, id, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 20_000,
    retry: false,
  });
  const events = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
      (event) => !seen.has(event.id) && !!seen.add(event.id),
    );
  }, [query.data]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { text: '' },
  });
  const noteText = useWatch({ control: form.control, name: 'text' });
  const capability =
    target === 'candidate'
      ? 'timeline:candidate:note:create'
      : 'timeline:application:note:create';
  const mutation = useMutation({
    mutationFn: ({ text }: FormValues) => createNote(target, id, text),
    retry: false,
    onSuccess: async () => {
      form.reset();
      await client.invalidateQueries({ queryKey: key });
      if (target === 'application' && candidateId)
        await client.invalidateQueries({
          queryKey: timelineKeys.candidate(scope, candidateId),
        });
      form.setFocus('text');
    },
  });
  return (
    <section
      id="activity"
      className="scroll-mt-6 rounded-xl border bg-card p-5"
      aria-labelledby={`${target}-activity-heading`}
    >
      <h2 id={`${target}-activity-heading`} className="text-lg font-semibold">
        Activity
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Newest first. Times use your current timezone.
      </p>
      {!readOnly && hasCapability(capability) ? (
        <form
          className="mt-5 grid gap-2 border-b pb-5"
          onSubmit={form.handleSubmit((value) => mutation.mutate(value))}
        >
          <label
            htmlFor={`${target}-timeline-note`}
            className="text-sm font-medium"
          >
            Add internal note
          </label>
          <textarea
            id={`${target}-timeline-note`}
            className="min-h-24 rounded-md border bg-background p-3"
            maxLength={2000}
            aria-invalid={!!form.formState.errors.text}
            {...form.register('text')}
          />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Only authorized staff can see this note.</span>
            <span>{noteText.length}/2000</span>
          </div>
          {form.formState.errors.text ? (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.text.message}
            </p>
          ) : null}
          {mutation.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {mutation.error instanceof ApiError &&
              mutation.error.kind === 'forbidden'
                ? 'You no longer have permission to add notes.'
                : mutation.error instanceof Error
                  ? mutation.error.message
                  : 'The note could not be added.'}
            </p>
          ) : null}
          <Button className="justify-self-start" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add note'}
          </Button>
        </form>
      ) : null}
      {query.isPending ? (
        <p className="mt-5 text-sm text-muted-foreground" role="status">
          Loading activity…
        </p>
      ) : query.isError ? (
        <div className="mt-5">
          <p className="text-sm text-destructive" role="alert">
            Activity could not be loaded.
          </p>
          <Button
            className="mt-2"
            variant="outline"
            onClick={() => void query.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : events.length ? (
        <ol className="mt-6">
          {events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </ol>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          No activity has been recorded yet.
        </p>
      )}
      {query.hasNextPage ? (
        <Button
          id={`${target}-timeline-load-more`}
          className="mt-5"
          variant="outline"
          disabled={query.isFetchingNextPage}
          onClick={async () => {
            await query.fetchNextPage();
            requestAnimationFrame(() =>
              document.getElementById(`${target}-timeline-load-more`)?.focus(),
            );
          }}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load older activity'}
        </Button>
      ) : events.length ? (
        <p className="mt-5 text-sm text-muted-foreground">
          You’ve reached the beginning of the activity.
        </p>
      ) : null}
      {query.isFetchNextPageError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          Older activity could not be loaded. Try again.
        </p>
      ) : null}
    </section>
  );
}
