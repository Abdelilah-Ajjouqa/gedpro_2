import { AppShell } from '@/components/app-shell/app-shell';
import { AdminOnly, UserCreatePage } from '@/features/users/users-page';
export default function Page() {
  return (
    <AdminOnly>
      <AppShell>
        <UserCreatePage />
      </AppShell>
    </AdminOnly>
  );
}
