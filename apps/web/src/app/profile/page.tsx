'use client';
import { AppShell } from '@/components/app-shell/app-shell';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { PageHeader, PageShell } from '@/shared/components/page';
const descriptions: Record<string, string> = {
  admin: 'Administrators manage product access and administration.',
  rh: 'Recruiters manage recruitment operations.',
  manager: 'Managers have job-scoped operational visibility.',
  candidate: 'Candidates use candidate-facing and self-service features.',
};
function Profile() {
  const { user, capabilities, signOut } = useAuth();
  if (!user) return null;
  return (
    <PageShell>
      <PageHeader
        title="Your profile"
        description="Your current account and access information."
      />
      <section className="max-w-xl rounded-xl border bg-card p-5">
        <h2 className="text-lg font-semibold">
          {user.firstName} {user.lastName}
        </h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <dl className="mt-5 grid gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="capitalize">
              {user.role === 'rh' ? 'Recruiter' : user.role}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">
              What this role can do
            </dt>
            <dd>{descriptions[user.role] ?? 'Unknown access'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Account status</dt>
            <dd>Active</dd>
          </div>
        </dl>
        <details className="mt-5 text-sm">
          <summary className="cursor-pointer">
            View server-issued capabilities
          </summary>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            {capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        </details>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </section>
    </PageShell>
  );
}
export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'rh', 'manager', 'candidate']}>
      <AppShell>
        <Profile />
      </AppShell>
    </ProtectedRoute>
  );
}
