import { BadRequestException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobStatus } from './enums/job-status.enum';
import { Role } from '../users/enums/role.enum';

describe('JobsService', () => {
  const repository = { findOne: jest.fn(), save: jest.fn(), merge: jest.fn() };
  const service = new JobsService(repository as any);

  beforeEach(() => jest.clearAllMocks());

  it('publishes a draft job and records the publication time', async () => {
    const job = { id: 1, status: JobStatus.DRAFT };
    repository.findOne.mockResolvedValue(job);
    repository.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.changeStatus(1, JobStatus.PUBLISHED);

    expect(result.status).toBe(JobStatus.PUBLISHED);
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('does not allow archived jobs to change status', async () => {
    repository.findOne.mockResolvedValue({ id: 1, status: JobStatus.ARCHIVED });
    await expect(
      service.changeStatus(1, JobStatus.PUBLISHED),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('roots manager detail access in job ownership', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.findOne(42, { id: 7, role: Role.MANAGER } as any),
    ).rejects.toThrow('Job with ID 42 not found');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 42, owner: { id: 7 } },
    });
  });
});
