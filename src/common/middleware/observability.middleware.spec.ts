import { ObservabilityMiddleware } from './observability.middleware';
import { MetricsService } from '../observability/metrics.service';

describe('ObservabilityMiddleware', () => {
  it('accepts safe correlation IDs and records completed requests', () => {
    const metrics = new MetricsService();
    const middleware = new ObservabilityMiddleware(metrics);
    const listeners: Record<string, () => void> = {};
    const req = {
      header: (name: string) =>
        name === 'x-request-id' ? 'caller-123' : undefined,
      method: 'GET',
      path: '/health',
      originalUrl: '/v1/health',
    } as any;
    const res = {
      statusCode: 200,
      setHeader: jest.fn(),
      once: (name: string, callback: () => void) =>
        (listeners[name] = callback),
    } as any;
    const log = jest.spyOn(console, 'log').mockImplementation();

    middleware.use(req, res, () => undefined);
    listeners.finish();

    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', 'caller-123');
    expect(metrics.render()).toContain(
      'gedpro_http_requests_total{method="GET",route="/health",status="200"} 1',
    );
    expect(JSON.parse(String(log.mock.calls[0][0]))).toMatchObject({
      requestId: 'caller-123',
      event: 'http_request',
    });
    log.mockRestore();
  });
});
