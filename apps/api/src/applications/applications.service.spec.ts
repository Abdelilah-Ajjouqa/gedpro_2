import { BadRequestException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { StageCategory } from '../pipelines/enums/stage-category.enum';
describe('ApplicationsService pipeline transitions', () => {
  const stageRepo = { findOne: jest.fn() };
  const transitionRepo = { findOneBy: jest.fn() };
  const manager: any = {
    createQueryBuilder: jest.fn(),
    getRepository: jest.fn((entity: any) =>
      entity.name === 'PipelineStage' ? stageRepo : transitionRepo,
    ),
    save: jest.fn(async (v: any) => v),
    create: jest.fn((_e: any, v: any) => v),
  };
  const source: any = { transaction: jest.fn((cb: any) => cb(manager)) };
  const timeline = { record: jest.fn() };
  const service = new ApplicationsService({} as any, source, timeline as any);
  const actor: any = { id: 9 };
  beforeEach(() => jest.clearAllMocks());
  function locked(app: any) {
    const b: any = {};
    b.innerJoinAndSelect = jest.fn(() => b);
    b.setLock = jest.fn(() => b);
    b.where = jest.fn(() => b);
    b.getOne = jest.fn().mockResolvedValue(app);
    manager.createQueryBuilder.mockReturnValue(b);
  }
  const pipeline = { id: 3 };
  const applied = {
    id: 1,
    name: 'Applied',
    category: StageCategory.APPLIED,
    pipeline,
  };
  const screening = {
    id: 2,
    name: 'Screening',
    category: StageCategory.SCREENING,
    pipeline,
  };
  it('enforces allowed transitions and records immutable history', async () => {
    const app: any = {
      id: 4,
      candidate: { id: 8 },
      currentStage: applied,
      job: { pipeline },
    };
    locked(app);
    stageRepo.findOne.mockResolvedValue(screening);
    transitionRepo.findOneBy.mockResolvedValue({ id: 1 });
    const result = await service.transition(
      4,
      { stageId: 2, comment: 'Qualified' },
      actor,
    );
    expect(result.currentStage).toBe(screening);
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ previousStage: applied, newStage: screening }),
    );
  });
  it('rejects a transition not in the pipeline graph', async () => {
    locked({ id: 4, currentStage: applied, job: { pipeline } });
    stageRepo.findOne.mockResolvedValue(screening);
    transitionRepo.findOneBy.mockResolvedValue(null);
    await expect(
      service.transition(4, { stageId: 2 }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires explicit reopen for a terminal application', async () => {
    locked({
      id: 4,
      currentStage: { ...screening, category: StageCategory.REJECTED },
      job: { pipeline },
    });
    stageRepo.findOne.mockResolvedValue(applied);
    await expect(service.transition(4, { stageId: 1 }, actor)).rejects.toThrow(
      'must be reopened',
    );
  });
  it('reopens rejected applications to an applied stage', async () => {
    const app: any = {
      id: 4,
      candidate: { id: 8 },
      currentStage: { ...screening, category: StageCategory.REJECTED },
      job: { pipeline },
    };
    locked(app);
    stageRepo.findOne.mockResolvedValue(applied);
    await service.reopen(4, { stageId: 1 }, actor);
    expect(app.currentStage).toBe(applied);
  });
  it('returns per-item bulk results', async () => {
    jest
      .spyOn(service, 'transition')
      .mockResolvedValueOnce({ currentStage: screening } as any)
      .mockRejectedValueOnce(new BadRequestException('invalid'));
    const value = await service.bulkMove(
      {
        items: [
          { applicationId: 1, stageId: 2 },
          { applicationId: 2, stageId: 2 },
        ],
      },
      actor,
    );
    expect(value.results).toEqual([
      { applicationId: 1, success: true, stageId: 2 },
      { applicationId: 2, success: false, error: 'invalid' },
    ]);
  });
});
