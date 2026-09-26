'use client';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth, currentUserKey } from '@/components/providers/auth-provider';
import { Button, buttonVariants } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { getApiScope, ApiError } from '@/lib/api-client';
import { AsyncState, LoadingState } from '@/shared/components/async-state';
import { Breadcrumbs, PageHeader, PageShell } from '@/shared/components/page';
import { Pagination } from '@/shared/components/pagination';
import { DataTable } from '@/shared/components/data-table';
import {
  createUser,
  getUser,
  listUsers,
  setUserActive,
  updateUser,
  userAdminKeys,
} from './api';
import { roles, type UserRole } from './types';
const roleValues = Object.keys(roles) as UserRole[];
function RoleGuide() {
  return (
    <details className="mb-5 rounded-lg border bg-card p-4">
      <summary className="cursor-pointer font-medium">
        What each role can do
      </summary>
      <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
        {roleValues.map((role) => (
          <li key={role}>
            <strong className="text-foreground">{roles[role].label}:</strong>{' '}
            {roles[role].description}
          </li>
        ))}
      </ul>
    </details>
  );
}
function errorText(error: unknown) {
  if (error instanceof ApiError)
    return error.payload?.code === 'EMAIL_ALREADY_EXISTS'
      ? 'An account already uses this email address.'
      : error.message;
  return 'Something went wrong. Please try again.';
}
export function UsersDirectoryPage() {
  const { user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = (params.get('q') ?? '').slice(0, 100);
  const role = roleValues.includes(params.get('role') as UserRole)
    ? (params.get('role') as UserRole)
    : undefined;
  const active =
    params.get('status') === 'active'
      ? true
      : params.get('status') === 'inactive'
        ? false
        : undefined;
  const filters = {
    q: q.length >= 2 ? q : undefined,
    role,
    active,
    page,
    limit: 20,
  };
  const [text, setText] = useState(q);
  const query = useQuery({
    queryKey: userAdminKeys.list(getApiScope(user?.id), filters),
    queryFn: ({ signal }) => listUsers(filters, signal),
    staleTime: 45_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
  const nav = (next: Partial<typeof filters>) => {
    const value = { ...filters, ...next };
    const search = new URLSearchParams();
    if (value.q) search.set('q', value.q);
    if (value.role) search.set('role', value.role);
    if (value.active !== undefined)
      search.set('status', value.active ? 'active' : 'inactive');
    if (value.page > 1) search.set('page', String(value.page));
    router.replace(`/settings/users${search.size ? `?${search}` : ''}`);
  };
  return (
    <PageShell>
      <Breadcrumbs items={[{ label: 'Administration' }, { label: 'Users' }]} />
      <PageHeader
        title="User administration"
        description="Manage internal account access. Provisioned accounts remain inactive until their invitation is completed."
        actions={
          <Link className={buttonVariants()} href="/settings/users/new">
            Provision account
          </Link>
        }
      />
      <RoleGuide />
      <form
        role="search"
        className="mb-5 grid gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          nav({ q: text.trim(), page: 1 });
        }}
      >
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Search name or email</span>
          <input
            className="h-9 rounded-md border bg-background px-3"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Role</span>
          <select
            className="h-9 rounded-md border bg-background px-2"
            value={role ?? ''}
            onChange={(e) =>
              nav({
                role: (e.target.value || undefined) as UserRole | undefined,
                page: 1,
              })
            }
          >
            <option value="">All roles</option>
            {roleValues.map((v) => (
              <option key={v} value={v}>
                {roles[v].label}
              </option>
            ))}
          </select>
        </label>
        <Button className="self-end" type="submit">
          Search
        </Button>
      </form>
      {query.isPending ? (
        <LoadingState label="Loading users" />
      ) : query.isError ? (
        <AsyncState
          kind="error"
          title="Users could not be loaded"
          action={{ label: 'Retry', onClick: () => void query.refetch() }}
        />
      ) : (
        <>
          <DataTable
            rows={query.data.data}
            rowKey={(row) => row.id}
            columns={[
              {
                id: 'name',
                header: 'Name',
                cell: (row) => (
                  <Link
                    className="font-medium hover:underline"
                    href={`/settings/users/${row.id}`}
                  >
                    {row.firstName} {row.lastName}
                  </Link>
                ),
              },
              { id: 'email', header: 'Email', cell: (row) => row.email },
              {
                id: 'role',
                header: 'Role',
                cell: (row) => roles[row.role]?.label ?? 'Unknown access',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => (row.isActive ? '● Active' : '○ Inactive'),
              },
            ]}
            empty={
              <AsyncState
                kind="empty"
                title={q ? 'No matching users' : 'No internal accounts yet'}
              />
            }
          />
          <Pagination
            page={page}
            limit={20}
            total={query.data.total}
            onPageChange={(value) => nav({ page: value })}
          />
        </>
      )}
    </PageShell>
  );
}
function UserForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  submitLabel: string;
  onSubmit(input: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  }): Promise<void>;
}) {
  const [values, setValues] = useState(
    initial ?? {
      firstName: '',
      lastName: '',
      email: '',
      role: 'candidate' as UserRole,
    },
  );
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid max-w-xl gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(undefined);
        if (
          !values.firstName.trim() ||
          !values.lastName.trim() ||
          !/^\S+@\S+\.\S+$/.test(values.email)
        )
          return setError(
            'Enter a first name, last name, and valid email address.',
          );
        setPending(true);
        try {
          await onSubmit(values);
        } catch (err) {
          setError(errorText(err));
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(['firstName', 'lastName'] as const).map((field) => (
          <label className="grid gap-1" key={field}>
            <span className="text-sm">
              {field === 'firstName' ? 'First name' : 'Last name'}
            </span>
            <input
              className="h-9 rounded-md border bg-background px-3"
              value={values[field]}
              onChange={(e) =>
                setValues({ ...values, [field]: e.target.value })
              }
              required
              minLength={2}
            />
          </label>
        ))}
      </div>
      <label className="grid gap-1">
        <span className="text-sm">Email</span>
        <input
          type="email"
          className="h-9 rounded-md border bg-background px-3"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          required
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm">Role</span>
        <select
          className="h-9 rounded-md border bg-background px-2"
          value={values.role}
          onChange={(e) =>
            setValues({ ...values, role: e.target.value as UserRole })
          }
        >
          {roleValues.map((role) => (
            <option key={role} value={role}>
              {roles[role].label}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
export function UserCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Users', href: '/settings/users' },
          { label: 'Provision account' },
        ]}
      />
      <PageHeader
        title="Provision internal account"
        description="No password is collected here. The account remains inactive until the approved invitation flow is completed."
      />
      <UserForm
        submitLabel="Provision account"
        onSubmit={async (input) => {
          const created = await createUser(input);
          await qc.invalidateQueries({
            queryKey: userAdminKeys.all(getApiScope(user?.id)),
          });
          router.replace(`/settings/users/${created.id}`);
        }}
      />
    </PageShell>
  );
}
export function UserDetailPage({ id }: { id: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: userAdminKeys.detail(getApiScope(user?.id), id),
    queryFn: ({ signal }) => getUser(id, signal),
    staleTime: 45_000,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: ({ active, reason }: { active: boolean; reason: string }) =>
      setUserActive(id, active, reason),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: userAdminKeys.all(getApiScope(user?.id)),
      });
    },
  });
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState label="Loading user" />
      </PageShell>
    );
  if (query.isError)
    return (
      <PageShell>
        <AsyncState
          kind={
            query.error instanceof ApiError && query.error.kind === 'not-found'
              ? 'not-found'
              : 'error'
          }
          title="User could not be loaded"
          action={{
            label: 'Back to users',
            onClick: () => router.replace('/settings/users'),
          }}
        />
      </PageShell>
    );
  const account = query.data;
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Users', href: '/settings/users' },
          { label: `${account.firstName} ${account.lastName}` },
        ]}
      />
      <PageHeader
        title={`${account.firstName} ${account.lastName}`}
        description={account.email}
        actions={
          <Link
            className={buttonVariants({ variant: 'outline' })}
            href={`/settings/users/${id}/edit`}
          >
            Edit account
          </Link>
        }
      />
      <section className="max-w-xl rounded-xl border bg-card p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd>{roles[account.role]?.label ?? 'Unknown access'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Account status</dt>
            <dd>{account.isActive ? '● Active' : '○ Inactive'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Email verified</dt>
            <dd>{account.emailVerified ? 'Verified' : 'Not verified'}</dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-muted-foreground">
          {roles[account.role]?.description}
        </p>
        {account.id !== user?.id ? (
          <Button
            className="mt-5"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              const action = account.isActive ? 'deactivate' : 'activate';
              const reason = window.prompt(`Reason to ${action} this account:`);
              if (
                reason &&
                reason.trim().length >= 3 &&
                window.confirm(
                  `${action[0].toUpperCase()}${action.slice(1)} ${account.firstName} ${account.lastName}? This revokes active sessions.`,
                )
              )
                mutation.mutate({
                  active: !account.isActive,
                  reason: reason.trim(),
                });
            }}
          >
            {account.isActive ? 'Deactivate account' : 'Reactivate account'}
          </Button>
        ) : null}
        {mutation.isError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {errorText(mutation.error)}
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}
export function UserEditPage({ id }: { id: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: userAdminKeys.detail(getApiScope(user?.id), id),
    queryFn: ({ signal }) => getUser(id, signal),
    retry: false,
  });
  if (query.isPending)
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  if (query.isError)
    return (
      <PageShell>
        <AsyncState kind="not-found" title="User could not be loaded" />
      </PageShell>
    );
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'Users', href: '/settings/users' },
          { label: 'Edit account' },
        ]}
      />
      <PageHeader
        title="Edit account"
        description="Role changes affect product access immediately after server validation."
      />
      <UserForm
        initial={query.data}
        submitLabel="Save changes"
        onSubmit={async (input) => {
          if (
            input.role !== query.data.role &&
            !window.confirm(
              `Change role to ${roles[input.role].label}? This changes product access.`,
            )
          )
            return;
          await updateUser(id, input);
          await qc.invalidateQueries({
            queryKey: userAdminKeys.all(getApiScope(user?.id)),
          });
          if (id === user?.id)
            await qc.invalidateQueries({ queryKey: currentUserKey });
          router.replace(`/settings/users/${id}`);
        }}
      />
    </PageShell>
  );
}
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} capability="users:read">
      {children}
    </ProtectedRoute>
  );
}
