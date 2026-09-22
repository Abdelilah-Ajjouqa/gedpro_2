import { ForbiddenException } from '@nestjs/common';
import { Role } from '../users/enums/role.enum';
import { TimelineEventVisibility } from './entities/timeline-event.entity';
import { TimelineService } from './timeline.service';

describe('TimelineService', () => {
  const query: any = {
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn(),
  };
  Object.keys(query).forEach((key) => {
    if (key !== 'getMany') query[key].mockReturnValue(query);
  });
  const events: any = {
    createQueryBuilder: jest.fn(() => query),
    create: jest.fn((v) => v),
    save: jest.fn(async (v) => v),
  };
  const candidates: any = { findOneBy: jest.fn() };
  const applications: any = {};
  const service = new TimelineService(events, candidates, applications);

  beforeEach(() => jest.clearAllMocks());

  it('filters candidate accounts to candidate-visible events', async () => {
    candidates.findOneBy.mockResolvedValue({
      id: 1,
      normalizedEmail: 'candidate@example.com',
    });
    query.getMany.mockResolvedValue([]);
    await service.candidateTimeline(1, { limit: 20 }, {
      email: 'candidate@example.com',
      role: Role.CANDIDATE,
    } as any);
    expect(query.andWhere).toHaveBeenCalledWith(
      'event.visibility = :visibility',
      { visibility: TimelineEventVisibility.CANDIDATE },
    );
  });

  it('rejects candidate access to another person timeline', async () => {
    candidates.findOneBy.mockResolvedValue({
      id: 1,
      normalizedEmail: 'other@example.com',
    });
    await expect(
      service.candidateTimeline(1, { limit: 20 }, {
        email: 'candidate@example.com',
        role: Role.CANDIDATE,
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('uses a timestamp and UUID cursor for stable pagination', async () => {
    candidates.findOneBy.mockResolvedValue({
      id: 1,
      normalizedEmail: 'candidate@example.com',
    });
    const first = {
      id: '00000000-0000-0000-0000-000000000002',
      createdAt: new Date('2026-01-02T00:00:00Z'),
    };
    const second = {
      id: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    query.getMany.mockResolvedValue([first, second]);
    const page = await service.candidateTimeline(1, { limit: 1 }, {
      email: 'staff@example.com',
      role: Role.RH,
    } as any);
    expect(page.data).toEqual([
      expect.objectContaining({
        id: first.id,
        occurredAt: first.createdAt.toISOString(),
      }),
    ]);
    expect(Buffer.from(page.nextCursor!, 'base64url').toString()).toBe(
      '2026-01-02T00:00:00.000Z|00000000-0000-0000-0000-000000000002',
    );
  });
});
