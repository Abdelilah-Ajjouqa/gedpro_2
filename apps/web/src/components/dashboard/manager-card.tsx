import Image from 'next/image';

import type { Person } from '@/types';

function getInitials(person: Person) {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

type ManagerCardProps = {
  manager: Person;
  dateLabel: string;
  greeting: string;
};

function ManagerCard({ manager, dateLabel, greeting }: ManagerCardProps) {
  const fullName = `${manager.firstName} ${manager.lastName}`;

  return (
    <section className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-card p-4 sm:gap-5 sm:p-5" aria-labelledby="manager-greeting">
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground text-sm font-bold tracking-wide text-background sm:size-16" aria-label={manager.avatarUrl ? `${fullName} profile photo` : `${fullName} initials`}>
        {manager.avatarUrl ? (
          <Image src={manager.avatarUrl} alt="" width={64} height={64} className="size-full object-cover" />
        ) : getInitials(manager)}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{dateLabel}</p>
        <h1 id="manager-greeting" className="mt-1.5 truncate text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
          {greeting}, {manager.firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your hiring today.</p>
      </div>
    </section>
  );
}

export { ManagerCard };
