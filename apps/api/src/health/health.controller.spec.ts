import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const postgres = { query: jest.fn() };
  const ping = jest.fn();
  const mongo = { db: { admin: () => ({ ping }) } };
  const controller = new HealthController(postgres as any, mongo as any);

  beforeEach(() => jest.clearAllMocks());

  it('reports process health', () => {
    expect(controller.health()).toEqual({ status: 'ok' });
  });

  it('reports readiness when both databases respond', async () => {
    postgres.query.mockResolvedValue([{ '?column?': 1 }]);
    ping.mockResolvedValue({ ok: 1 });

    await expect(controller.readiness()).resolves.toEqual({
      status: 'ready',
      postgres: 'up',
      mongodb: 'up',
    });
  });

  it('returns unavailable when a database check fails', async () => {
    postgres.query.mockRejectedValue(new Error('offline'));
    ping.mockResolvedValue({ ok: 1 });

    await expect(controller.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
