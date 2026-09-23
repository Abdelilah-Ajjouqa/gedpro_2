import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DocumentsPage } from '@/features/documents/documents-page';

export default function Page() {
  return (
    <ProtectedRoute capability="documents:list">
      <AppShell>
        <Suspense
          fallback={
            <main className="p-8" aria-busy="true">
              Loading documents…
            </main>
          }
        >
          <DocumentsPage />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
