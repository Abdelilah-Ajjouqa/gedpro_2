import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ReportsPage } from '@/features/reporting/reports-page';

export default function Page() {
  return (
    <ProtectedRoute capability="reports:read">
      <AppShell>
        <Suspense fallback={<main className="p-8" aria-busy="true">Loading reports…</main>}>
          <ReportsPage />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
