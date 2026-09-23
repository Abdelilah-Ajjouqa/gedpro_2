import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { JobsPage } from '@/features/jobs/jobs-page';

export default function Page() {
  return (
    <ProtectedRoute capability="jobs:read">
      <AppShell>
        <Suspense
          fallback={
            <main className="p-8" aria-busy="true">
              Loading jobs…
            </main>
          }
        >
          <JobsPage />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
