import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { Role } from '../users/enums/role.enum';

describe('InterviewsService', () => {
  const repo = () => ({
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
    createQueryBuilder: jest.fn(),
  });
  let service: InterviewsService;
  beforeEach(() => {
    service = new InterviewsService(
      repo() as never,
      repo() as never,
      repo() as never,
      repo() as never,
      repo() as never,
      repo() as never,
      repo() as never,
      repo() as never,
      [] as never,
      { record: jest.fn() } as never,
    );
  });
  it('rejects duplicate scorecard criteria', async () => {
    await expect(
      service.createTemplate({
        name: 'Technical',
        criteria: [
          { key: 'code', label: 'Code', minRating: 1, maxRating: 5 },
          { key: 'code', label: 'Again', minRating: 1, maxRating: 5 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects inverted rating ranges', async () => {
    await expect(
      service.createTemplate({
        name: 'Technical',
        criteria: [{ key: 'code', label: 'Code', minRating: 5, maxRating: 1 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires admin permission for a conflict override', () => {
    expect(() =>
      (service as any).checkOverride(true, { role: Role.RH }, [{ id: 9 }]),
    ).toThrow(ForbiddenException);
  });
  it('returns conflicts when no override is requested', () => {
    expect(() =>
      (service as any).checkOverride(false, { role: Role.ADMIN }, [{ id: 9 }]),
    ).toThrow(ConflictException);
  });
});
