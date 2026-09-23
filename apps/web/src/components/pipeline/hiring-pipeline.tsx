import { Plus } from 'lucide-react';

import { PipelineStage } from '@/components/pipeline/pipeline-stage';
import { Button } from '@/components/ui/button';
import type { PipelineStage as PipelineStageType } from '@/types';

function HiringPipeline({ stages }: { stages: PipelineStageType[] }) {
  return (
    <section className="mt-8" aria-labelledby="hiring-pipeline-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Recruitment flow
          </p>
          <h2
            id="hiring-pipeline-heading"
            className="mt-1 text-xl font-semibold tracking-[-0.035em]"
          >
            Hiring pipeline
          </h2>
        </div>
        <Button size="sm">
          <Plus className="size-4" />
          Add candidate
        </Button>
      </div>
      {stages.length ? (
        <div
          className="-mx-4 overflow-x-auto px-4 pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          tabIndex={0}
          aria-label="Hiring pipeline stages. Scroll horizontally to view all stages."
        >
          <div className="grid min-w-[1180px] grid-cols-5 gap-3 xl:min-w-[1240px] 2xl:min-w-0 2xl:gap-4">
            {stages.map((stage, index) => (
              <PipelineStage
                key={stage.id}
                stage={stage}
                stages={stages}
                isLast={index === stages.length - 1}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-5 py-12 text-center">
          <p className="text-sm font-medium">No pipeline stages available</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a pipeline and its stages to start tracking candidates.
          </p>
        </div>
      )}
    </section>
  );
}

export { HiringPipeline };
