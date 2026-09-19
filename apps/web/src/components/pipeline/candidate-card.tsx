import { CalendarDays, MoreHorizontal, Star } from 'lucide-react';

import { StatusBadge } from '@/components/pipeline/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Candidate } from '@/types';

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  return (
    <article className="rounded-lg border border-border bg-card p-3.5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar src={candidate.avatarUrl} firstName={candidate.firstName} lastName={candidate.lastName} size={36} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold tracking-[-0.015em]" title={fullName}>{fullName}</h4>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={candidate.role}>{candidate.role}</p>
        </div>
        <Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 shrink-0 text-muted-foreground" aria-label={`Open actions for ${fullName}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <StatusBadge status={candidate.status} />
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1" aria-label={`Rating ${candidate.rating} out of 5`}><Star className="size-3 fill-status-warning text-status-warning" aria-hidden="true" />{candidate.rating.toFixed(1)}</span>
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" aria-hidden="true" />{candidate.appliedAt}</span>
        </div>
      </div>
    </article>
  );
}

export { CandidateCard };
