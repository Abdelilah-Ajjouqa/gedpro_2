import { CalendarDays, MoreHorizontal, Star } from 'lucide-react';
import Image from 'next/image';

import { StatusBadge } from '@/components/pipeline/status-badge';
import { Button } from '@/components/ui/button';
import type { Candidate } from '@/types';

function getInitials(candidate: Candidate) {
  return `${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase();
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  return (
    <article className="rounded-lg border border-border bg-card p-3.5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground" aria-label={candidate.avatarUrl ? `${fullName} profile photo` : `${fullName} initials`}>
          {candidate.avatarUrl ? <Image src={candidate.avatarUrl} alt="" width={36} height={36} className="size-full object-cover" /> : getInitials(candidate)}
        </div>
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
