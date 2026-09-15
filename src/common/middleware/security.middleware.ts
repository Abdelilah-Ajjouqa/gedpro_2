import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();
  constructor(private readonly config: ConfigService) {}
  use(req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    const windowMs = Number(this.config.get('RATE_LIMIT_WINDOW_SECONDS') ?? 60) * 1000;
    const auth = req.path.startsWith('/auth/');
    const limit = Number(this.config.get(auth ? 'AUTH_RATE_LIMIT_MAX' : 'RATE_LIMIT_MAX') ?? (auth ? 20 : 120));
    const key = `${req.ip}:${auth ? 'auth' : 'global'}`; const now = Date.now();
    let entry = this.hits.get(key); if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
    entry.count++; this.hits.set(key, entry);
    res.setHeader('RateLimit-Limit', String(limit)); res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    if (entry.count > limit) throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    if (this.hits.size > 10000) for (const [k, value] of this.hits) if (value.resetAt <= now) this.hits.delete(k);
    next();
  }
}
