import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { InterviewRow } from '@/components/dashboard-panels/interview-row';
import { PanelHeader } from '@/components/dashboard-panels/panel-header';
import { Button } from '@/components/ui/button';
import type { Interview } from '@/types';

function UpcomingInterviews({ interviews }: { interviews: Interview[] }) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby="upcoming-interviews-heading"
    >
      <PanelHeader
        title="Upcoming interviews"
        description={`${interviews.length} scheduled next`}
        icon={CalendarDays}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/interviews">View all</Link>
          </Button>
        }
      />
      <h2 id="upcoming-interviews-heading" className="sr-only">
        Upcoming interviews
      </h2>
      <ul className="divide-y divide-border">
        {interviews.length ? (
          interviews.map((interview) => (
            <InterviewRow key={interview.id} interview={interview} />
          ))
        ) : (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">
            No upcoming interviews.
          </li>
        )}
      </ul>
    </section>
  );
}

export { UpcomingInterviews };
