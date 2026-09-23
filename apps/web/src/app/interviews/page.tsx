import { Suspense } from 'react';
import { InterviewsPage } from '@/features/interviews/interviews-page';
import { LoadingState } from '@/shared/components/async-state';
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading interviews" />}>
      <InterviewsPage />
    </Suspense>
  );
}
