import { INestApplication } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export function configureApiVersionAlias(app: INestApplication) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.url === '/v1' || req.url.startsWith('/v1/')) {
      req.url = req.url.slice(3) || '/';
      res.setHeader('API-Version', '1');
    } else {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', 'Wed, 16 Sep 2027 00:00:00 GMT');
      res.setHeader('Link', '</v1>; rel="successor-version"');
    }
    next();
  });
}
