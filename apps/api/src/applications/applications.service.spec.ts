import { ConflictException, PreconditionFailedException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { StageCategory } from '../pipelines/enums/stage-category.enum';

describe('ApplicationsService Phase 3 transitions', () => {
  const stageRepo = { findOne: jest.fn(), find: jest.fn() };
  const transitionRepo = { findOneBy: jest.fn(), find: jest.fn() };
  const manager: any = {
    createQueryBuilder: jest.fn(),
    getRepository: jest.fn((entity: { name: string }) =>
      entity.name === 'PipelineStage' ? stageRepo : transitionRepo,
    ),
    save: jest.fn(async (value: unknown) => value),
    create: jest.fn((_entity: unknown, value: unknown) => value),
  };
  const source: any = {
    transaction: jest.fn((callback: (value: typeof manager) => unknown) =>
      callback(manager),
    ),
    getRepository: manager.getRepository,
  };
  const timeline = { record: jest.fn() };
  const communications = { queue: jest.fn().mockResolvedValue(undefined) };
  const applications = { createQueryBuilder: jest.fn() };
  const service = new ApplicationsService(
    applications as any,
    source,
    timeline as any,
    communications as any,
  );
  const actor: any = { id: 9, role: 'rh' };
  const pipeline = { id: 3 };
  const applied: any = {
    id: 1,
    name: 'Applied',
    category: StageCategory.APPLIED,
    pipeline,
    archived: false,
    position: 0,
  };
  const screening: any = {
    id: 2,
    name: 'Screening',
    category: StageCategory.SCREENING,
    pipeline,
    archived: false,
    position: 1,
  };

  beforeEach(() => jest.clearAllMocks());

  function locked(app: any) {
    const builder: any = {};
    builder.innerJoinAndSelect = jest.fn(() => builder);
    builder.leftJoinAndSelect = jest.fn(() => builder);
    builder.setLock = jest.fn(() => builder);
    builder.where = jest.fn(() => builder);
    builder.andWhere = jest.fn(() => builder);
    builder.getOne = jest.fn().mockResolvedValue(app);
    manager.createQueryBuilder.mockReturnValue(builder);
  }

  it('moves only through a configured edge and appends history', async () => {
    const app: any = {
      id: 4,
      version: 2,
      candidate: { id: 8 },
      currentStage: applied,
      job: { pipeline },
    };
    locked(app);
    stageRepo.findOne.mockResolvedValue(screening);
    transitionRepo.findOneBy.mockResolvedValue({ id: 1 });
    jest.spyOn(service, 'findOne').mockResolvedValue(app);
    await service.transition(4, { stageId: 2, comment: 'Qualified' }, actor, 2);
    expect(app.currentStage).toBe(screening);
    expect(manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        kind: 'transitioned',
        previousStage: applied,
        newStage: screening,
      }),
    );
  });

  it('rejects stale versions before changing state', async () => {
    locked({ id: 4, version: 3, currentStage: applied, job: { pipeline } });
    await expect(
      service.transition(4, { stageId: 2 }, actor, 2),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('returns stable conflicts for invalid edges and terminal moves', async () => {
    locked({ id: 4, version: 1, currentStage: applied, job: { pipeline } });
    stageRepo.findOne.mockResolvedValue(screening);
    transitionRepo.findOneBy.mockResolvedValue(null);
    await expect(
      service.transition(4, { stageId: 2 }, actor, 1),
    ).rejects.toMatchObject({ response: { code: 'TRANSITION_NOT_ALLOWED' } });

    locked({
      id: 4,
      version: 1,
      currentStage: { ...screening, category: StageCategory.REJECTED },
      job: { pipeline },
    });
    stageRepo.findOne.mockResolvedValue(applied);
    await expect(
      service.transition(4, { stageId: 1 }, actor, 1),
    ).rejects.toMatchObject({
      response: { code: 'TERMINAL_REOPEN_REQUIRED' },
    });
  });

  it('rejects duplicate IDs before a bulk request starts', async () => {
    await expect(
      service.bulkMove(
        {
          stageId: 2,
          items: [
            { applicationId: 1, version: 1 },
            { applicationId: 1, version: 1 },
          ],
        },
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns typed partial bulk results without raw exceptions', async () => {
    jest
      .spyOn(service, 'transition')
      .mockResolvedValueOnce({ id: 1, version: 2 } as any)
      .mockRejectedValueOnce(
        new ConflictException({
          code: 'TRANSITION_NOT_ALLOWED',
          message: 'Not allowed',
        }),
      );
    const value = await service.bulkMove(
      {
        stageId: 2,
        items: [
          { applicationId: 1, version: 1 },
          { applicationId: 2, version: 3 },
        ],
      },
      actor,
    );
    expect(value.results).toEqual([
      {
        applicationId: 1,
        success: true,
        application: { id: 1, version: 2 },
      },
      {
        applicationId: 2,
        success: false,
        code: 'TRANSITION_NOT_ALLOWED',
        message: 'Not allowed',
        currentVersion: undefined,
      },
    ]);
  });
});
