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
  ReorderStagesDto,
  SetTransitionsDto,
  UpdatePipelineDto,
} from './dto/pipeline.dto';
import { Pipeline } from './entities/pipeline.entity';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { PipelineTransition } from './entities/pipeline-transition.entity';
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
  findAll() {
    return this.pipelines.find({
      where: { archived: false },
      relations: { stages: true },
      order: { stages: { position: 'ASC' } },
    });
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
    stage.archived = true;
    return repo.save(stage);
  }
  async setTransitions(id: number, stageId: number, dto: SetTransitionsDto) {
    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(PipelineStage);
      const stages = await repo.find({ where: { pipeline: { id } } });
      const from = stages.find((s) => s.id === stageId);
      if (
        !from ||
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
}
