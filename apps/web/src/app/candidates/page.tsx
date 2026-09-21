import { CandidatesPage } from '@/features/candidates/candidates-page';
import { Suspense } from 'react';
export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-6" role="status">
          Loading candidates…
        </div>
      }
    >
      <CandidatesPage />
    </Suspense>
  );
}
