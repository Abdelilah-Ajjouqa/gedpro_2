import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreatePipelineDto,
  CreateStageDto,
  ListPipelinesDto,
  ReorderStagesDto,
  SetTransitionsDto,
  UpdatePipelineDto,
  UpdateStageDto,
} from './dto/pipeline.dto';
import { Pipeline } from './entities/pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { PipelineTransition } from './entities/pipeline-transition.entity';
import { Job } from '../jobs/entities/job.entity';
import { StageCategory } from './enums/stage-category.enum';
@Injectable()
export class PipelinesService {
  constructor(
    @InjectRepository(Pipeline) private pipelines: Repository<Pipeline>,
    private dataSource: DataSource,
  ) {}
  create(dto: CreatePipelineDto) {
    const positions = dto.stages.map((s) => s.position);
    if (new Set(positions).size !== positions.length)
      throw new BadRequestException('Stage positions must be unique');
    return this.pipelines.save(this.pipelines.create(dto));
  }
  async findAll(query: ListPipelinesDto) {
    const builder = this.pipelines
      .createQueryBuilder('pipeline')
      .leftJoinAndSelect('pipeline.stages', 'stage')
      .where('pipeline.archived = :archived', { archived: query.archived })
      .andWhere('pipeline.isTemplate = :isTemplate', {
        isTemplate: query.isTemplate,
      });
    if (query.search?.trim())
      builder.andWhere(
        '(pipeline.name ILIKE :search OR pipeline.description ILIKE :search)',
        { search: `%${query.search.trim()}%` },
      );
    const [data, total] = await builder
      .orderBy('pipeline.updatedAt', 'DESC')
      .addOrderBy('pipeline.id', 'DESC')
      .addOrderBy('stage.position', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
    const enriched = await Promise.all(
      data.map(async (pipeline) => this.withPolicy(pipeline)),
    );
    return {
      data: enriched,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }
  async findOne(id: number) {
    const value = await this.pipelines.findOne({
      where: { id },
      relations: { stages: { outgoingTransitions: { toStage: true } } },
      order: { stages: { position: 'ASC' } },
    });
    if (!value) throw new NotFoundException(`Pipeline with ID ${id} not found`);
    return value;
  }
  async update(id: number, dto: UpdatePipelineDto) {
    const p = await this.findOne(id);
    return this.pipelines.save(this.pipelines.merge(p, dto));
  }
  async archive(id: number) {
    const p = await this.findOne(id);
    if (await this.dataSource.getRepository(Job).countBy({ pipeline: { id } }))
      throw new ConflictException({
        code: 'PIPELINE_IN_USE',
        message: 'A pipeline referenced by a job cannot be archived',
      });
    p.archived = true;
    return this.pipelines.save(p);
  }
  async addStage(id: number, dto: CreateStageDto) {
    await this.findOne(id);
    const repo = this.dataSource.getRepository(PipelineStage);
    if (await repo.findOneBy({ pipeline: { id }, position: dto.position }))
      throw new ConflictException('Stage position is already used');
    return repo.save(repo.create({ ...dto, pipeline: { id } }));
  }
  async reorder(id: number, dto: ReorderStagesDto) {
    return this.dataSource.transaction(async (m) => {
      const stages = await m
        .getRepository(PipelineStage)
        .find({ where: { pipeline: { id } } });
      if (
        stages.length !== dto.stageIds.length ||
        !stages.every((s) => dto.stageIds.includes(s.id))
      )
        throw new BadRequestException(
          'stageIds must contain every stage exactly once',
        );
      await Promise.all(
        stages.map((s, i) =>
          m.update(PipelineStage, s.id, { position: -(i + 1) }),
        ),
      );
      await Promise.all(
        dto.stageIds.map((stageId, i) =>
          m.update(PipelineStage, stageId, { position: i + 1 }),
        ),
      );
      return this.findOne(id);
    });
  }
  async archiveStage(id: number, stageId: number) {
    const repo = this.dataSource.getRepository(PipelineStage);
    const stage = await repo.findOneBy({ id: stageId, pipeline: { id } });
    if (!stage) throw new NotFoundException('Pipeline stage not found');
    if (
      await this.dataSource
        .getRepository('applications')
        .count({ where: { currentStage: { id: stageId } } })
    )
      throw new ConflictException({
        code: 'STAGE_IN_USE',
        message: 'A stage referenced by an application cannot be archived',
      });
    stage.archived = true;
    await repo.save(stage);
    const readiness = await this.getReadiness(id);
    if (!readiness.ready) {
      stage.archived = false;
      await repo.save(stage);
      throw new ConflictException({
        code: 'PIPELINE_GRAPH_INVALID',
        message: 'Archiving this stage would invalidate the pipeline',
        issues: readiness.issues,
      });
    }
    return stage;
  }
  async updateStage(id: number, stageId: number, dto: UpdateStageDto) {
    const repo = this.dataSource.getRepository(PipelineStage);
    const stage = await repo.findOneBy({
      id: stageId,
      pipeline: { id },
      archived: false,
    });
    if (!stage) throw new NotFoundException('Pipeline stage not found');
    if (await this.dataSource.getRepository(Job).countBy({ pipeline: { id } }))
      throw new ConflictException({
        code: 'PIPELINE_REVISION_LOCKED',
        message: 'Stages on a used pipeline revision cannot be edited',
      });
    return repo.save(repo.merge(stage, dto));
  }
  async setTransitions(id: number, stageId: number, dto: SetTransitionsDto) {
    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(PipelineStage);
      const stages = await repo.find({
        where: { pipeline: { id }, archived: false },
      });
      const from = stages.find((s) => s.id === stageId);
      if (
        !from ||
        new Set(dto.toStageIds).size !== dto.toStageIds.length ||
        !dto.toStageIds.every((target) =>
          stages.some((s) => s.id === target),
        ) ||
        dto.toStageIds.includes(stageId)
      )
        throw new BadRequestException(
          'Transitions must reference distinct stages in the same pipeline',
        );
      await m.delete(PipelineTransition, { fromStage: { id: stageId } });
      return m.save(
        PipelineTransition,
        dto.toStageIds.map((to) =>
          m.create(PipelineTransition, {
            fromStage: { id: stageId },
            toStage: { id: to },
          }),
        ),
      );
    });
  }

