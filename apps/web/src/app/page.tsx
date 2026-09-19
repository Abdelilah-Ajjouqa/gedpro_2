import { AppShell } from '@/components/app-shell/app-shell';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { HiringPipeline } from '@/components/pipeline/hiring-pipeline';
import { getDashboardData, getPipelineData } from '@/data';

export default async function Home() {
  const [dashboardData, pipelineData] = await Promise.all([
    getDashboardData(),
    getPipelineData(),
  ]);

  return (
    <AppShell>
      <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <DashboardSummary data={dashboardData} />
        <HiringPipeline stages={pipelineData} />
      </main>
    </AppShell>
  );
}
