'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, MoreHorizontal, Star } from 'lucide-react';

import { StatusBadge } from '@/components/pipeline/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { moveCandidate } from '@/lib/dashboard-api';
import type { Candidate, PipelineStage } from '@/types';

function CandidateCard({ candidate, stages }: { candidate: Candidate; stages: PipelineStage[] }) {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (stageId: number) => moveCandidate(candidate.applicationId!, stageId),
    onMutate: async (stageId) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline'] });
      const snapshots = queryClient.getQueriesData<PipelineStage[]>({ queryKey: ['pipeline'] });
      queryClient.setQueriesData<PipelineStage[]>({ queryKey: ['pipeline'] }, (current) => {
        if (!current) return current;
        const moving = current.flatMap((stage) => stage.candidates).find((item) => item.applicationId === candidate.applicationId);
        const target = current.find((stage) => stage.stageId === stageId);
        if (!moving) return current;
        return current.map((stage) => ({ ...stage, candidates: stage.stageId === stageId ? [...stage.candidates.filter((item) => item.applicationId !== moving.applicationId), { ...moving, stageId, status: target?.status ?? moving.status }] : stage.candidates.filter((item) => item.applicationId !== moving.applicationId) }));
      });
      return { snapshots };
    },
    onError: (_error, _stageId, context) => context?.snapshots.forEach(([key, value]) => queryClient.setQueryData(key, value)),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pipeline'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] }),
        queryClient.invalidateQueries({ queryKey: ['candidate', candidate.id] }),
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] }),
      ]);
    },
  });

  return (
    <article className="rounded-lg border border-border bg-card p-3.5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Avatar src={candidate.avatarUrl} firstName={candidate.firstName} lastName={candidate.lastName} size={36} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold tracking-[-0.015em]" title={fullName}>{fullName}</h4>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={candidate.role}>{candidate.role}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mr-2 -mt-2 size-8 shrink-0 text-muted-foreground" aria-label={`Open actions for ${fullName}`} disabled={mutation.isPending}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuLabel>Move to stage</DropdownMenuLabel>{stages.filter((stage) => stage.stageId && stage.stageId !== candidate.stageId).map((stage) => <DropdownMenuItem key={stage.id} onSelect={() => mutation.mutate(stage.stageId!)}>{stage.label}</DropdownMenuItem>)}</DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <StatusBadge status={candidate.status} />
        <div className="flex items-center gap-2.5 text-[10px] font-medium text-muted-foreground">
          {candidate.rating > 0 ? <span className="inline-flex items-center gap-1" aria-label={`Rating ${candidate.rating} out of 5`}><Star className="size-3 fill-status-warning text-status-warning" aria-hidden="true" />{candidate.rating.toFixed(1)}</span> : null}
          <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" aria-hidden="true" />{candidate.appliedAt}</span>
        </div>
      </div>
      {mutation.isError ? <p className="mt-2 text-xs text-destructive" role="status">Could not move candidate. The change was restored.</p> : null}
    </article>
  );
}

export { CandidateCard };
