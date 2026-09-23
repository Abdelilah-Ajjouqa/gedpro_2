import { BriefcaseBusiness, CheckCircle2, UsersRound } from 'lucide-react';
import Link from 'next/link';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)]">
      <section className="hidden border-r border-border bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-background text-sm font-black text-foreground">
            GP
          </span>
          <span>
            <span className="block text-lg font-bold">GEDPro</span>
            <span className="text-xs uppercase tracking-[0.16em] text-background/60">
              Recruitment workspace
            </span>
          </span>
        </Link>
        <div className="max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Hire with clarity
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.045em]">
            One focused workspace for every hiring decision.
          </h1>
          <div className="mt-8 grid gap-4 text-sm text-background/70">
            <p className="flex items-center gap-3">
              <UsersRound className="size-5 text-primary" />
              Keep candidates and teams aligned.
            </p>
            <p className="flex items-center gap-3">
              <BriefcaseBusiness className="size-5 text-primary" />
              Move work through consistent pipelines.
            </p>
            <p className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-primary" />
              Turn activity into accountable decisions.
            </p>
          </div>
        </div>
        <p className="text-xs text-background/45">
          Secure access for GEDPro recruitment teams.
        </p>
      </section>
      <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-lg bg-foreground text-sm font-black text-background">
              GP
            </span>
            <span className="font-bold">GEDPro</span>
          </Link>
          {children}
        </div>
      </section>
    </main>
  );
}

export function FormField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        {...props}
        className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
