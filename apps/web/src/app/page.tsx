import { AppShell } from '@/components/app-shell/app-shell';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import { DashboardPanels } from '@/components/dashboard-panels/dashboard-panels';
import { HiringPipeline } from '@/components/pipeline/hiring-pipeline';
import { getDashboardData, getDashboardPanelsData, getPipelineData } from '@/data';

export default async function Home() {
  const [dashboardData, pipelineData, panelsData] = await Promise.all([
    getDashboardData(),
    getPipelineData(),
    getDashboardPanelsData(),
  ]);

  return (
    <AppShell>
      <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <DashboardSummary data={dashboardData} />
        <HiringPipeline stages={pipelineData} />
        <DashboardPanels data={panelsData} />
      </main>
    </AppShell>
  );
}
