import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ApplicationsPage } from '@/features/applications/applications-page';
export default function Page() {
  return (
    <ProtectedRoute capability="applications:read">
      <AppShell>
        <Suspense
          fallback={
            <main className="p-8" aria-busy="true">
              Loading applications…
            </main>
          }
        >
          <ApplicationsPage />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
