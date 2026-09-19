import { CalendarDays } from 'lucide-react';

import { InterviewRow } from '@/components/dashboard-panels/interview-row';
import { PanelHeader } from '@/components/dashboard-panels/panel-header';
import { Button } from '@/components/ui/button';
import type { Interview } from '@/types';

function UpcomingInterviews({ interviews }: { interviews: Interview[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card" aria-labelledby="upcoming-interviews-heading">
      <PanelHeader
        title="Upcoming interviews"
        description={`${interviews.length} scheduled next`}
        icon={CalendarDays}
        action={<Button variant="ghost" size="sm">View all</Button>}
      />
      <h2 id="upcoming-interviews-heading" className="sr-only">Upcoming interviews</h2>
      <ul className="divide-y divide-border">
        {interviews.map((interview) => <InterviewRow key={interview.id} interview={interview} />)}
      </ul>
    </section>
  );
}

export { UpcomingInterviews };
