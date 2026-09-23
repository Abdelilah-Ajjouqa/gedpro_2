import { Suspense } from 'react';
import { InterviewSchedulePage } from '@/features/interviews/schedule-page';
import { LoadingState } from '@/shared/components/async-state';
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading form" />}>
      <InterviewSchedulePage />
    </Suspense>
  );
}
