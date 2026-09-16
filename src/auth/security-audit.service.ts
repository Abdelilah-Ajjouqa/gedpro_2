import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityAuditEvent } from './entities/security-audit-event.entity';

@Injectable()
export class SecurityAuditService {
  constructor(
    @InjectRepository(SecurityAuditEvent)
    private readonly events: Repository<SecurityAuditEvent>,
  ) {}
  async record(
    event: string,
    userId: number | null,
    ipAddress?: string,
    metadata: Record<string, unknown> = {},
  ) {
    await this.events.save(
      this.events.create({
        event,
        userId,
        ipAddress: ipAddress ?? null,
        metadata,
      }),
    );
  }
}
