import { CommunicationsService } from './communications.service';
import {
  CommunicationType,
  DeliveryStatus,
} from './entities/communication.entity';

describe('CommunicationsService', () => {
  const template = {
    id: 'template',
    key: 'custom',
    active: true,
    version: 1,
    subject: 'Hello {{name}}',
    htmlBody: '<p>{{message}}</p>',
  };
  const saved: any[] = [];
  const templates: any = { findOne: jest.fn().mockResolvedValue(template) };
  const messages: any = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => {
      const row = { id: 'message-1', ...value };
      saved.push(row);
      return row;
    }),
  };
  const jobs: any = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const service = new CommunicationsService(
    templates,
    messages,
    jobs,
    { findOne: jest.fn() } as any,
    { findOneBy: jest.fn() } as any,
    { findOne: jest.fn() } as any,
    { findOne: jest.fn() } as any,
    { record: jest.fn() } as any,
    { get: jest.fn().mockReturnValue('log') } as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('escapes untrusted template variables and enqueues without delivering inline', async () => {
    const result = await service.queue({
      type: CommunicationType.CUSTOM,
      recipient: 'person@example.com',
      variables: { name: '<Admin>', message: '<script>alert(1)</script>' },
      idempotencyKey: 'custom-message-123',
    });
    expect(result.status).toBe(DeliveryStatus.QUEUED);
    expect(saved[0].subject).toBe('Hello &lt;Admin&gt;');
    expect(saved[0].htmlBody).toContain('&lt;script&gt;');
    expect(jobs.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'send-email' }),
    );
  });

  it('returns the prior communication for a repeated idempotency key', async () => {
    const prior = { id: 'existing', idempotencyKey: 'same-key' };
    messages.findOneBy.mockResolvedValueOnce(prior);
    await expect(
      service.queue({
        type: CommunicationType.CUSTOM,
        recipient: 'person@example.com',
        idempotencyKey: 'same-key',
      }),
    ).resolves.toBe(prior);
    expect(messages.save).not.toHaveBeenCalled();
  });
});
