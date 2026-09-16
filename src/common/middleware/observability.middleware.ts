import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { MetricsService } from '../observability/metrics.service';
import { requestContext } from '../observability/request-context';

@Injectable()
export class ObservabilityMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const supplied = req.header('x-request-id');
    const requestId =
      supplied && /^[A-Za-z0-9._:-]{1,128}$/.test(supplied)
        ? supplied
        : randomUUID();
    const traceparent = req.header('traceparent');
    const started = process.hrtime.bigint();
    res.setHeader('X-Request-Id', requestId);
    res.once('finish', () => {
      const seconds = Number(process.hrtime.bigint() - started) / 1e9;
      const route = req.route?.path
        ? `${req.baseUrl}${String(req.route.path)}`
        : req.path;
      this.metrics.observe(req.method, route, res.statusCode, seconds);
      console.log(
        JSON.stringify({
          level: 'info',
          event: 'http_request',
          timestamp: new Date().toISOString(),
          requestId,
          traceparent,
          method: req.method,
          path: req.originalUrl,
          route,
          statusCode: res.statusCode,
          durationMs: Math.round(seconds * 1000),
        }),
      );
    });
    requestContext.run({ requestId }, next);
  }
}
