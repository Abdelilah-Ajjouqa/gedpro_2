import { Avatar } from '@/components/ui/avatar';
import type { Person } from '@/types';

type ManagerCardProps = {
  manager: Person;
  dateLabel: string;
  greeting: string;
};

function ManagerCard({ manager, dateLabel, greeting }: ManagerCardProps) {
  return (
    <section className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 sm:gap-5 sm:p-5" aria-labelledby="manager-greeting">
      <Avatar src={manager.avatarUrl} firstName={manager.firstName} lastName={manager.lastName} size={64} priority className="text-sm shadow-sm" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{dateLabel}</p>
        <h1 id="manager-greeting" className="mt-1.5 truncate text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
          {greeting}, {manager.firstName}
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">Here&apos;s what&apos;s happening with your hiring today.</p>
      </div>
    </section>
  );
}

export { ManagerCard };
