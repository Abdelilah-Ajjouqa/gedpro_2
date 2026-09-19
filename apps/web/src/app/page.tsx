import { AppShell } from '@/components/app-shell/app-shell';

export default function Home() {
  return (
    <AppShell>
      <main className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <p className="text-sm font-medium text-primary">Saturday, September 19</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Good afternoon, Alex</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Here is your recruitment workspace. Dashboard metrics and the hiring pipeline arrive in the next phase.</p>
        <section className="mt-10 min-h-64 rounded-xl border border-dashed border-border bg-muted/35" aria-label="Dashboard content placeholder" />
      </main>
    </AppShell>
  );
}
