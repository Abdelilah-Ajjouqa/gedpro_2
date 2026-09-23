import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import type { Interview } from '@/types';

function InterviewRow({ interview }: { interview: Interview }) {
  const fullName = `${interview.candidate.firstName} ${interview.candidate.lastName}`;
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/45 sm:flex-nowrap sm:px-5">
      <Avatar
        src={interview.candidate.avatarUrl}
        firstName={interview.candidate.firstName}
        lastName={interview.candidate.lastName}
        size={36}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" title={fullName}>
          {fullName}
        </p>
        <p
          className="mt-0.5 truncate text-xs text-muted-foreground"
          title={interview.candidate.role}
        >
          {interview.candidate.role}
        </p>
      </div>
      <div className="ml-12 min-w-20 sm:ml-0">
        <p className="text-xs font-medium">{interview.scheduledFor}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          {interview.timeLabel}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link
          href={`/interviews/${interview.id}`}
          aria-label={`View interview with ${fullName}`}
        >
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <span className="hidden lg:inline">View details</span>
        </Link>
      </Button>
    </li>
  );
}

export { InterviewRow };
