import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ApplicationCreatePage } from '@/features/applications/application-create-page';
export default function Page() {
  return (
    <ProtectedRoute capability="applications:create">
      <AppShell>
        <Suspense
          fallback={
            <main className="p-8" aria-busy="true">
              Loading form…
            </main>
          }
        >
          <ApplicationCreatePage />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
