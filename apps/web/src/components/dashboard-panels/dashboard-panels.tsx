import { RecentActivity } from '@/components/dashboard-panels/recent-activity';
import { UpcomingInterviews } from '@/components/dashboard-panels/upcoming-interviews';
import type { DashboardPanelsData } from '@/types';

function DashboardPanels({ data }: { data: DashboardPanelsData }) {
  return (
    <div className="mt-8 grid items-start gap-4 pb-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <UpcomingInterviews interviews={data.interviews} />
      <RecentActivity activity={data.activity} />
    </div>
  );
}

export { DashboardPanels };
