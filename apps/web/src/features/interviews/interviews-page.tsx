'use client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { buttonVariants } from '@/components/ui/button';
import { getApiScope } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { PageHeader, PageShell } from '@/shared/components/page';
import { Pagination } from '@/shared/components/pagination';
import { interviewKeys, listInterviews } from './api';
import {
  decodeInterviewList,
  encodeInterviewList,
  formatInterviewTime,
} from './url-state';
import type { InterviewListParams } from './types';
export function InterviewsPage() {
  const router = useRouter(),
    path = usePathname(),
    search = useSearchParams();
  const { user, hasCapability } = useAuth();
  const p = useMemo(
    () => decodeInterviewList(new URLSearchParams(search.toString())),
    [search],
  );
  const scope = getApiScope(user?.id);
  const query = useQuery({
    queryKey: interviewKeys.list(scope, p),
    queryFn: ({ signal }) => listInterviews(p, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
  });
  const set = (v: Partial<InterviewListParams>, reset = true) =>
    router.replace(
      `${path}?${encodeInterviewList({ ...p, ...v, page: reset ? 1 : (v.page ?? p.page) })}`,
    );
  return (
    <PageShell>
      <PageHeader
        title="Interviews"
        description="Review the scoped schedule and outstanding feedback."
        actions={
          hasCapability('interviews:manage') ? (
            <Link className={buttonVariants()} href="/interviews/new">
              Schedule interview
            </Link>
          ) : undefined
        }
      />
      <form className="mb-5 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
        <label className="grid gap-1 text-sm">
          <span>From</span>
          <input
            type="date"
            className="h-10 rounded-md border bg-background px-2"
            value={p.from}
            onChange={(e) => set({ from: e.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>To</span>
          <input
            type="date"
            className="h-10 rounded-md border bg-background px-2"
            value={p.to}
            onChange={(e) => set({ to: e.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Status</span>
          <select
            className="h-10 rounded-md border bg-background px-2"
            value={p.status}
            onChange={(e) => set({ status: e.target.value })}
          >
            <option value="">All</option>
            <option>SCHEDULED</option>
            <option>RESCHEDULED</option>
            <option>COMPLETED</option>
            <option>CANCELLED</option>
            <option>NO_SHOW</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Type</span>
          <select
            className="h-10 rounded-md border bg-background px-2"
            value={p.type}
            onChange={(e) => set({ type: e.target.value })}
          >
            <option value="">All</option>
            <option>HR</option>
            <option>TECHNICAL</option>
            <option>FINAL</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>Feedback</span>
          <select
            className="h-10 rounded-md border bg-background px-2"
            value={p.feedback}
            onChange={(e) => set({ feedback: e.target.value })}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span>View</span>
          <select
            className="h-10 rounded-md border bg-background px-2"
            value={p.view}
            onChange={(e) =>
              set({ view: e.target.value as 'list' | 'agenda' }, false)
            }
          >
            <option value="list">List</option>
            <option value="agenda">Agenda</option>
          </select>
        </label>
      </form>
      {query.isPending ? (
        <LoadingState label="Loading interviews" />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          title="Interviews could not be loaded"
          action={{ label: 'Retry', onClick: () => void query.refetch() }}
        />
      ) : query.data.data.length === 0 ? (
        <AsyncState
          kind="empty"
          title="No interviews found"
          description="Change the filters or schedule an interview."
        />
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {query.data.total} interviews found
          </p>
          <ul
            className={
              p.view === 'agenda'
                ? 'space-y-3'
                : 'divide-y rounded-xl border bg-card'
            }
          >
            {query.data.data.map((i) => (
              <li
                key={i.id}
                className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <Link
                    className="font-semibold hover:underline"
                    href={`/interviews/${i.id}`}
                  >
                    {i.title || `${i.type} interview`}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={i.date}>
                      {formatInterviewTime(i.date, p.tz)}
                    </time>{' '}
                    · {i.timezone} · {i.duration} min
                  </p>
                  <p className="text-sm">
                    <Link
                      className="hover:underline"
                      href={`/candidates/${i.candidate.id}`}
                    >
                      {i.candidate.firstName} {i.candidate.lastName}
                    </Link>
                    {i.job ? (
                      <>
                        {' '}
                        ·{' '}
                        <Link
                          className="hover:underline"
                          href={`/jobs/${i.job.id}`}
                        >
                          {i.job.title}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="text-sm sm:text-right">
                  <span className="rounded-full border px-2 py-1 text-xs">
                    {i.status}
                  </span>
                  <p className="mt-2 text-muted-foreground">
                    Feedback {i.feedback.submitted}/{i.feedback.total}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Pagination
              page={p.page}
              limit={p.limit}
              total={query.data.total}
              onPageChange={(page) => set({ page }, false)}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}
