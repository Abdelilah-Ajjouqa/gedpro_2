import { Suspense } from 'react';
import { CommunicationsPage } from '@/features/communications/communications-page';
import { LoadingState } from '@/shared/components/async-state';
import { PageShell } from '@/shared/components/page';

export default function Page() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <LoadingState label="Loading communications" />
        </PageShell>
      }
    >
      <CommunicationsPage />
    </Suspense>
  );
}
