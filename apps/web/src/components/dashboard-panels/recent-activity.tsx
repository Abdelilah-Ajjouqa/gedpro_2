import { Activity } from 'lucide-react';

import { ActivityItem } from '@/components/dashboard-panels/activity-item';
import { PanelHeader } from '@/components/dashboard-panels/panel-header';
import { Button } from '@/components/ui/button';
import type { ActivityEvent } from '@/types';

function RecentActivity({ activity }: { activity: ActivityEvent[] }) {
  return (
    <section
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-labelledby="recent-activity-heading"
    >
      <PanelHeader
        title="Recent activity"
        description="Latest team updates"
        icon={Activity}
        action={
          <Button variant="ghost" size="sm">
            View all
          </Button>
        }
      />
      <h2 id="recent-activity-heading" className="sr-only">
        Recent activity
      </h2>
      <ol>
        {activity.length ? (
          activity.map((event, index) => (
            <ActivityItem
              key={event.id}
              event={event}
              isLast={index === activity.length - 1}
            />
          ))
        ) : (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">
            No recent activity.
          </li>
        )}
      </ol>
    </section>
  );
}

export { RecentActivity };
