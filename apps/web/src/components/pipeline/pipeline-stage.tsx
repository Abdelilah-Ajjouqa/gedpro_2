import { CandidateCard } from '@/components/pipeline/candidate-card';
import { PipelineConnector } from '@/components/pipeline/pipeline-connector';
import { StageHeader } from '@/components/pipeline/stage-header';
import type { PipelineStage as PipelineStageType } from '@/types';

type PipelineStageProps = {
  stage: PipelineStageType;
  isLast: boolean;
};

function PipelineStage({ stage, isLast }: PipelineStageProps) {
  return (
    <section className="relative min-w-0" aria-labelledby={`pipeline-stage-${stage.id}`}>
      {!isLast ? <PipelineConnector /> : null}
      <div className="relative z-10 inline-block bg-background pr-3">
        <StageHeader id={stage.id} label={stage.label} count={stage.candidates.length} />
      </div>
      <div className="mt-3 space-y-2.5">
        {stage.candidates.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}
      </div>
    </section>
  );
}

export { PipelineStage };
