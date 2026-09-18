import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '../users/enums/role.enum';
import { ReportExportStatus } from './entities/report-export.entity';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  const repository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };
  const jobs = { save: jest.fn(), create: jest.fn() };
  const db = { query: jest.fn() };
  let service: ReportingService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportingService(
      db as never,
      repository as never,
      jobs as never,
    );
  });

  it('rejects an inverted reporting interval', async () => {
    await expect(
      service.summary(
        { from: '2026-02-01T00:00:00Z', to: '2026-01-01T00:00:00Z' },
        { id: 1, role: Role.ADMIN } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('scopes every aggregate query to a manager-owned job', async () => {
    db.query.mockResolvedValue([]);
    await service.summary(
      { from: '2026-01-01T00:00:00Z', to: '2026-02-01T00:00:00Z' },
      { id: 7, role: Role.MANAGER } as never,
    );
    expect(db.query).toHaveBeenCalledTimes(8);
    for (const [sql] of db.query.mock.calls)
      expect(sql).toMatch(/(?:j\."ownerId" = 7|u\.id=7)/);
  });

  it('prevents another non-admin user from reading an export', async () => {
    repository.findOne.mockResolvedValue({
      id: 'x',
      requestedBy: { id: 2 },
      status: ReportExportStatus.COMPLETED,
      expiresAt: new Date(Date.now() + 1000),
    });
    await expect(
      service.getExport('x', { id: 3, role: Role.RH } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks expired exports before returning metadata', async () => {
    const row = {
      id: 'x',
      requestedBy: { id: 2 },
      status: ReportExportStatus.COMPLETED,
      expiresAt: new Date(0),
    };
    repository.findOne.mockResolvedValue(row);
    repository.save.mockResolvedValue(row);
    await service.getExport('x', { id: 2, role: Role.RH } as never);
    expect(row.status).toBe(ReportExportStatus.EXPIRED);
  });
});
