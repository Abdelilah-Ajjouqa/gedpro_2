import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { JobCreatePage } from '@/features/jobs/job-create-page';
export default function Page() {
  return (
    <ProtectedRoute capability="jobs:create">
      <AppShell>
        <JobCreatePage />
      </AppShell>
    </ProtectedRoute>
  );
}
