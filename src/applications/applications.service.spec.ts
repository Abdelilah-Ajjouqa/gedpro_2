import { BadRequestException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationStage } from './enums/application-stage.enum';

describe('ApplicationsService', () => {
  const applications = {};
  const manager = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
    create: jest.fn((_entity, value) => value),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
  };
  const service = new ApplicationsService(applications as any, dataSource as any);

  beforeEach(() => jest.clearAllMocks());

  function lockResult(application: any) {
    const builder: any = {};
    builder.setLock = jest.fn(() => builder);
    builder.where = jest.fn(() => builder);
    builder.getOne = jest.fn().mockResolvedValue(application);
    manager.createQueryBuilder.mockReturnValue(builder);
  }

  it('records a transactional stage transition', async () => {
    const application = { id: 1, currentStage: ApplicationStage.APPLIED };
    lockResult(application);
    manager.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.transition(1, { stage: ApplicationStage.SCREENING, comment: 'Qualified' }, { id: 9 } as any);

    expect(result.currentStage).toBe(ApplicationStage.SCREENING);
    expect(manager.save).toHaveBeenCalledTimes(2);
    expect(manager.create).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ previousStage: ApplicationStage.APPLIED, newStage: ApplicationStage.SCREENING }));
  });

  it('requires a rejection reason', async () => {
    lockResult({ id: 1, currentStage: ApplicationStage.SCREENING });
    await expect(service.transition(1, { stage: ApplicationStage.REJECTED }, { id: 9 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
