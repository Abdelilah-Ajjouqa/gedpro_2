import type { CandidateStatus } from '@/types';

type StageHeaderProps = {
  id: CandidateStatus;
  label: string;
  count: number;
};

function StageHeader({ id, label, count }: StageHeaderProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-card text-[11px] font-bold tabular-nums">{count}</span>
      <h3 id={`pipeline-stage-${id}`} className="text-sm font-semibold">{label}</h3>
    </div>
  );
}

export { StageHeader };