  async getReadiness(id: number) {
    const pipeline = await this.findOne(id);
    const stages = pipeline.stages.filter((stage) => !stage.archived);
    const issues: Array<{
      code: string;
      message: string;
      stageIds?: number[];
    }> = [];
    const entries = stages.filter(
      (stage) => stage.category === StageCategory.APPLIED,
    );
    if (entries.length !== 1 || entries[0]?.position !== 1)
      issues.push({
        code: 'INVALID_ENTRY_STAGE',
        message: 'Exactly one active applied stage must be first',
      });
    if (stages.length < 2)
      issues.push({
        code: 'TOO_FEW_STAGES',
        message: 'At least two active stages are required',
      });
    const outgoing = new Map(
      stages.map((stage) => [
        stage.id,
        (stage.outgoingTransitions ?? [])
          .map((edge) => edge.toStage.id)
          .filter((target) =>
            stages.some((candidate) => candidate.id === target),
          ),
      ]),
    );
    const edgeCount = [...outgoing.values()].reduce(
      (sum, targets) => sum + targets.length,
      0,
    );
    if (!edgeCount)
      issues.push({
        code: 'NO_TRANSITIONS',
        message: 'At least one transition is required',
      });
    const terminal = stages.filter((stage) =>
      [
        StageCategory.HIRED,
        StageCategory.REJECTED,
        StageCategory.WITHDRAWN,
      ].includes(stage.category),
    );
    if (!terminal.length)
      issues.push({
        code: 'NO_TERMINAL_STAGE',
        message: 'At least one terminal stage is required',
      });
    if (!terminal.some((stage) => stage.category === StageCategory.HIRED))
      issues.push({
        code: 'NO_HIRED_STAGE',
        message: 'A hired terminal stage is required',
      });
    const terminalIds = new Set(terminal.map((stage) => stage.id));
    const terminalWithEdges = terminal.filter(
      (stage) => (outgoing.get(stage.id)?.length ?? 0) > 0,
    );
    if (terminalWithEdges.length)
      issues.push({
        code: 'TERMINAL_HAS_TRANSITIONS',
        message: 'Terminal stages cannot have outgoing transitions',
        stageIds: terminalWithEdges.map((stage) => stage.id),
      });
    if (entries.length === 1) {
      const reachable = new Set<number>();
      const queue = [entries[0].id];
      while (queue.length) {
        const current = queue.shift()!;
        if (reachable.has(current)) continue;
        reachable.add(current);
        queue.push(...(outgoing.get(current) ?? []));
      }
      const disconnected = stages.filter((stage) => !reachable.has(stage.id));
      if (disconnected.length)
        issues.push({
          code: 'DISCONNECTED_STAGES',
          message: 'Every stage must be reachable from applied',
          stageIds: disconnected.map((stage) => stage.id),
        });
      const canReachTerminal = (start: number) => {
        const seen = new Set<number>();
        const pending = [start];
        while (pending.length) {
          const current = pending.pop()!;
          if (terminalIds.has(current)) return true;
          if (seen.has(current)) continue;
          seen.add(current);
          pending.push(...(outgoing.get(current) ?? []));
        }
        return false;
      };
      const trapped = stages.filter(
        (stage) => !terminalIds.has(stage.id) && !canReachTerminal(stage.id),
      );
      if (trapped.length)
        issues.push({
          code: 'NO_PATH_TO_TERMINAL',
          message: 'Every non-terminal stage must lead to a terminal stage',
          stageIds: trapped.map((stage) => stage.id),
        });
    }
    return { ready: issues.length === 0, issues };
  }

  private async withPolicy(pipeline: Pipeline) {
    const jobCount = await this.dataSource
      .getRepository(Job)
      .countBy({ pipeline: { id: pipeline.id } });
    const readiness = await this.getReadiness(pipeline.id);
    return {
      ...pipeline,
      jobCount,
      inUse: jobCount > 0,
      canArchive: jobCount === 0 && !pipeline.archived,
      canChangeRevision: jobCount === 0,
      readiness,
    };
  }
}
