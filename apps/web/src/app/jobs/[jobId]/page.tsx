import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { JobWorkspace } from '@/features/jobs/job-workspace';
export default function Page() {
  return (
    <ProtectedRoute capability="jobs:read">
      <AppShell>
        <JobWorkspace />
      </AppShell>
    </ProtectedRoute>
  );
}
