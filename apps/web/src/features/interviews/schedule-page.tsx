'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createInterview, listTemplates } from './api';
import { PageHeader, PageShell } from '@/shared/components/page';
import { ApiError } from '@/lib/api-client';
export function InterviewSchedulePage() {
  const router = useRouter(),
    search = useSearchParams();
  const [applicationId, setApplicationId] = useState(
    search.get('applicationId') ?? '',
  );
  const [candidateId, setCandidateId] = useState(
    search.get('candidateId') ?? '',
  );
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState('HR');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [reviewers, setReviewers] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [blind, setBlind] = useState(false);
  const [error, setError] = useState('');
  const templates = useQuery({
    queryKey: ['scorecard-templates', 'schedule'],
    queryFn: ({ signal }) => listTemplates(signal),
    staleTime: 60_000,
  });
  const mutation = useMutation({
    mutationFn: () =>
      createInterview({
        applicationId: Number(applicationId),
        candidateId: Number(candidateId),
        date: new Date(date).toISOString(),
        duration,
        type,
        title: title || undefined,
        location: location || undefined,
        interviewerIds: reviewers
          .split(',')
          .map((x) => Number(x.trim()))
          .filter(Boolean),
        scorecardTemplateId: templateId ? Number(templateId) : undefined,
        feedbackDeadline: deadline
          ? new Date(deadline).toISOString()
          : undefined,
        hideFeedbackUntilComplete: blind,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    onSuccess: (v) => router.push(`/interviews/${v.id}`),
    onError: (e) =>
      setError(
        e instanceof ApiError ? e.message : 'Interview could not be scheduled.',
      ),
  });
  return (
    <PageShell>
      <PageHeader
        title="Schedule interview"
        description="Link a future interview to an application and its candidate."
      />
      <form
        className="mx-auto grid max-w-3xl gap-4 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          mutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Application ID">
            <input
              required
              min="1"
              type="number"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Candidate ID">
            <input
              required
              min="1"
              type="number"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Start time">
            <input
              required
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              required
              min="5"
              max="1440"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            >
              <option>HR</option>
              <option>TECHNICAL</option>
              <option>FINAL</option>
            </select>
          </Field>
          <Field label="Title">
            <input
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Location">
            <input
              maxLength={500}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Reviewer user IDs (comma-separated)">
            <input
              value={reviewers}
              onChange={(e) => setReviewers(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
          <Field label="Scorecard template">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            >
              <option value="">No structured feedback</option>
              {templates.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Feedback deadline">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-10 rounded-md border bg-background px-3"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={blind}
            onChange={(e) => setBlind(e.target.checked)}
          />
          Hide peer feedback until all reviewers submit
        </label>
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
        <Button disabled={mutation.isPending}>
          {mutation.isPending ? 'Scheduling…' : 'Schedule interview'}
        </Button>
      </form>
    </PageShell>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}
