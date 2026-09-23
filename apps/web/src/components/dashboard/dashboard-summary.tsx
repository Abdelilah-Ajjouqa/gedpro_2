import { ManagerCard } from '@/components/dashboard/manager-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import type { DashboardData } from '@/types';

function DashboardSummary({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <ManagerCard
        manager={data.manager}
        dateLabel={data.dateLabel}
        greeting={data.greeting}
      />
      <section aria-labelledby="dashboard-metrics-heading">
        <h2 id="dashboard-metrics-heading" className="sr-only">
          Dashboard metrics
        </h2>
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>
    </div>
  );
}

export { DashboardSummary };
