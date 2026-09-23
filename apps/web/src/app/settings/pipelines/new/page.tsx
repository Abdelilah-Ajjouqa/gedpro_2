import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { PipelineCreatePage } from '@/features/pipelines/pipeline-create-page';
export default function Page() {
  return (
    <ProtectedRoute capability="pipelines:configure">
      <AppShell>
        <PipelineCreatePage />
      </AppShell>
    </ProtectedRoute>
  );
}
