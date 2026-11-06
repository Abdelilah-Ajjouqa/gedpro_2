import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { FormCompletionPage } from '@/features/forms/form-completion-page';

export default async function Page({
  params,
}: {
  params: Promise<{ applicationId: string; formId: string }>;
}) {
  const { applicationId, formId } = await params;
  return (
    <ProtectedRoute capability="applications:read">
      <AppShell>
        <FormCompletionPage
          applicationId={Number(applicationId)}
          formId={formId}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
