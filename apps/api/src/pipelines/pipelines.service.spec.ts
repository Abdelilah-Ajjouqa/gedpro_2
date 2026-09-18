import { BadRequestException } from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
describe('PipelinesService', () => {
  const repo: any = {
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const stageRepo: any = { find: jest.fn() };
  const manager: any = {
    getRepository: jest.fn(() => stageRepo),
    update: jest.fn(),
  };
  const source: any = {
    transaction: jest.fn((cb: any) => cb(manager)),
    getRepository: jest.fn(() => stageRepo),
  };
  const service = new PipelinesService(repo, source);
  beforeEach(() => jest.clearAllMocks());
  it('rejects duplicate stage positions', () => {
    expect(() =>
      service.create({
        name: 'Bad',
        stages: [
          { name: 'A', category: 'applied' as any, position: 1 },
          { name: 'B', category: 'screening' as any, position: 1 },
        ],
      }),
    ).toThrow(BadRequestException);
  });
  it('requires every stage when reordering', async () => {
    stageRepo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    await expect(service.reorder(1, { stageIds: [1] })).rejects.toThrow(
      'every stage',
    );
  });
});
